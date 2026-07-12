import React, { useState, useEffect } from "react";
import { Recipe, Ingredient, IngredientRef } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from "firebase/firestore";
import {
  Calculator,
  IndianRupee,
  Info,
  FileText,
  Sliders,
  TrendingUp,
  Percent,
  Trash2,
  Award,
  Save,
  FolderOpen,
  Plus,
  Zap,
  Check,
  Edit
} from "lucide-react";

interface CostCalculatorViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
}

export default function CostCalculatorView({ recipes, ingredients }: CostCalculatorViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [batchSize, setBatchSize] = useState(100);
  const [packagingCost, setPackagingCost] = useState(12.0); // per cookie packaging (lux boxes) in INR
  const [laborCostHour, setLaborCostHour] = useState(450.0); // researcher labor per hour in INR
  const [bakingHours, setBakingHours] = useState(1.5); // hours of labor required for this batch size
  const [electricityCost, setElectricityCost] = useState(120.0); // electricity cost for the batch in INR
  const [overheadPercentage, setOverheadPercentage] = useState(15); // electric, rent, water overhead %
  const [targetRetailPrice, setTargetRetailPrice] = useState(350.0); // target selling price in INR

  // State of scratchpad formulation ingredients
  const [calculatorIngredients, setCalculatorIngredients] = useState<IngredientRef[]>([]);
  const [scratchpadIngredientId, setScratchpadIngredientId] = useState("");
  const [scratchpadAmount, setScratchpadAmount] = useState(0);

  // Scenario Saving States
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync saved scenarios from Firestore
  useEffect(() => {
    const q = query(collection(db, "costs"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSavedScenarios(list);
      },
      (error) => console.warn("Costs scenarios sync blocked:", error)
    );
    return unsubscribe;
  }, []);

  // Load recipe formula into calculator when selected
  useEffect(() => {
    if (selectedRecipeId) {
      if (selectedRecipeId === "scratchpad") {
        setCalculatorIngredients([]);
      } else {
        const recipe = recipes.find((r) => r.id === selectedRecipeId);
        if (recipe) {
          setCalculatorIngredients(recipe.ingredients);
        }
      }
    }
  }, [selectedRecipeId, recipes]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddScratchpadIngredient = () => {
    if (!scratchpadIngredientId || scratchpadAmount <= 0) return;
    const ingObj = ingredients.find((i) => i.id === scratchpadIngredientId);
    if (!ingObj) return;

    const existing = calculatorIngredients.find((i) => i.id === scratchpadIngredientId);
    if (existing) {
      setCalculatorIngredients(
        calculatorIngredients.map((i) =>
          i.id === scratchpadIngredientId ? { ...i, amount: i.amount + scratchpadAmount } : i
        )
      );
    } else {
      setCalculatorIngredients([
        ...calculatorIngredients,
        {
          id: ingObj.id,
          name: ingObj.name,
          amount: scratchpadAmount,
          unit: ingObj.unit,
          unitCost: ingObj.unitCost
        }
      ]);
    }
    setScratchpadAmount(0);
  };

  const handleRemoveScratchpadIngredient = (id: string) => {
    setCalculatorIngredients(calculatorIngredients.filter((i) => i.id !== id));
  };

  // Cost Modeling Core Mathematical Formulation
  const rawCostPerCookie = calculatorIngredients.reduce((sum, item) => sum + item.amount * item.unitCost, 0);
  const totalRawCostBatch = rawCostPerCookie * batchSize;
  const totalLaborCostBatch = laborCostHour * bakingHours;
  const laborCostPerCookie = totalLaborCostBatch / batchSize;
  const electricityCostPerCookie = electricityCost / batchSize;

  const baseCostPerCookie = rawCostPerCookie + packagingCost + laborCostPerCookie + electricityCostPerCookie;
  const overheadCostPerCookie = baseCostPerCookie * (overheadPercentage / 100);
  const finalCostPerCookie = baseCostPerCookie + overheadCostPerCookie;

  const profitPerCookie = targetRetailPrice - finalCostPerCookie;
  const grossMarginPercentage = targetRetailPrice > 0 ? (profitPerCookie / targetRetailPrice) * 100 : 0;

  // Chart percentages
  const totalSum = rawCostPerCookie + packagingCost + laborCostPerCookie + electricityCostPerCookie + overheadCostPerCookie;
  const rawPct = totalSum > 0 ? (rawCostPerCookie / totalSum) * 100 : 0;
  const pkgPct = totalSum > 0 ? (packagingCost / totalSum) * 100 : 0;
  const lbrPct = totalSum > 0 ? (laborCostPerCookie / totalSum) * 100 : 0;
  const elecPct = totalSum > 0 ? (electricityCostPerCookie / totalSum) * 100 : 0;
  const ovhPct = totalSum > 0 ? (overheadCostPerCookie / totalSum) * 100 : 0;

  // Save Scenario to Firestore
  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    const scenarioId = editingScenarioId || `scenario-${Date.now()}`;
    const scenarioData = {
      id: scenarioId,
      name: scenarioName,
      recipeId: selectedRecipeId,
      batchSize,
      packagingCost,
      laborCostHour,
      bakingHours,
      electricityCost,
      overheadPercentage,
      targetRetailPrice,
      finalCostPerCookie,
      profitPerCookie,
      grossMarginPercentage,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "costs", scenarioId), scenarioData);
      setToastMessage(editingScenarioId ? "Cost scenario modified." : "Cost scenario saved.");
      setScenarioName("");
      setEditingScenarioId(null);
    } catch (err) {
      console.error("Error saving cost configuration:", err);
    }
  };

  const handleLoadScenario = (scenario: any) => {
    setEditingScenarioId(scenario.id);
    setScenarioName(scenario.name);
    setSelectedRecipeId(scenario.recipeId || "");
    setBatchSize(scenario.batchSize || 100);
    setPackagingCost(scenario.packagingCost || 12.0);
    setLaborCostHour(scenario.laborCostHour || 450.0);
    setBakingHours(scenario.bakingHours || 1.5);
    setElectricityCost(scenario.electricityCost || 120.0);
    setOverheadPercentage(scenario.overheadPercentage || 15);
    setTargetRetailPrice(scenario.targetRetailPrice || 350.0);
    setToastMessage(`Loaded scenario: ${scenario.name}`);
  };

  const handleDeleteScenario = async (id: string, name: string) => {
    if (!window.confirm(`Delete scenario "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "costs", id));
      if (editingScenarioId === id) {
        setEditingScenarioId(null);
        setScenarioName("");
      }
      setToastMessage("Scenario deleted.");
    } catch (err) {
      console.error("Error deleting scenario:", err);
    }
  };

  return (
    <div id="cost_calculator" className="space-y-6 animate-fade-in text-[#171717]">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DDC9] pb-5">
        <div>
          <span className="text-xs font-mono text-[#C89A3C] font-bold uppercase tracking-widest bg-[#FFFDF8] px-2.5 py-1 rounded border border-[#E8DDC9]/50">
            Financial R&D Analyzer
          </span>
          <h1 className="text-3xl font-serif tracking-tight text-[#171717] mt-2">
            Unit Cost Calculator
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-2xl">
            Optimize margins, simulate batch sizes, and model ingredient raw compound cost distributions for enterprise production.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Input parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulation Selector */}
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm space-y-4 text-left">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5 border-b border-[#F8F2E9] pb-3">
              <FileText className="w-4 h-4 text-[#C89A3C]" /> Step 1: Choose Formulation Matrix
            </h2>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Load Active Recipe Formula
              </label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full bg-[#FFFDF8] border border-[#E8DDC9] p-3 text-xs rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C]"
              >
                <option value="">-- Select Master Formulation --</option>
                <option value="scratchpad">Custom Formulation Scratchpad (+ Create Custom)</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (V{r.version}.0) — ₹{r.costPerCookie?.toFixed(2)} / cookie raw cost
                  </option>
                ))}
              </select>
            </div>

            {selectedRecipeId === "scratchpad" && (
              /* Custom Ingredients Scratchpad creator */
              <div className="border border-[#E8DDC9] p-4 rounded-xl bg-[#FFFDF8] space-y-4">
                <div className="text-[10px] font-bold tracking-wider text-[#C89A3C] uppercase flex items-center gap-1 font-mono">
                  Scratchpad Formula Editor
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={scratchpadIngredientId}
                    onChange={(e) => setScratchpadIngredientId(e.target.value)}
                    className="flex-1 bg-white border border-[#E8DDC9] p-2.5 text-xs rounded-lg text-slate-700 outline-none"
                  >
                    <option value="">-- Select Ingredient --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={scratchpadAmount || ""}
                    onChange={(e) => setScratchpadAmount(parseFloat(e.target.value))}
                    placeholder="Grams (e.g. 15)"
                    className="w-full sm:w-32 bg-white border border-[#E8DDC9] p-2.5 text-xs rounded-lg text-slate-700 outline-none"
                  />
                  <button
                    onClick={handleAddScratchpadIngredient}
                    className="bg-[#C89A3C] hover:bg-[#B7882C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Scratchpad contents list */}
                {calculatorIngredients.length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    {calculatorIngredients.map((ing) => (
                      <div key={ing.id} className="flex justify-between items-center text-xs p-2 bg-[#F8F2E9]/40 border border-[#E8DDC9]/50 rounded-lg">
                        <span className="font-medium text-[#171717]">{ing.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[#6B6B6B]">{ing.amount}g</span>
                          <span className="font-mono text-[#C89A3C]">₹{(ing.amount * ing.unitCost).toFixed(2)}</span>
                          <button
                            onClick={() => handleRemoveScratchpadIngredient(ing.id)}
                            className="text-[#C94949] hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#6B6B6B] italic py-4">No ingredients added to this scratchpad formulation yet.</div>
                )}
              </div>
            )}
          </div>

          {/* Cost Modeling Parameter Sliders */}
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm space-y-6 text-left">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5 border-b border-[#F8F2E9] pb-3">
              <Sliders className="w-4 h-4 text-[#C89A3C]" /> Step 2: Adjust Overhead, Utilities & Labor Models
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Simulation Batch Size</label>
                  <span className="font-mono font-bold text-[#171717]">{batchSize} cookies</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
                <span className="text-[10px] text-[#6B6B6B] block">Determines labor division weight per individual cookie.</span>
              </div>

              {/* Target Retail Price */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Target Selling Price (₹)</label>
                  <span className="font-mono font-bold text-[#C89A3C]">₹{targetRetailPrice.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="5"
                  value={targetRetailPrice}
                  onChange={(e) => setTargetRetailPrice(parseFloat(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
                <span className="text-[10px] text-[#6B6B6B] block">Target retail pricing for the final consumer functional confection.</span>
              </div>

              {/* Labor Cost Per Hour */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Scientist Labor Rate (₹/hr)</label>
                  <span className="font-mono font-bold text-[#171717]">₹{laborCostHour}/hr</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="10"
                  value={laborCostHour}
                  onChange={(e) => setLaborCostHour(parseInt(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
              </div>

              {/* Labor Hours Required */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Labor hours / batch</label>
                  <span className="font-mono font-bold text-[#171717]">{bakingHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={bakingHours}
                  onChange={(e) => setBakingHours(parseFloat(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
              </div>

              {/* Electricity Cost */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Electricity Cost / Batch (₹)</label>
                  <span className="font-mono font-bold text-[#171717]">₹{electricityCost}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={electricityCost}
                  onChange={(e) => setElectricityCost(parseInt(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
              </div>

              {/* Luxe Custom Box Packaging Cost */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Packaging cost / cookie (₹)</label>
                  <span className="font-mono font-bold text-[#171717]">₹{packagingCost.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="150"
                  step="1"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(parseFloat(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
              </div>

              {/* Utility / Rent Overhead % */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between text-xs">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Overheads Rate (%)</label>
                  <span className="font-mono font-bold text-[#171717]">{overheadPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={overheadPercentage}
                  onChange={(e) => setOverheadPercentage(parseInt(e.target.value))}
                  className="w-full accent-[#C89A3C]"
                />
              </div>
            </div>
          </div>

          {/* Firestore Scenario CRUD Controller */}
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm text-left space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5 border-b border-[#F8F2E9] pb-3">
              <FolderOpen className="w-4 h-4 text-[#C89A3C]" /> Saved Cost Configurations (Firestore Sync)
            </h2>

            <form onSubmit={handleSaveScenario} className="flex gap-2">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario label (e.g. High Protein Winter Run)"
                className="flex-1 bg-slate-50 border border-slate-250 p-2.5 text-xs rounded-lg text-slate-900 focus:outline-none focus:bg-white"
                required
              />
              <button
                type="submit"
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#C89A3C]" />
                {editingScenarioId ? "Update Scenario" : "Save Scenario"}
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="border border-[#E8DDC9]/70 bg-[#FFFDF8] p-3.5 rounded-xl flex items-center justify-between shadow-sm hover:border-[#C89A3C] transition-all"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-slate-800 block truncate max-w-[160px]">{sc.name}</span>
                    <span className="text-[10px] font-mono text-[#6B6B6B] block">Unit Cost: ₹{sc.finalCostPerCookie?.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadScenario(sc)}
                      className="p-1.5 bg-slate-100 hover:bg-[#F8F2E9] text-slate-700 hover:text-[#C89A3C] rounded-lg transition-colors cursor-pointer"
                      title="Load Scenario parameters"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(sc.id, sc.name)}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Purge Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {savedScenarios.length === 0 && (
                <div className="col-span-2 text-center text-xs font-mono text-slate-400 italic py-4">
                  No saved cost modeling configurations found in Firestore. Save your current model parameters!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Output Fact Sheet Card */}
        <div className="space-y-6 text-left">
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1.5 border-b border-[#F8F2E9] pb-3">
              <IndianRupee className="w-4 h-4 text-[#C89A3C]" /> Step 3: Margin Audit Sheet
            </h2>

            {/* Price Ring KPI */}
            <div className="bg-[#FFFDF8] border border-[#E8DDC9] p-5 rounded-2xl space-y-1.5 text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-wider font-bold block">Final Simulated Unit Cost</span>
              <div className="text-4xl font-mono font-extrabold text-[#171717] tracking-tight">
                ₹{finalCostPerCookie.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#6B6B6B] block">Fully-burdened cost per single cookie</span>
            </div>

            {/* Breakdown item list */}
            <div className="space-y-3 pt-1">
              {/* Raw Ingredient Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Raw Ingredients</span>
                  <span className="font-mono font-bold text-[#171717]">₹{rawCostPerCookie.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F8F2E9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C89A3C]" style={{ width: `${rawPct}%` }}></div>
                </div>
              </div>

              {/* Packaging Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Luxe Custom Box Packaging</span>
                  <span className="font-mono font-bold text-[#171717]">₹{packagingCost.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F8F2E9] rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${pkgPct}%` }}></div>
                </div>
              </div>

              {/* Labor Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">R&D Lab Labor Weight</span>
                  <span className="font-mono font-bold text-[#171717]">₹{laborCostPerCookie.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F8F2E9] rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700" style={{ width: `${lbrPct}%` }}></div>
                </div>
              </div>

              {/* Electricity Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" />Electricity Cost</span>
                  <span className="font-mono font-bold text-[#171717]">₹{electricityCostPerCookie.toFixed(4)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F8F2E9] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${elecPct}%` }}></div>
                </div>
              </div>

              {/* Overhead Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Laboratory Utilities Overhead</span>
                  <span className="font-mono font-bold text-[#171717]">₹{overheadCostPerCookie.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F8F2E9] rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: `${ovhPct}%` }}></div>
                </div>
              </div>
            </div>

            {/* Profit Margin metrics block */}
            <div className="pt-4 border-t border-[#F8F2E9] space-y-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[#6B6B6B] block text-[10px] uppercase font-bold tracking-wider font-mono">Gross Profit / Cookie</span>
                  <span className={`text-xl font-bold font-mono ${profitPerCookie >= 0 ? "text-[#3F8C5A]" : "text-[#C94949]"}`}>
                    ₹{profitPerCookie.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#6B6B6B] block text-[10px] uppercase font-bold tracking-wider font-mono">Gross Margin %</span>
                  <span className={`text-xl font-bold font-mono ${grossMarginPercentage >= 50 ? "text-[#3F8C5A]" : grossMarginPercentage >= 25 ? "text-[#C28A2E]" : "text-[#C94949]"}`}>
                    {grossMarginPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Profit Indicator Bar */}
              <div className="p-3 rounded-xl flex items-start gap-2 text-xs bg-[#FFFDF8] border border-[#E8DDC9]">
                <Info className="w-4 h-4 text-[#C89A3C] shrink-0 mt-0.5" />
                <p className="text-[#6B6B6B] leading-relaxed">
                  {grossMarginPercentage >= 60 ? (
                    <span className="text-[#3F8C5A] font-semibold">Premium Efficacy Model: Excellent margins! Suitable for wholesale distributors and venture scale expansion.</span>
                  ) : grossMarginPercentage >= 40 ? (
                    <span className="text-[#C28A2E] font-semibold">Healthy Margin Profile: Exceeds standard organic snack target threshold. Stable.</span>
                  ) : (
                    <span className="text-[#C94949] font-semibold">Margin Warning: Low markup. Adjust allulose dosages or increase simulated retail price targets to safeguard operational profits.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Card */}
          <div className="p-4 bg-white border border-[#E8DDC9] rounded-2xl flex items-center gap-3 text-left">
            <Award className="w-5 h-5 text-[#3F8C5A] shrink-0" />
            <span className="text-xs text-[#6B6B6B] leading-snug">
              <span className="font-bold text-[#171717]">Security Notice:</span> Formulation cost metrics are synchronized in real-time with global supply chains to maintain accurate active pricing indexes.
            </span>
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
