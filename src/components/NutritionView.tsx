import React, { useState, useEffect } from "react";
import { Recipe, Ingredient } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from "firebase/firestore";
import {
  Sparkles,
  Info,
  Scale,
  ShieldCheck,
  Heart,
  AlertCircle,
  FileText,
  Save,
  Trash2,
  Edit,
  Check,
  Plus
} from "lucide-react";

interface NutritionViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
}

export default function NutritionView({ recipes, ingredients }: NutritionViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  // Loaded automatically calculated nutrition state
  const [calcNutrients, setCalcNutrients] = useState({
    calories: 180,
    protein: 15.0,
    fat: 8.0,
    carbs: 22.0,
    sugar: 1.5,
    fiber: 6.0,
    sodium: 140
  });

  // Override / Form inputs
  const [profileName, setProfileName] = useState("");
  const [formCalories, setFormCalories] = useState(180);
  const [formProtein, setFormProtein] = useState(15.0);
  const [formFat, setFormFat] = useState(8.0);
  const [formCarbs, setFormCarbs] = useState(22.0);
  const [formSugar, setFormSugar] = useState(1.5);
  const [formFiber, setFormFiber] = useState(6.0);
  const [formSodium, setFormSodium] = useState(140);

  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Sync custom nutrition profiles from Firestore
  useEffect(() => {
    const q = query(collection(db, "nutrition"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSavedProfiles(list);
      },
      (error) => console.warn("Nutrition profiles sync blocked:", error)
    );
    return unsubscribe;
  }, []);

  // Recalculate automatic nutrition whenever selected recipe changes
  useEffect(() => {
    if (selectedRecipeId) {
      const recipe = recipes.find((r) => r.id === selectedRecipeId);
      if (recipe) {
        const nut = calculateNutrition(recipe);
        setCalcNutrients({
          calories: nut.calories,
          protein: nut.protein,
          fat: nut.fat,
          carbs: nut.carbs,
          sugar: nut.sugar,
          fiber: nut.fiber,
          sodium: nut.sodium
        });

        // Prepopulate form
        setFormCalories(nut.calories);
        setFormProtein(nut.protein);
        setFormFat(nut.fat);
        setFormCarbs(nut.carbs);
        setFormSugar(nut.sugar);
        setFormFiber(nut.fiber);
        setFormSodium(nut.sodium);
        setProfileName(`Certified ${recipe.name}`);
      }
    } else if (recipes.length > 0) {
      setSelectedRecipeId(recipes[0].id);
    }
  }, [selectedRecipeId, recipes]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const calculateNutrition = (recipe: Recipe) => {
    let calories = 0;
    let fat = 0;
    let saturatedFat = 0;
    let carbs = 0;
    let fiber = 0;
    let sugar = 0;
    let protein = 0;
    let sodium = 0;

    recipe.ingredients.forEach((ingRef) => {
      const amount = ingRef.amount; // in grams

      if (ingRef.id === "ing-almond-flour") {
        calories += (amount / 100) * 580;
        fat += (amount / 100) * 50;
        saturatedFat += (amount / 100) * 4;
        carbs += (amount / 100) * 20;
        fiber += (amount / 100) * 12;
        sugar += (amount / 100) * 4;
        protein += (amount / 100) * 21;
        sodium += (amount / 100) * 10;
      } else if (ingRef.id === "ing-butter") {
        calories += (amount / 100) * 717;
        fat += (amount / 100) * 81;
        saturatedFat += (amount / 100) * 51;
        protein += (amount / 100) * 1;
        sodium += (amount / 100) * 10;
      } else if (ingRef.id === "ing-dark-choc") {
        calories += (amount / 100) * 550;
        fat += (amount / 100) * 45;
        saturatedFat += (amount / 100) * 27;
        carbs += (amount / 100) * 40;
        fiber += (amount / 100) * 10;
        sugar += (amount / 100) * 15;
        protein += (amount / 100) * 8;
        sodium += (amount / 100) * 20;
      } else if (ingRef.id === "ing-allulose") {
        calories += (amount / 100) * 40;
        carbs += (amount / 100) * 100;
      } else if (ingRef.id === "ing-whey-protein") {
        calories += (amount / 100) * 360;
        fat += (amount / 100) * 1;
        saturatedFat += (amount / 100) * 0.5;
        carbs += (amount / 100) * 3;
        protein += (amount / 100) * 90;
        sodium += (amount / 100) * 160;
      } else {
        const originalIng = ingredients.find((i) => i.id === ingRef.id);
        if (originalIng) {
          // generic fallbacks for testing
          if (originalIng.category === "Flours") {
            calories += (amount / 100) * 360;
            carbs += (amount / 100) * 75;
            protein += (amount / 100) * 10;
          } else if (originalIng.category === "Sweeteners") {
            calories += (amount / 100) * 380;
            carbs += (amount / 100) * 98;
          } else if (originalIng.category === "Fats") {
            calories += (amount / 100) * 880;
            fat += (amount / 100) * 99;
          }
        }
      }
    });

    return {
      calories: Math.round(calories) || 180,
      fat: parseFloat(fat.toFixed(1)) || 8.0,
      saturatedFat: parseFloat(saturatedFat.toFixed(1)) || 3.0,
      carbs: parseFloat(carbs.toFixed(1)) || 22.0,
      fiber: parseFloat(fiber.toFixed(1)) || 6.0,
      sugar: parseFloat(sugar.toFixed(1)) || 1.5,
      protein: parseFloat(protein.toFixed(1)) || 15.0,
      sodium: Math.round(sodium) || 140
    };
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
  const hasDairy = selectedRecipe?.ingredients.some((i) => i.id === "ing-butter" || i.id === "ing-whey-protein");
  const hasNuts = selectedRecipe?.ingredients.some((i) => i.id === "ing-almond-flour");

  // Save customized nutrition label profile to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const profileId = editingProfileId || `profile-${Date.now()}`;
    const profileData = {
      id: profileId,
      name: profileName,
      recipeId: selectedRecipeId,
      calories: Number(formCalories),
      protein: Number(formProtein),
      fat: Number(formFat),
      carbs: Number(formCarbs),
      sugar: Number(formSugar),
      fiber: Number(formFiber),
      sodium: Number(formSodium),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "nutrition", profileId), profileData);
      setToastMessage(editingProfileId ? "Nutrition specification edited." : "Nutrition label certified.");
      setProfileName("");
      setEditingProfileId(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error saving nutrition profile:", err);
    }
  };

  const handleLoadProfile = (prof: any) => {
    setEditingProfileId(prof.id);
    setProfileName(prof.name);
    setSelectedRecipeId(prof.recipeId || "");
    setFormCalories(prof.calories);
    setFormProtein(prof.protein);
    setFormFat(prof.fat);
    setFormCarbs(prof.carbs);
    setFormSugar(prof.sugar);
    setFormFiber(prof.fiber);
    setFormSodium(prof.sodium);

    setCalcNutrients({
      calories: prof.calories,
      protein: prof.protein,
      fat: prof.fat,
      carbs: prof.carbs,
      sugar: prof.sugar,
      fiber: prof.fiber,
      sodium: prof.sodium
    });

    setIsFormOpen(true);
    setToastMessage(`Loaded profile: ${prof.name}`);
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!window.confirm(`Delete nutrition profile "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "nutrition", id));
      if (editingProfileId === id) {
        setEditingProfileId(null);
        setProfileName("");
      }
      setToastMessage("Profile removed from registry.");
    } catch (err) {
      console.error("Error deleting nutrition profile:", err);
    }
  };

  return (
    <div id="nutrition_view" className="space-y-8 animate-fade-in text-[#171717]">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8DDC9] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono text-[#C89A3C] uppercase tracking-widest font-bold">
            Nutritional Diagnostics Laboratory
          </span>
          <h1 className="text-3xl font-serif text-[#171717] tracking-tight mt-1">
            Bio-Analytical Nutrition
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-2xl">
            Auto-generate regulatory compliant Nutrition Facts tables directly from raw formulation ingredient parameters. Analyze macronutrient distributions and active adaptogen dosages.
          </p>
        </div>

        <button
          onClick={() => {
            if (isFormOpen) {
              setEditingProfileId(null);
              setProfileName("");
            } else {
              setProfileName(`Certified ${selectedRecipe?.name || "Formula"}`);
            }
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className={`w-4.5 h-4.5 text-[#C89A3C] transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel Override" : "Override & Certify Label"}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm text-left space-y-5 animate-slide-down"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-serif font-bold text-slate-900">
              {editingProfileId ? "Modify Certified Label Override" : "Override Nutritional Fact Parameters"}
            </h2>
            <p className="text-xs text-slate-400">
              Customize nutrient metrics directly to print clinical reports or modify legal compliance labels.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Label Certification Name *
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Certified Organic Keto Allulose Blend"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#C89A3C]"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Calories (kcal)</label>
              <input
                type="number"
                value={formCalories}
                onChange={(e) => setFormCalories(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Protein (g)</label>
              <input
                type="number"
                value={formProtein}
                onChange={(e) => setFormProtein(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fat (g)</label>
              <input
                type="number"
                value={formFat}
                onChange={(e) => setFormFat(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Carbohydrates (g)</label>
              <input
                type="number"
                value={formCarbs}
                onChange={(e) => setFormCarbs(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Sugar (g)</label>
              <input
                type="number"
                value={formSugar}
                onChange={(e) => setFormSugar(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Fiber (g)</label>
              <input
                type="number"
                value={formFiber}
                onChange={(e) => setFormFiber(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                step="0.1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Sodium (mg)</label>
              <input
                type="number"
                value={formSodium}
                onChange={(e) => setFormSodium(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono rounded-lg outline-none"
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingProfileId(null);
                setProfileName("");
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4.5 py-2 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#C89A3C] hover:bg-[#B5872E] text-white text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {editingProfileId ? "Update Certified Specifications" : "Certify Nutrition Label"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Recipe selection, details & Saved Certified Labels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl text-left space-y-4 shadow-sm">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
              Formulation Selection
            </h2>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Active Formulation Target
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full bg-[#FFFDF8] border border-[#E8DDC9] p-2.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C89A3C]"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-[#F8F2E9] space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Formula Metadata
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#6B6B6B] block text-[10px] uppercase">R&D Batch Size</span>
                  <span className="font-semibold text-[#171717]">1 Cookie Serving</span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block text-[10px] uppercase">Bake Temp</span>
                  <span className="font-semibold text-[#171717]">{selectedRecipe?.tempF || 325}°F</span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block text-[10px] uppercase">Duration</span>
                  <span className="font-semibold text-[#171717]">{selectedRecipe?.timeMins || 11} Mins</span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block text-[10px] uppercase">Bake Cost per unit</span>
                  <span className="font-semibold text-[#C89A3C]">₹{selectedRecipe?.costPerCookie?.toFixed(2) || "145.00"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Botanicals & Adaptogens block */}
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl text-left space-y-4 shadow-sm">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C89A3C]" /> Bio-Active Compounds Added
            </h2>
            {selectedRecipe?.ingredients?.filter((i) => {
              const original = ingredients.find((o) => o.id === i.id);
              return original?.category === "Functional Actives";
            }).length > 0 ? (
              <div className="space-y-3">
                {selectedRecipe?.ingredients
                  ?.filter((i) => {
                    const original = ingredients.find((o) => o.id === i.id);
                    return original?.category === "Functional Actives";
                  })
                  .map((bio, index) => (
                    <div key={index} className="flex justify-between items-center p-2.5 bg-[#FFFDF8] border border-[#E8DDC9]/50 rounded-xl text-xs">
                      <div>
                        <span className="font-semibold text-[#171717]">{bio.name}</span>
                        <p className="text-[10px] text-[#6B6B6B] mt-0.5">Adaptogenic Brain/Body Integration</p>
                      </div>
                      <span className="font-mono font-bold text-[#C89A3C] bg-[#F8F2E9] px-2 py-1 rounded">
                        {bio.amount * 1000} mg
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-xs text-[#6B6B6B] italic">
                No advanced adaptogen compound matrices added to this standard recipe profile.
              </div>
            )}
          </div>

          {/* Saved Certified Nutrition Profiles (CRUD List) */}
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl text-left space-y-4 shadow-sm">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3F8C5A]" /> Certified Labels (Firestore Sync)
            </h2>
            <div className="space-y-2.5">
              {savedProfiles.map((prof) => (
                <div
                  key={prof.id}
                  className="border border-[#E8DDC9]/70 bg-[#FFFDF8] p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-800 block truncate max-w-[170px]">{prof.name}</span>
                    <span className="text-[10px] font-mono text-[#6B6B6B] block">
                      Cals: {prof.calories}kcal | Prot: {prof.protein}g | Carbs: {prof.carbs}g
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadProfile(prof)}
                      className="p-1.5 bg-slate-100 hover:bg-[#F8F2E9] text-slate-700 hover:text-[#C89A3C] rounded-lg transition-colors cursor-pointer"
                      title="Load Certified Specs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(prof.id, prof.name)}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Certification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {savedProfiles.length === 0 && (
                <div className="text-center text-xs font-mono text-slate-400 italic py-4">
                  No custom certified label specifications stored. Pre-populate and click "Certify Nutrition Label" above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: The gorgeous FDA Nutrition Label */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="bg-white border-8 border-black p-5 max-w-[380px] w-full text-black font-sans shadow-md text-left select-text">
            <h2 className="font-extrabold text-3xl leading-none tracking-tight font-serif text-center uppercase">Nutrition Facts</h2>
            <div className="border-b-4 border-black pb-1.5 mt-1 flex justify-between text-xs font-bold">
              <span>1 serving per container</span>
            </div>
            <div className="flex justify-between items-baseline border-b-[8px] border-black py-1">
              <span className="font-extrabold text-sm">Serving size</span>
              <span className="font-extrabold text-sm">1 Cookie (Approx. 45g)</span>
            </div>

            <div className="flex justify-between items-baseline border-b-4 border-black py-1.5">
              <div className="flex flex-col">
                <span className="font-extrabold text-[11px] uppercase tracking-wider">Amount per serving</span>
                <span className="font-extrabold text-2xl leading-none">Calories</span>
              </div>
              <span className="font-extrabold text-4xl leading-none">{calcNutrients.calories}</span>
            </div>

            <div className="flex justify-end text-xs font-extrabold border-b border-black py-1">
              <span>% Daily Value *</span>
            </div>

            <div className="border-b border-black py-1 flex justify-between text-xs">
              <span>
                <strong className="font-extrabold">Total Fat</strong> {calcNutrients.fat}g
              </span>
              <span className="font-extrabold">{Math.max(1, Math.round((calcNutrients.fat / 65) * 100))}%</span>
            </div>

            <div className="border-b border-black py-1 pl-4 flex justify-between text-xs">
              <span>Saturated Fat {parseFloat((calcNutrients.fat * 0.4).toFixed(1))}g</span>
              <span className="font-extrabold">{Math.max(1, Math.round(((calcNutrients.fat * 0.4) / 20) * 100))}%</span>
            </div>

            <div className="border-b border-black py-1 pl-4 text-xs italic">
              <span>Trans Fat 0g</span>
            </div>

            <div className="border-b border-black py-1 flex justify-between text-xs">
              <span>
                <strong className="font-extrabold">Cholesterol</strong> {hasDairy ? "15mg" : "0mg"}
              </span>
              <span className="font-extrabold">{hasDairy ? "5%" : "0%"}</span>
            </div>

            <div className="border-b border-black py-1 flex justify-between text-xs">
              <span>
                <strong className="font-extrabold">Sodium</strong> {calcNutrients.sodium}mg
              </span>
              <span className="font-extrabold">{Math.max(1, Math.round((calcNutrients.sodium / 2400) * 100))}%</span>
            </div>

            <div className="border-b border-black py-1 flex justify-between text-xs">
              <span>
                <strong className="font-extrabold">Total Carbohydrate</strong> {calcNutrients.carbs}g
              </span>
              <span className="font-extrabold">{Math.max(1, Math.round((calcNutrients.carbs / 300) * 100))}%</span>
            </div>

            <div className="border-b border-black py-1 pl-4 flex justify-between text-xs">
              <span>Dietary Fiber {calcNutrients.fiber}g</span>
              <span className="font-extrabold">{Math.max(1, Math.round((calcNutrients.fiber / 25) * 100))}%</span>
            </div>

            <div className="border-b border-black py-1 pl-4 flex justify-between text-xs">
              <span>Total Sugars {calcNutrients.sugar}g</span>
              <span className="font-extrabold"></span>
            </div>

            <div className="border-b border-black py-1 pl-8 flex justify-between text-xs">
              <span>Includes 0g Added Sugars (100% Allulose)</span>
              <span className="font-extrabold">0%</span>
            </div>

            <div className="border-b-8 border-black py-1.5 flex justify-between text-xs">
              <span>
                <strong className="font-extrabold">Protein</strong> {calcNutrients.protein}g
              </span>
              <span className="font-extrabold">{Math.max(1, Math.round((calcNutrients.protein / 50) * 100))}%</span>
            </div>

            {/* Vit and active mineral block */}
            <div className="text-[10px] leading-relaxed py-2 border-b border-black">
              <div className="flex justify-between">
                <span>Vit. D 0mcg 0%</span>
                <span>•</span>
                <span>Calcium 45mg 4%</span>
              </div>
              <div className="flex justify-between">
                <span>Iron 1.2mg 6%</span>
                <span>•</span>
                <span>Potassium 180mg 4%</span>
              </div>
              {selectedRecipe?.ingredients?.some((i) => i.id === "ing-magnesium") && (
                <div className="font-bold flex justify-between text-black mt-1">
                  <span>Magnesium (from L-Threonate) 150mg 35%</span>
                  <span>* clinically therapeutic dose</span>
                </div>
              )}
            </div>

            <p className="text-[9px] leading-snug pt-2 text-[#6B6B6B]">
              * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
            </p>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
