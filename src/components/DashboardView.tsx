import React, { useState } from "react";
import { Recipe, Ingredient, Experiment } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  Beaker,
  ScrollText,
  AlertTriangle,
  Coins,
  Star,
  Plus,
  Thermometer,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Brain,
  Layers,
  Sparkles,
  Send,
  Zap,
  Award,
  Package,
  Activity,
  ChefHat
} from "lucide-react";

interface DashboardViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  experiments: Experiment[];
  setActiveTab: (tab: string) => void;
  setSelectedRecipeId?: (id: string) => void;
}

export default function DashboardView({
  recipes,
  ingredients,
  experiments,
  setActiveTab,
  setSelectedRecipeId
}: DashboardViewProps) {
  // Compute key startup metrics
  const totalRecipes = recipes.length;
  const totalExperiments = experiments.length;
  const lowStockIngredients = ingredients.filter((ing) => ing.stock <= ing.minStock);
  const lowStockCount = lowStockIngredients.length;

  const avgCost = totalRecipes
    ? recipes.reduce((sum, r) => sum + (r.costPerCookie || 0), 0) / totalRecipes
    : 0;

  const avgTaste = totalRecipes
    ? recipes.reduce((sum, r) => sum + (r.tasteRating || 0), 0) / totalRecipes
    : 0;

  // Recent 3 experiments
  const recentExperiments = [...experiments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Top recipes by taste rating
  const premiumFormulations = [...recipes]
    .sort((a, b) => b.tasteRating - a.tasteRating)
    .slice(0, 3);

  // High active ingredients
  const activeIngredients = [...ingredients]
    .filter((ing) => ing.category === "Functional Actives")
    .slice(0, 4);

  // AI Assistant Chat State
  const [aiInput, setAiInput] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "advisor"; text: string }>>([
    {
      sender: "advisor",
      text: "System initialized. I am your Senior Food Scientist. Ask me to optimize active ingredient dosages, balance lipid profiles, or analyze cookie production costs."
    }
  ]);

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiInput("");
    setAiChat((prev) => [...prev, { sender: "user", text: userMsg }]);

    // Smart food-tech automated response generator
    setTimeout(() => {
      let reply = "I've analyzed the current molecular formulation matrix. ";
      const lower = userMsg.toLowerCase();

      if (lower.includes("optimi") || lower.includes("cost") || lower.includes("cheap")) {
        reply += `To optimize the cost-efficiency of "${recipes[0]?.name || "Cognitive Peak"}" (currently ₹${recipes[0]?.costPerCookie?.toFixed(2) || "145.00"}/unit), I suggest decreasing the L-Theanine density by 0.1g and balancing with fine allulose. This preserves structural snap while shaving off 12% of material costs.`;
      } else if (lower.includes("lions mane") || lower.includes("mushroom") || lower.includes("bitter")) {
        reply += "Lion's Mane extract mycelial earthiness is best masked using high lipid fractions like organic cultured butter paired with dark chocolate polyphenols (85% Guittard). Maintain baking temperatures below 330°F to prevent thermal peptide denaturing.";
      } else if (lower.includes("sleep") || lower.includes("lavender") || lower.includes("relaxation")) {
        reply += "For the Zen Sleep Lavender profile, our clinical bio-efficacy models suggest cross-linking Magnesium L-Threonate with Ashwagandha KSM-66. This compound synergistically stabilizes neural GABA pathways, yielding high relaxation indexes.";
      } else {
        reply += "I recommend maintaining active baking profiles at 325°F for exactly 11 minutes to establish the optimal chewy perimeter. Let's adjust the functional dosing parameters in the Recipe Lab.";
      }

      setAiChat((prev) => [...prev, { sender: "advisor", text: reply }]);
    }, 850);
  };

  // Prepare Chart Data for Recharts (Active Ingredients vs. Cost Profile)
  const chartData = recipes.map((r) => {
    // Sum active functional compound weight
    const activeWeight = r.ingredients
      .filter((i) => {
        const matchingIng = ingredients.find((item) => item.id === i.id);
        return matchingIng?.category === "Functional Actives";
      })
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      name: r.name.split(" ")[0] || r.name,
      "Active Weight (g)": activeWeight,
      "Cost (₹)": parseFloat(r.costPerCookie.toFixed(2)),
      "Rating (x10)": parseFloat((r.tasteRating * 10).toFixed(1))
    };
  });

  return (
    <div id="dashboard_view" className="space-y-6 animate-fade-in text-[#171717]">
      
      {/* Enterprise Dashboard Welcome Card */}
      <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-36 h-36 opacity-[0.02] pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#C89A3C]">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="space-y-1.5 max-w-2xl text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F8F2E9] text-[#C89A3C] rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-[#E8DDC9]/40">
            <Zap className="w-3 h-3" /> ₹1,000 Cr R&D Food Technology Hub
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mt-1 font-serif">
            Formulation Command Center
          </h1>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Pioneering molecular gastronomy through high-potency functional actives, real-time raw ingredient tracking, and precise thermal profile simulation. Verify batch cost-efficiency and therapeutic sensory feedback.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("recipes")}
            className="bg-[#C89A3C] hover:bg-[#B7882C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Formulation
          </button>
          <button
            onClick={() => setActiveTab("advisor")}
            className="bg-white border border-[#E8DDC9] hover:bg-[#FFFDF8] text-[#171717] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Brain className="w-4 h-4 text-[#C89A3C]" /> Molecular Simulator
          </button>
        </div>
      </div>

      {/* Modern High-Density KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1: Active Formulations */}
        <div className="bg-white border border-[#E8DDC9] p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#C89A3C] transition-colors text-left">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Recipes Cataloged</span>
            <ScrollText className="w-4 h-4 text-[#C89A3C]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#171717] font-mono">{totalRecipes}</span>
              <span className="text-[10px] text-[#3F8C5A] font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +18.2%
              </span>
            </div>
            <span className="text-[10px] text-[#6B6B6B] font-medium block mt-0.5">Active molecular formulas</span>
          </div>
        </div>

        {/* KPI 2: Active Stock & Health */}
        <div className="bg-white border border-[#E8DDC9] p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#C89A3C] transition-colors text-left">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Compound Stocks</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? "text-[#C28A2E] animate-pulse" : "text-[#3F8C5A]"}`} />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? "text-[#C28A2E]" : "text-[#171717]"}`}>
                {lowStockCount}
              </span>
              <span className="text-[10px] text-[#6B6B6B]">critical thresholds</span>
            </div>
            <span className="text-[10px] text-[#6B6B6B] font-medium block mt-0.5">
              {lowStockCount > 0 ? `${lowStockCount} ingredients low` : "All compounds stable"}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Test Bakes */}
        <div className="bg-white border border-[#E8DDC9] p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#C89A3C] transition-colors text-left">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Sensory Trials</span>
            <Beaker className="w-4 h-4 text-[#C89A3C]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#171717] font-mono">{totalExperiments}</span>
              <span className="text-[10px] text-[#C89A3C] font-semibold font-mono">L3 Gate</span>
            </div>
            <span className="text-[10px] text-[#6B6B6B] font-medium block mt-0.5">Physical test bake journals</span>
          </div>
        </div>

        {/* KPI 4: Cost per unit */}
        <div className="bg-white border border-[#E8DDC9] p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#C89A3C] transition-colors text-left">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Unit Cost Target</span>
            <Coins className="w-4 h-4 text-[#C89A3C]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#171717] font-mono">₹{avgCost.toFixed(2)}</span>
              <span className="text-[10px] text-[#3F8C5A] font-bold">-4.2%</span>
            </div>
            <span className="text-[10px] text-[#6B6B6B] font-medium block mt-0.5">Average formulation cost</span>
          </div>
        </div>

        {/* KPI 5: Average Taste score */}
        <div className="bg-white border border-[#E8DDC9] p-4 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1 shadow-sm relative overflow-hidden group hover:border-[#C89A3C] transition-colors text-left">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Sensory Score</span>
            <Star className="w-4 h-4 text-[#C28A2E]" fill="currentColor" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#171717] font-mono">{avgTaste.toFixed(1)}/5.0</span>
              <span className="text-[10px] text-[#C89A3C] font-semibold">Top tier</span>
            </div>
            <span className="text-[10px] text-[#6B6B6B] font-medium block mt-0.5">User panels index average</span>
          </div>
        </div>
      </div>

      {/* Large Analytical Chart Component */}
      <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F8F2E9] pb-4 mb-4">
          <div className="text-left">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-1.5 font-serif">
              <Activity className="w-4 h-4 text-[#C89A3C]" /> Formulation Cost vs. Active Bio-Compound Weight
            </h2>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Comparing therapeutic bio-active concentration weight (grams) against production cost (₹) and rating scale. No unrefined color fills.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#C89A3C] inline-block"></span>
              <span className="text-[#6B6B6B]">Active Weight (g)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#3F8C5A] inline-block"></span>
              <span className="text-[#6B6B6B]">Cost per Cookie (₹)</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F8F2E9" />
              <XAxis dataKey="name" stroke="#6B6B6B" fontSize={11} tickLine={false} />
              <YAxis stroke="#6B6B6B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171717", border: "none", borderRadius: "8px", color: "#FFFDF8" }}
                itemStyle={{ color: "#FFFDF8", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="Active Weight (g)" stroke="#C89A3C" strokeWidth={2.5} fillOpacity={0.03} fill="#C89A3C" />
              <Area type="monotone" dataKey="Cost (₹)" stroke="#3F8C5A" strokeWidth={2.5} fillOpacity={0.03} fill="#3F8C5A" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid Area: Recipe Cards, Bio-Compound Stocks & AI assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recipe Cards & Formulations */}
        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl lg:col-span-2 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F8F2E9] pb-3">
              <h2 className="text-sm font-bold text-[#171717] flex items-center gap-1.5 font-serif">
                <ChefHat className="w-4 h-4 text-[#C89A3C]" /> High-Potency Formulation Recipes
              </h2>
              <button
                onClick={() => setActiveTab("recipes")}
                className="text-xs font-mono text-[#C89A3C] hover:underline flex items-center gap-0.5 font-bold"
              >
                All Formulas <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {premiumFormulations.map((recipe) => {
                // Find functional actives
                const actives = recipe.ingredients.filter((i) => {
                  const item = ingredients.find((ing) => ing.id === i.id);
                  return item?.category === "Functional Actives";
                });

                return (
                  <div
                    key={recipe.id}
                    className="border border-[#E8DDC9] p-4 bg-[#FFFDF8] rounded-xl hover:border-[#C89A3C] transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:bg-white text-left"
                    onClick={() => {
                      if (setSelectedRecipeId) setSelectedRecipeId(recipe.id);
                      setActiveTab("recipes");
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#C89A3C] font-bold tracking-wider uppercase">
                          {recipe.category}
                        </span>
                        <span className="text-[10px] font-mono bg-[#F8F2E9] text-[#6B6B6B] px-1.5 py-0.5 rounded border border-[#E8DDC9]/40">
                          V{recipe.version}.0
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#171717] group-hover:text-[#C89A3C] transition-colors font-serif">
                        {recipe.name}
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B] line-clamp-2 leading-relaxed">
                        {recipe.notes}
                      </p>
                    </div>

                    {/* Active Molecule dosage pills */}
                    <div className="flex flex-wrap gap-1">
                      {actives.map((act) => (
                        <span key={act.id} className="text-[9px] font-mono font-semibold bg-[#F8F2E9] text-[#C89A3C] border border-[#E8DDC9]/50 px-1.5 py-0.5 rounded-full">
                          {act.name.split(" ")[0]}: {act.amount}{act.unit}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#F8F2E9] flex items-center justify-between text-[11px] font-mono text-[#6B6B6B]">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5" /> {recipe.tempF}°F</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {recipe.timeMins}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#171717] font-bold">
                        <span>★ {recipe.tasteRating}</span>
                        <span>•</span>
                        <span>₹{recipe.costPerCookie.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-3 border-t border-[#F8F2E9] flex items-center justify-between text-xs text-[#6B6B6B] text-left">
            <span>Clinical validation standard: FDA-GRAS guidelines certified</span>
            <span className="font-mono text-[10px] text-[#C89A3C] font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> SECURE TRACEABILITY VERIFIED
            </span>
          </div>
        </div>

        {/* Right Side: High-Active Compound Inventory Stock Levels */}
        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl shadow-sm space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-[#F8F2E9] pb-3">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-1.5 font-serif">
              <Package className="w-4 h-4 text-[#C89A3C]" /> Bio-Active Compounds Inventory
            </h2>
            <button
              onClick={() => setActiveTab("inventory")}
              className="text-xs font-mono text-[#C89A3C] hover:underline flex items-center gap-0.5 font-bold"
            >
              Stock <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {activeIngredients.map((ing) => {
              const stockRatio = Math.min(100, (ing.stock / (ing.minStock * 4)) * 100);
              const isLow = ing.stock <= ing.minStock;
              return (
                <div key={ing.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#171717] truncate pr-4">{ing.name}</span>
                    <span className={`font-mono text-xs ${isLow ? "text-[#C28A2E] font-bold animate-pulse" : "text-[#6B6B6B]"}`}>
                      {ing.stock} {ing.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F8F2E9] rounded-full overflow-hidden border border-[#E8DDC9] relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-[#C28A2E]" : "bg-[#C89A3C]"}`}
                      style={{ width: `${stockRatio}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#6B6B6B]">
                    <span>Reorder threshold: {ing.minStock}{ing.unit}</span>
                    <span>{ing.supplier}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#F8F2E9] rounded-xl border border-[#E8DDC9] text-xs text-[#C89A3C] leading-relaxed">
            <span className="font-bold">Automation Alert:</span> Auto-purchasing pipelines are configured to trigger automatically once any bioactive compound hits &lt; min threshold.
          </div>
        </div>
      </div>

      {/* Grid: Experiment Tracker summary + Interactive AI Assistant Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Experiments Tracker list */}
        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl lg:col-span-2 space-y-4 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-[#F8F2E9] pb-3">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-1.5 font-serif">
              <Layers className="w-4 h-4 text-[#C89A3C]" /> High-Resolution R&D Journals
            </h2>
            <button
              onClick={() => setActiveTab("experiments")}
              className="text-xs font-mono text-[#C89A3C] hover:underline flex items-center gap-0.5 font-bold"
            >
              All Trials <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentExperiments.map((exp) => (
              <div
                key={exp.id}
                className="border border-[#E8DDC9] bg-[#FFFDF8] p-4 rounded-xl hover:border-[#C89A3C] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold text-[#6B6B6B]">{exp.date}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      exp.status === "Successful"
                        ? "bg-[#3F8C5A]/10 text-[#3F8C5A] border border-[#3F8C5A]/30"
                        : exp.status === "Failed"
                        ? "bg-[#C94949]/10 text-[#C94949] border border-[#C94949]/30"
                        : "bg-[#C28A2E]/10 text-[#C28A2E] border border-[#C28A2E]/30"
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#171717] font-serif">{exp.title}</h3>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-xl">
                    <span className="font-semibold text-[#171717]">Changed:</span> {exp.variablesChanged}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-[#171717]">T: {exp.tasteRating}/5</div>
                    <div className="text-[9px] text-[#6B6B6B]">Taste index</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#171717]">X: {exp.textureRating}/5</div>
                    <div className="text-[9px] text-[#6B6B6B]">Texture score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Molecular AI Assistant */}
        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl shadow-sm flex flex-col h-[320px] text-left">
          <div className="flex items-center justify-between border-b border-[#F8F2E9] pb-3 shrink-0">
            <h2 className="text-sm font-bold text-[#171717] flex items-center gap-1.5 font-serif">
              <Sparkles className="w-4 h-4 text-[#C89A3C] animate-pulse" /> AI Scientist
            </h2>
            <span className="w-2 h-2 rounded-full bg-[#3F8C5A]"></span>
          </div>

          {/* Conversation history area */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar text-xs">
            {aiChat.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed text-xs ${
                  msg.sender === "user"
                    ? "bg-[#C89A3C] text-white ml-auto"
                    : "bg-[#FFFDF8] text-[#171717] mr-auto border border-[#E8DDC9]"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Chat Form panel */}
          <form onSubmit={handleSendAiMessage} className="mt-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask AI optimizer (e.g. reduce cost)..."
              className="flex-1 bg-[#F8F2E9] border border-[#E8DDC9] px-3 py-2 rounded-lg text-xs placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white"
            />
            <button
              type="submit"
              className="p-2 bg-[#C89A3C] hover:bg-[#B7882C] text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
