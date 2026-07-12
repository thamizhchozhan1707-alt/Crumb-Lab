import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { seedDatabase } from "./seed";

// Views
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import RecipeLabView from "./components/RecipeLabView";
import ExperimentTrackerView from "./components/ExperimentTrackerView";
import IngredientInventoryView from "./components/IngredientInventoryView";
import CostCalculatorView from "./components/CostCalculatorView";
import AnalyticsView from "./components/AnalyticsView";
import AICookieAdvisorView from "./components/AICookieAdvisorView";
import SettingsView from "./components/SettingsView";
import IngredientsRegistryView from "./components/IngredientsRegistryView";
import NutritionView from "./components/NutritionView";
import DocumentsView from "./components/DocumentsView";

// Types
import { Recipe, Ingredient, Experiment } from "./types";

// Static premium fallback data for instantaneous startup
import { initialIngredients, initialRecipes, initialExperiments } from "./constants/initialData";

// Icons
import {
  LayoutDashboard,
  ChefHat,
  TestTube,
  FileSpreadsheet,
  Calculator,
  LineChart,
  Sparkles,
  Settings,
  Menu,
  X,
  LogOut,
  Beaker,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Search,
  Bell,
  Globe,
  Lock,
  Scale,
  BookOpen
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Firestore & Fallback States
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperiments);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Auth Listener and Auto Anonymous Sign-In
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Sync user profile with Firestore users collection in real time
        try {
          const { doc, setDoc } = await import("firebase/firestore");
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email || `${currentUser.uid}@crumblab.co`,
            role: currentUser.isAnonymous ? "Guest Scientist" : "Principal Scientist",
            displayName: currentUser.displayName || "Research Scientist",
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn("Failed to write/sync user profile to Firestore:", err);
        }
        setCheckingAuth(false);
      } else {
        // Trigger silent background sign-in so user never has a gated experience
        try {
          const res = await signInAnonymously(auth);
          setUser(res.user);
        } catch (err: any) {
          if (err?.code === "auth/admin-restricted-operation") {
            console.info("Silent anonymous sign-in is disabled/restricted in the Firebase Console. Operating in guest scientist mode.");
          } else {
            console.warn("Silent anonymous sign-in failed:", err);
          }
        } finally {
          setCheckingAuth(false);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Real-time Database Synchronization
  useEffect(() => {
    if (!user) {
      // Default to premium static local workspace for offline/guest mode bypass
      setRecipes(initialRecipes);
      setIngredients(initialIngredients);
      setExperiments(initialExperiments);
      setInventoryLogs([]);
      return;
    }

    // Seed database automatically if empty, then sync
    seedDatabase().then(() => {
      // 1. Recipes sync
      const recipesQuery = query(collection(db, "recipes"));
      const unsubscribeRecipes = onSnapshot(recipesQuery, (snapshot) => {
        const list: Recipe[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Recipe);
        });
        setRecipes(list);
      }, (error) => console.warn("Recipes sync blocked, using cache:", error));

      // 2. Ingredients sync
      const ingredientsQuery = query(collection(db, "ingredients"));
      const unsubscribeIngredients = onSnapshot(ingredientsQuery, (snapshot) => {
        const list: Ingredient[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Ingredient);
        });
        setIngredients(list);
      }, (error) => console.warn("Ingredients sync blocked, using cache:", error));

      // 3. Experiments sync
      const experimentsQuery = query(collection(db, "experiments"));
      const unsubscribeExperiments = onSnapshot(experimentsQuery, (snapshot) => {
        const list: Experiment[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Experiment);
        });
        setExperiments(list);
      }, (error) => console.warn("Experiments sync blocked, using cache:", error));

      // 4. Inventory Logs sync (real-time audit ledger)
      const inventoryQuery = query(collection(db, "inventory"));
      const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setInventoryLogs(list);
      }, (error) => console.warn("Inventory logs sync blocked:", error));

      return () => {
        unsubscribeRecipes();
        unsubscribeIngredients();
        unsubscribeExperiments();
        unsubscribeInventory();
      };
    }).catch((err) => {
      console.warn("Seeding or real-time sync failed:", err);
    });
  }, [user]);

  const refreshAllData = () => {
    console.log("Syncing database tables...");
  };

  const handleDeleteRecipe = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "recipes", id));
      } catch (err) {
        console.error("Error deleting from Firestore:", err);
      }
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecipeId === id) {
      setSelectedRecipeId(null);
    }
  };

  // Define active user labels safely
  const isRealUser = user && !user.isAnonymous;
  const userEmailLabel = isRealUser ? user.email : "guest.scientist@crumblab.co";
  const userInitials = isRealUser && user.email ? user.email.substring(0, 2).toUpperCase() : "GS";

  // Sidebar navigation options
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "recipes", label: "Recipes", icon: ChefHat },
    { id: "experiments", label: "Experiments", icon: TestTube },
    { id: "ingredients", label: "Ingredients", icon: Beaker },
    { id: "inventory", label: "Inventory", icon: FileSpreadsheet },
    { id: "calculator", label: "Cost Calculator", icon: Calculator },
    { id: "nutrition", label: "Nutrition", icon: Scale },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "advisor", label: "AI Scientist", icon: Sparkles },
    { id: "documents", label: "Documents", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            recipes={recipes}
            ingredients={ingredients}
            experiments={experiments}
            setActiveTab={setActiveTab}
            setSelectedRecipeId={setSelectedRecipeId}
          />
        );
      case "recipes":
        return (
          <RecipeLabView
            recipes={recipes}
            ingredients={ingredients}
            selectedRecipeId={selectedRecipeId}
            setSelectedRecipeId={setSelectedRecipeId}
            onRefresh={refreshAllData}
            userEmail={userEmailLabel}
            onDeleteRecipe={handleDeleteRecipe}
          />
        );
      case "experiments":
        return (
          <ExperimentTrackerView
            experiments={experiments}
            recipes={recipes}
            onRefresh={refreshAllData}
            userEmail={userEmailLabel}
          />
        );
      case "ingredients":
        return <IngredientsRegistryView ingredients={ingredients} />;
      case "inventory":
        return (
          <IngredientInventoryView
            ingredients={ingredients}
            inventoryLogs={inventoryLogs}
            userEmail={userEmailLabel}
            onRefresh={refreshAllData}
          />
        );
      case "calculator":
        return <CostCalculatorView recipes={recipes} ingredients={ingredients} />;
      case "nutrition":
        return <NutritionView recipes={recipes} ingredients={ingredients} />;
      case "analytics":
        return <AnalyticsView recipes={recipes} ingredients={ingredients} experiments={experiments} />;
      case "advisor":
        return <AICookieAdvisorView recipes={recipes} ingredients={ingredients} />;
      case "documents":
        return <DocumentsView />;
      case "settings":
        return (
          <SettingsView
            userEmail={userEmailLabel}
            onRefreshAllData={refreshAllData}
            onLogout={() => {
              auth.signOut();
              setUser(null);
              setShowLoginModal(true);
            }}
          />
        );
      default:
        return <div className="text-center py-20 text-xs font-mono text-gray-400">Section pending deployment.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F2E9] text-[#171717] flex flex-col font-sans select-none">
      
      {/* Top Banner Navigation (Corporate & Real-Time Bio-Analytics Status) */}
      <div className="bg-[#171717] text-[#FFFDF8] text-[11px] font-mono px-4 py-2 flex items-center justify-between z-50 shrink-0 border-b border-[#E8DDC9]/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3F8C5A] animate-pulse"></span>
            <span className="text-[#FFFDF8]/80 font-semibold tracking-wider">SECURE CONNECTIVITY</span>
          </div>
          <span className="text-[#6B6B6B] hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-[#C89A3C]" />
            <span>BIO-ACTIVE PIPELINES: <span className="text-[#3F8C5A] font-semibold">100% OPERATIONAL</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-slate-400 hidden sm:inline">
            NODE IP: <span className="text-slate-200">127.0.0.1</span>
          </div>
          <span className="text-slate-600">/</span>
          <div className="text-slate-300">
            DEPT: <span className="text-[#C89A3C] font-semibold font-serif">MOLECULAR COOKIE DESIGN (R&D)</span>
          </div>
        </div>
      </div>

      {/* Main Structural Frame */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-[calc(100vh-32px)]">
        
        {/* Left Professional Sidebar */}
        <aside
          className={`lg:w-64 bg-[#FFFDF8] border-r border-[#E8DDC9] flex flex-col justify-between p-5 fixed lg:sticky top-[49px] lg:top-0 h-[calc(100vh-81px)] lg:h-full z-40 transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0 w-full" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="space-y-6 overflow-y-auto no-scrollbar flex-1 pb-4">
            
            {/* Enterprise Logo Header */}
            <div className="pb-4 border-b border-[#E8DDC9]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C89A3C] flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                  C
                </div>
                <div>
                  <h1 className="text-base font-bold text-[#171717] leading-tight tracking-tight">
                    CRUMB<span className="text-[#C89A3C] font-extrabold font-serif">LAB</span>
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] font-medium font-mono">
                    Molecular Bioscience
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Quick lookup..."
                className="w-full bg-[#F8F2E9] border border-[#E8DDC9] pl-9 pr-3 py-2 text-xs rounded-lg placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white"
                readOnly
                onClick={() => console.log("Global search")}
              />
            </div>

            {/* Nav list */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-3 transition-all text-xs font-semibold rounded-lg cursor-pointer ${
                      isActive
                        ? "bg-[#F8F2E9] text-[#C89A3C] font-bold border-l-2 border-[#C89A3C] rounded-r-lg"
                        : "bg-transparent text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F8F2E9]/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C89A3C]" : "text-[#6B6B6B]"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Component */}
          <div className="mt-auto pt-4 border-t border-[#E8DDC9]/50 space-y-4">
            
            {/* Active System Mode Quote Card */}
            <div className="p-3.5 bg-[#F8F2E9]/60 rounded-xl border border-[#E8DDC9] text-left hidden lg:block">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#C89A3C] tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI SYSTEM ONLINE
              </div>
              <p className="text-[11px] leading-relaxed text-[#6B6B6B] mt-1.5 italic">
                Optimizing gluten-free starch profiles with active enzymes.
              </p>
            </div>

            {/* Active User session profile widget */}
            <div className="flex items-center justify-between gap-2 bg-[#F8F2E9]/40 p-2.5 rounded-xl border border-[#E8DDC9]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFFDF8] border border-[#E8DDC9] flex items-center justify-center text-xs font-bold text-[#C89A3C] shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-wider block leading-none">
                    {isRealUser ? "AUTHORIZED" : "GUEST MODE"}
                  </p>
                  <p className="text-xs text-[#171717] font-bold truncate mt-0.5">
                    {isRealUser ? userEmailLabel : "Guest Scientist"}
                  </p>
                </div>
              </div>
              {!isRealUser && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-2 py-1 bg-[#C89A3C] hover:bg-[#B7882C] text-white rounded text-[10px] font-bold tracking-wider uppercase font-mono shadow-sm shrink-0"
                >
                  Sync
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3F8C5A]" /> SECURED ENDPOINT NODE
            </div>
          </div>
        </aside>

        {/* Dynamic Multi-Window Central Work Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F2E9]">
          
          {/* Top Integrated Navigation Header */}
          <header className="h-16 border-b border-[#E8DDC9] flex items-center justify-between px-6 lg:px-8 bg-[#FFFDF8]/85 backdrop-blur-md shrink-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-[#6B6B6B] focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-[#6B6B6B] font-mono text-xs hidden sm:inline">PATH /</span>
                <h2 className="font-serif font-bold text-[#171717] capitalize tracking-tight text-sm">
                  {activeTab === "dashboard" ? "Laboratory Overview" : activeTab.replace("-", " ")}
                </h2>
                <span className="bg-[#F8F2E9] text-[#C89A3C] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#E8DDC9]/50">
                  SECURE-v3.0
                </span>
              </div>
            </div>

            {/* Right Header Navigation Metrics */}
            <div className="flex items-center gap-4">
              
              {/* Lab Status Indicators */}
              <div className="hidden xl:flex items-center gap-4 border-r border-[#E8DDC9] pr-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[#6B6B6B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F8C5A]"></span>
                  <span>HEATING COILS: OK</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6B6B6B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F8C5A]"></span>
                  <span>DOSER CALIBRATION: OK</span>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => refreshAllData()}
                  className="p-1.5 text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F8F2E9] rounded-lg transition-colors cursor-pointer"
                  title="Resync Data Pipeline"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div className="relative p-1.5 text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F8F2E9] rounded-lg transition-colors cursor-pointer">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C94949] rounded-full"></span>
                </div>
              </div>

              {/* Profile Selector */}
              <div className="flex items-center gap-3 pl-3 border-l border-[#E8DDC9]">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-wider font-semibold">Active Session</p>
                  <p className="text-xs font-bold text-[#171717]">
                    {userEmailLabel}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#E8DDC9] bg-[#FFFDF8] flex items-center justify-center font-mono font-bold text-xs text-[#C89A3C] shadow-sm shrink-0">
                  {userInitials}
                </div>
              </div>
            </div>
          </header>

          {/* Central Scrollable View Section */}
          <section className="flex-1 p-6 lg:p-8 overflow-y-auto no-scrollbar bg-[#F8F2E9]">
            <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
              {renderActiveView()}
            </div>
          </section>
        </main>
      </div>

      {/* Cloud Authentication Slideover Modal (Prompted only when needed) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLoginModal(false)}></div>
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md transform transition-all duration-300">
              <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-scroll">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-bold">Authorized Cloud Sync</h2>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 py-6 px-4 sm:px-6">
                  <LoginView onLoginSuccess={() => {
                    setShowLoginModal(false);
                    refreshAllData();
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
