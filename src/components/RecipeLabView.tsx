import React, { useState, useEffect } from "react";
import { Recipe, Ingredient, IngredientRef, RecipeVersion } from "../types";
import { db, uploadCookiePhoto } from "../firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import {
  Search,
  Plus,
  Star,
  Thermometer,
  Clock,
  Sparkles,
  Trash2,
  History,
  Eye,
  Upload,
  Check,
  ChevronRight,
  PlusCircle,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";

interface RecipeLabViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  selectedRecipeId: string | null;
  setSelectedRecipeId: (id: string | null) => void;
  onRefresh: () => void;
  userEmail?: string;
  onDeleteRecipe?: (id: string) => Promise<void>;
}

export default function RecipeLabView({
  recipes,
  ingredients,
  selectedRecipeId,
  setSelectedRecipeId,
  onRefresh,
  userEmail,
  onDeleteRecipe
}: RecipeLabViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Cognitive/Nootropic");
  const [formInstructions, setFormInstructions] = useState("");
  const [formTempF, setFormTempF] = useState(325);
  const [formTimeMins, setFormTimeMins] = useState(12);
  const [formTexture, setFormTexture] = useState("");
  const [formTaste, setFormTaste] = useState(5);
  const [formNotes, setFormNotes] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Custom Confirmation & Toast States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeIdToDelete, setRecipeIdToDelete] = useState<string | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<RecipeVersion | null>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);

  // Automatically hide notifications
  useEffect(() => {
    if (deleteSuccessMessage) {
      const timer = setTimeout(() => {
        setDeleteSuccessMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccessMessage]);

  useEffect(() => {
    if (restoreSuccessMessage) {
      const timer = setTimeout(() => {
        setRestoreSuccessMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [restoreSuccessMessage]);

  // Selected Ingredients for recipe formula
  const [formIngredients, setFormIngredients] = useState<IngredientRef[]>([]);
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState("");
  const [amountToAdd, setAmountToAdd] = useState<number>(0);

  // Filter recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.notes.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Automatically select the first recipe if none is selected
  useEffect(() => {
    if (!selectedRecipeId && filteredRecipes.length > 0) {
      setSelectedRecipeId(filteredRecipes[0].id);
    }
  }, [recipes, selectedRecipeId]);

  const activeRecipe = recipes.find((r) => r.id === selectedRecipeId);

  // Compute form cost
  const computeFormCostPerCookie = () => {
    const totalCost = formIngredients.reduce((sum, item) => sum + item.amount * item.unitCost, 0);
    return totalCost || 50.0; // default minimum placeholder
  };

  const handleAddIngredientToForm = () => {
    if (!selectedIngredientToAdd || amountToAdd <= 0) return;
    const ingObj = ingredients.find((i) => i.id === selectedIngredientToAdd);
    if (!ingObj) return;

    // Check if already in form
    const existing = formIngredients.find((i) => i.id === selectedIngredientToAdd);
    if (existing) {
      setFormIngredients(
        formIngredients.map((i) =>
          i.id === selectedIngredientToAdd ? { ...i, amount: i.amount + amountToAdd } : i
        )
      );
    } else {
      setFormIngredients([
        ...formIngredients,
        {
          id: ingObj.id,
          name: ingObj.name,
          amount: amountToAdd,
          unit: ingObj.unit,
          unitCost: ingObj.unitCost
        }
      ]);
    }
    setAmountToAdd(0);
  };

  const handleRemoveIngredientFromForm = (id: string) => {
    setFormIngredients(formIngredients.filter((i) => i.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadCookiePhoto(file);
      setFormImageUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Open Form
  const openNewForm = () => {
    setEditId(null);
    setFormName("");
    setFormCategory("Cognitive/Nootropic");
    setFormInstructions("");
    setFormTempF(325);
    setFormTimeMins(12);
    setFormTexture("Crisp borders with a chewy moist center core.");
    setFormTaste(5);
    setFormNotes("");
    setFormImageUrl("");
    setFormIngredients([]);
    setIsEditing(true);
  };

  const openEditForm = (recipe: Recipe) => {
    setEditId(recipe.id);
    setFormName(recipe.name);
    setFormCategory(recipe.category);
    setFormInstructions(recipe.instructions);
    setFormTempF(recipe.tempF);
    setFormTimeMins(recipe.timeMins);
    setFormTexture(recipe.textureAnalysis);
    setFormTaste(recipe.tasteRating);
    setFormNotes(recipe.notes);
    setFormImageUrl(recipe.imageUrl || "");
    setFormIngredients(recipe.ingredients);
    setIsEditing(true);
  };

  // Save formulation (with Version Control Archiving!)
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const calculatedCost = computeFormCostPerCookie();
    const researcher = userEmail || "R&D Principal Scientist";
    const nowStr = new Date().toISOString();

    let newVersionNum = 1;
    let updatedHistory: RecipeVersion[] = [];

    if (editId) {
      // Find the old recipe to archive
      const oldRecipe = recipes.find((r) => r.id === editId);
      if (oldRecipe) {
        newVersionNum = oldRecipe.version + 1;
        // Create archive log
        const archiveItem: RecipeVersion = {
          version: oldRecipe.version,
          updatedAt: oldRecipe.updatedAt,
          updatedBy: oldRecipe.updatedBy,
          ingredients: oldRecipe.ingredients,
          instructions: oldRecipe.instructions,
          tempF: oldRecipe.tempF,
          timeMins: oldRecipe.timeMins,
          notes: oldRecipe.notes
        };
        updatedHistory = oldRecipe.history ? [archiveItem, ...oldRecipe.history] : [archiveItem];
      }
    }

    const recipeData: Recipe = {
      id: editId || `rec-${Date.now()}`,
      name: formName,
      version: newVersionNum,
      category: formCategory,
      ingredients: formIngredients,
      instructions: formInstructions,
      tempF: Number(formTempF),
      timeMins: Number(formTimeMins),
      textureAnalysis: formTexture,
      tasteRating: Number(formTaste),
      costPerCookie: calculatedCost,
      notes: formNotes,
      imageUrl: formImageUrl || undefined,
      createdAt: editId ? recipes.find((r) => r.id === editId)?.createdAt || nowStr : nowStr,
      updatedAt: nowStr,
      updatedBy: researcher,
      history: updatedHistory
    };

    try {
      await setDoc(doc(db, "recipes", recipeData.id), recipeData);
      setIsEditing(false);
      setSelectedRecipeId(recipeData.id);
      onRefresh();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipeIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmAndExecuteDelete = async () => {
    if (!recipeIdToDelete) return;
    try {
      if (onDeleteRecipe) {
        await onDeleteRecipe(recipeIdToDelete);
      } else {
        await deleteDoc(doc(db, "recipes", recipeIdToDelete));
        setSelectedRecipeId(null);
        onRefresh();
      }
      setDeleteSuccessMessage("Formulation deleted successfully.");
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteConfirm(false);
      setRecipeIdToDelete(null);
    }
  };

  const handleRestoreVersion = (oldVer: RecipeVersion) => {
    setVersionToRestore(oldVer);
    setShowRestoreConfirm(true);
  };

  const confirmAndExecuteRestore = async () => {
    if (!activeRecipe || !versionToRestore) return;
    const nowStr = new Date().toISOString();
    const restoredRecipe: Recipe = {
      ...activeRecipe,
      version: activeRecipe.version + 1,
      ingredients: versionToRestore.ingredients,
      instructions: versionToRestore.instructions,
      tempF: versionToRestore.tempF,
      timeMins: versionToRestore.timeMins,
      notes: `Restored Version ${versionToRestore.version} formulation. ` + versionToRestore.notes,
      updatedAt: nowStr,
      updatedBy: userEmail || "R&D Principal Scientist",
      history: [
        {
          version: activeRecipe.version,
          updatedAt: activeRecipe.updatedAt,
          updatedBy: activeRecipe.updatedBy,
          ingredients: activeRecipe.ingredients,
          instructions: activeRecipe.instructions,
          tempF: activeRecipe.tempF,
          timeMins: activeRecipe.timeMins,
          notes: activeRecipe.notes
        },
        ...(activeRecipe.history || [])
      ]
    };

    try {
      await setDoc(doc(db, "recipes", restoredRecipe.id), restoredRecipe);
      setRestoreSuccessMessage(`Successfully restored to Version ${versionToRestore.version}.0`);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setShowRestoreConfirm(false);
      setVersionToRestore(null);
    }
  };

  const categories = [
    "All",
    "Cognitive/Nootropic",
    "Relaxation",
    "Muscle Recovery/Protein",
    "Gut Health",
    "Sustained Energy"
  ];

  return (
    <div id="recipe_lab" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-slate-900">
      {/* List Sidebar: Styled like a premium Notion database */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col space-y-5 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950 tracking-tight">Master Database</h2>
            <p className="text-[11px] text-slate-400 font-medium">Molecular formulations</p>
          </div>
          <button
            onClick={openNewForm}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-95"
            title="Formulate New Cookie"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search formulations..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 text-xs rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filters: Minimal Notion Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {cat === "All" ? "All Formulations" : cat.split("/")[0]}
            </button>
          ))}
        </div>

        {/* Recipe Cards List */}
        <div className="space-y-2 overflow-y-auto no-scrollbar max-h-[50vh] lg:max-h-[60vh] pr-1 flex-1">
          {filteredRecipes.map((r) => {
            const isSelected = selectedRecipeId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecipeId(r.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isSelected
                    ? "bg-slate-50 border-indigo-500/80 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-indigo-600 font-bold tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {r.category.split("/")[0]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      v{r.version}.0
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                    {r.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-0.5 font-bold text-amber-500">
                    ★ {r.tasteRating.toFixed(1)}
                  </span>
                  <span className="font-bold text-slate-600">₹{r.costPerCookie?.toFixed(2)} / unit</span>
                </div>
              </div>
            );
          })}

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 text-xs font-mono text-slate-400 italic">
              No matching formulations cataloged.
            </div>
          )}
        </div>
      </div>

      {/* Main Detail View / Form Editor: Designed like a clean, unified Stripe Workspace */}
      <div className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-2xl shadow-sm lg:col-span-2 relative overflow-hidden min-h-[550px]">
        {isEditing ? (
          /* Formula Editor Form */
          <form onSubmit={handleSaveRecipe} className="space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950 tracking-tight">
                  {editId
                    ? `Revise Formula (Draft V${recipes.find((r) => r.id === editId)!.version + 1})`
                    : "New Food Formulation"}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update active compound density & thermal parameters.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer shadow-sm transition-all"
                >
                  Save Formulation
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Formula Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cognitive Peak Double Chocolate"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg placeholder-slate-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Functional Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg"
                >
                  <option value="Cognitive/Nootropic">Cognitive/Nootropic</option>
                  <option value="Relaxation">Relaxation</option>
                  <option value="Muscle Recovery/Protein">Muscle Recovery/Protein</option>
                  <option value="Gut Health">Gut Health</option>
                  <option value="Sustained Energy">Sustained Energy</option>
                </select>
              </div>
            </div>

            {/* Baking Parameters */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Bake Temp (°F)
                </label>
                <input
                  type="number"
                  value={formTempF}
                  onChange={(e) => setFormTempF(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min="150"
                  max="450"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  value={formTimeMins}
                  onChange={(e) => setFormTimeMins(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min="1"
                  max="60"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Taste Rating (1-5)
                </label>
                <input
                  type="number"
                  value={formTaste}
                  onChange={(e) => setFormTaste(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Ingredients Selection Area */}
            <div className="border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" /> Formulation Matrix
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Specify precise active grammage</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={selectedIngredientToAdd}
                    onChange={(e) => setSelectedIngredientToAdd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs text-slate-700"
                  >
                    <option value="">-- Choose active chemical agent or base --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) — ₹{ing.unitCost}/unit
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-36 flex gap-1.5">
                  <input
                    type="number"
                    value={amountToAdd || ""}
                    onChange={(e) => setAmountToAdd(Number(e.target.value))}
                    placeholder="Amt"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-mono text-center"
                    min="0"
                    step="0.1"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredientToForm}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold px-3 cursor-pointer transition-colors active:scale-95 shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current ingredients formulation */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {formIngredients.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-slate-500 text-[11px]">
                        {item.amount} {item.unit}
                      </span>
                      <span className="font-mono text-slate-700 w-16 text-right font-bold">
                        ₹{(item.amount * item.unitCost).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientFromForm(item.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {formIngredients.length === 0 && (
                  <div className="text-center py-6 text-xs font-mono text-slate-400 italic">
                    Add active agents above to construct your molecular compound matrix.
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 px-4 py-3 rounded-lg text-xs font-semibold">
                <span className="text-slate-600">Calculated Batch Cost per Unit:</span>
                <span className="text-indigo-600 font-bold text-sm">₹{computeFormCostPerCookie().toFixed(2)}</span>
              </div>
            </div>

            {/* Scientific Instructions */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Molecular Blending & Thermal Treatment Instructions
              </label>
              <textarea
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={4}
                placeholder="Step 1. Hydrate protein isolate peptide bonds...\nStep 2. Infuse active lion's mane compounds below 140°F...\nStep 3. Maintain cold aging phase..."
                className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg"
                required
              />
            </div>

            {/* Sensory & Texture Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Texture Sensory Profile
                </label>
                <input
                  type="text"
                  value={formTexture}
                  onChange={(e) => setFormTexture(e.target.value)}
                  placeholder="Crisp perimeters with a chewy gelatinous core"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Formulation Image Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Image URL or upload file →"
                    className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg"
                  />
                  <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? "..." : "File"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Formulation Research Notes */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formulation & Active Synergy Research Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                placeholder="Explain compound interaction, flavor profiles, and sensory outcomes..."
                className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg"
              />
            </div>
          </form>
        ) : activeRecipe ? (
          /* Recipe Detail Viewer: Fully Polished Workspace */
          <div className="space-y-8 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-mono uppercase tracking-widest font-bold rounded-md">
                    V{activeRecipe.version}.0 Master Formulation
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {activeRecipe.category}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1.5">{activeRecipe.name}</h1>
              </div>

              <div className="flex gap-2 self-stretch sm:self-auto">
                <button
                  onClick={() => openEditForm(activeRecipe)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow"
                >
                  Adjust Formula Parameters
                </button>
                <button
                  onClick={() => handleDeleteRecipe(activeRecipe.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors"
                  title="Archive Formulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Apple-style Metric KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Formulation Cost
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ₹{activeRecipe.costPerCookie?.toFixed(2)}
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">Per Completed Cookie</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Bake Temperature
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                  <Thermometer className="w-4.5 h-4.5 text-indigo-500" /> {activeRecipe.tempF}°F
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">Thermal profile control</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Bake Duration
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                  <Clock className="w-4.5 h-4.5 text-indigo-500" /> {activeRecipe.timeMins} mins
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">Reaction kinetics window</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Sensory Taste Score
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                  <Star className="w-4.5 h-4.5 text-amber-500" fill="currentColor" />{" "}
                  {activeRecipe.tasteRating?.toFixed(1)}/5.0
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">User panels validation</span>
              </div>
            </div>

            {/* Split layout: Photo & Ingredients */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Photo Area */}
              {activeRecipe.imageUrl && (
                <div className="md:col-span-2 border border-slate-200/80 bg-slate-50 p-2.5 rounded-xl flex flex-col items-center justify-center">
                  <img
                    src={activeRecipe.imageUrl}
                    alt={activeRecipe.name}
                    className="w-full h-48 md:h-60 object-cover rounded-lg shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-wider">
                    Micro-formulation photographic log
                  </span>
                </div>
              )}

              {/* Ingredients Matrix */}
              <div className={`${activeRecipe.imageUrl ? "md:col-span-3" : "md:col-span-5"} space-y-3`}>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-indigo-500" /> Active Ingredient Ratios
                </h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto no-scrollbar">
                  {activeRecipe.ingredients.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs border-b border-slate-100 py-2"
                    >
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <div className="flex gap-4 font-mono text-slate-500 text-[11px]">
                        <span>
                          {item.amount} {item.unit}
                        </span>
                        <span className="text-slate-900 w-14 text-right font-bold">
                          ₹{(item.amount * item.unitCost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                Baking Protocol & Compound Infusion Steps
              </h3>
              <div className="whitespace-pre-line text-xs leading-relaxed text-slate-700 bg-slate-50 p-5 rounded-xl border border-slate-200/60 font-medium">
                {activeRecipe.instructions}
              </div>
            </div>

            {/* Sensory Evaluation & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                  Texture Sensory Analysis
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {activeRecipe.textureAnalysis || "No custom texture profile analyzed."}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                  R&D Synergistic Notes
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed italic font-medium">
                  {activeRecipe.notes || "No additional R&D insights cataloged."}
                </p>
              </div>
            </div>

            {/* Version History Archive */}
            {activeRecipe.history && activeRecipe.history.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-500" /> Formulation Revision Logs
                </h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
                  {activeRecipe.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">V{h.version}.0 Revision</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {h.updatedAt.split("T")[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-1">
                          {h.notes || "No revision notes provided."}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRestoreVersion(h)}
                        className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm hover:bg-slate-50 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" /> Restore Draft
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-slate-200" />
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Consulting Canvas Idle</div>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select a cookie from the Master List or click the "+" icon to establish a new molecular formula.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-w-sm w-full space-y-4 animate-scale-in text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-50 p-2 rounded-full border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you absolutely sure you want to delete this master formulation? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecipeIdToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Restore Confirmation Modal */}
      {showRestoreConfirm && versionToRestore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4 animate-scale-in text-slate-900">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="bg-indigo-50 p-2 rounded-full border border-indigo-100">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Restore Formulation</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to restore this formulation back to <span className="font-bold text-slate-900">Version {versionToRestore.version}.0</span>? This will increment the active master version to <span className="font-bold text-slate-900">V{(activeRecipe?.version || 1) + 1}.0</span>.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setVersionToRestore(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndExecuteRestore}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow cursor-pointer"
              >
                Restore Formulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4 bg-emerald-500 rounded-full p-0.5" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {restoreSuccessMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4 bg-emerald-500 rounded-full p-0.5" />
          <span>{restoreSuccessMessage}</span>
        </div>
      )}
    </div>
  );
}
