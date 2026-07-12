import React, { useState, useEffect } from "react";
import { Ingredient } from "../types";
import { db, auth } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import {
  Beaker,
  Search,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  Scale,
  Award,
  Info,
  Check,
  CheckCircle,
  FileText
} from "lucide-react";

interface IngredientsRegistryViewProps {
  ingredients: Ingredient[];
}

export default function IngredientsRegistryView({ ingredients }: IngredientsRegistryViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // State to control add/edit drawer
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Functional Actives");
  const [formSupplier, setFormSupplier] = useState("");
  const [formUnitCost, setFormUnitCost] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formUnit, setFormUnit] = useState("g");
  const [formMinStock, setFormMinStock] = useState(100);
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Modal and toast notifications
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const categories = ["All", "Functional Actives", "Flours", "Sweeteners", "Fats", "Inclusions", "Leaveners"];

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.supplier.toLowerCase().includes(search.toLowerCase()) ||
      (ing.notes && ing.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "All" || ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleStartEdit = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setFormName(ing.name);
    setFormCategory(ing.category);
    setFormSupplier(ing.supplier);
    setFormUnitCost(ing.unitCost);
    setFormStock(ing.stock);
    setFormUnit(ing.unit);
    setFormMinStock(ing.minStock || 100);
    setFormExpiryDate(ing.expiryDate || "");
    setFormNotes(ing.notes || "");
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingIngredientId(null);
    setFormName("");
    setFormCategory("Functional Actives");
    setFormSupplier("");
    setFormUnitCost(0);
    setFormStock(0);
    setFormUnit("g");
    setFormMinStock(100);
    setFormExpiryDate("");
    setFormNotes("");
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSupplier.trim()) return;

    const ingId = editingIngredientId || `ing-${Date.now()}`;
    const userEmail = auth.currentUser?.email || "guest.scientist@crumblab.co";

    const ingData: Ingredient = {
      id: ingId,
      name: formName,
      category: formCategory,
      stock: Number(formStock),
      unit: formUnit,
      unitCost: Number(formUnitCost),
      supplier: formSupplier,
      minStock: Number(formMinStock),
      updatedAt: new Date().toISOString(),
      expiryDate: formExpiryDate || undefined,
      notes: formNotes || undefined
    };

    try {
      await setDoc(doc(db, "ingredients", ingId), ingData);

      // Log to inventory log collection as well
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "inventory", logId), {
        id: logId,
        ingredientId: ingId,
        ingredientName: formName,
        changeAmount: Number(formStock),
        actionType: editingIngredientId ? "edit" : "register",
        timestamp: new Date().toISOString(),
        performedBy: userEmail
      });

      setToastMessage(
        editingIngredientId
          ? "Ingredient specification updated successfully."
          : "New active ingredient registered successfully."
      );
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error("Firestore Error saving ingredient:", err);
    }
  };

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!idToDelete) return;
    try {
      await deleteDoc(doc(db, "ingredients", idToDelete));
      setToastMessage("Ingredient deleted from molecular database.");
    } catch (err) {
      console.error("Error deleting ingredient:", err);
    } finally {
      setShowDeleteConfirm(false);
      setIdToDelete(null);
    }
  };

  return (
    <div id="ingredients_registry_view" className="space-y-8 animate-fade-in text-[#171717]">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8DDC9] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono text-[#C89A3C] uppercase tracking-widest font-bold">
            Molecular Composition Directory
          </span>
          <h1 className="text-3xl font-serif text-[#171717] tracking-tight mt-1">
            Active Compound Registry
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-2xl">
            R&D specification directory of raw therapeutic ingredients, clinical efficacy parameters, chemical compounds, and certified GRAS guidelines.
          </p>
        </div>

        <button
          onClick={() => {
            if (isFormOpen) {
              resetForm();
            }
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Plus className={`w-4.5 h-4.5 text-[#C89A3C] transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Close Form" : "Add Ingredient"}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSaveIngredient}
          className="bg-white border border-[#E8DDC9] rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm text-left animate-slide-down"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-serif text-[#171717] font-semibold flex items-center gap-1.5">
              <Beaker className="w-5 h-5 text-[#C89A3C]" />
              {editingIngredientId ? "Edit Ingredient Specifications" : "Register Raw Agent / Ingredient"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Establish core biochem specifications, costing vectors, and supplier source tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ingredient Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ashwagandha Extract KSM-66"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg transition-all"
              >
                {categories.filter(c => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Supplier Partner *
              </label>
              <input
                type="text"
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                placeholder="e.g. Aura Mycologicals"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formStock}
                onChange={(e) => setFormStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg"
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Unit (e.g. g, kg, ml) *
              </label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg"
                placeholder="g"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cost Per Unit (₹) *
              </label>
              <input
                type="number"
                value={formUnitCost}
                onChange={(e) => setFormUnitCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg"
                min="0"
                step="0.0001"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Expiry Date
              </label>
              <input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Min Safety Stock Limit
              </label>
              <input
                type="number"
                value={formMinStock}
                onChange={(e) => setFormMinStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg"
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Scientific & Formulation Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Molecular weight, active concentrations, cognitive or physical benefits..."
                className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#C89A3C] focus:bg-white rounded-lg transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#C89A3C] hover:bg-[#A67B2E] text-white text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingIngredientId ? "Update Specifications" : "Register Raw Agent"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ingredients, supplier or chemical details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFDF8] border border-[#E8DDC9] pl-9 pr-4 py-2.5 text-xs rounded-xl placeholder-[#6B6B6B]/60 focus:outline-none focus:ring-1 focus:ring-[#C89A3C]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${
                categoryFilter === cat
                  ? "bg-[#C89A3C] border-[#C89A3C] text-white"
                  : "bg-white border-[#E8DDC9] text-[#6B6B6B] hover:text-[#171717]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Master Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIngredients.map((ing) => {
          const isLow = ing.stock <= (ing.minStock || 100);
          return (
            <div
              key={ing.id}
              className={`bg-white border hover:border-[#C89A3C] hover:shadow-md transition-all duration-300 p-6 rounded-2xl flex flex-col justify-between space-y-5 relative group ${
                isLow ? "border-rose-200/80 bg-rose-50/5" : "border-[#E8DDC9]"
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#F8F2E9] text-[#C89A3C] px-2 py-0.5 rounded border border-[#E8DDC9]/40">
                    {ing.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B6B6B]">
                    ID: {ing.id}
                  </span>
                </div>

                <div className="mt-3 text-left">
                  <h3 className="text-base font-serif text-[#171717] font-semibold line-clamp-1">
                    {ing.name}
                  </h3>
                  {ing.notes ? (
                    <p className="text-xs text-[#6B6B6B] mt-2 line-clamp-2 leading-relaxed bg-[#FFFDF8] p-2.5 rounded-lg border border-[#F8F2E9]">
                      {ing.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2 italic">No custom notes specified.</p>
                  )}
                </div>

                <div className="mt-4 space-y-3.5 border-t border-[#F8F2E9] pt-4 text-xs text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">Unit Cost</span>
                      <p className="text-xs text-[#171717] font-mono font-bold">₹{ing.unitCost.toFixed(2)} / {ing.unit}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">Current Stock</span>
                      <p className={`text-xs font-mono font-bold ${isLow ? "text-rose-600" : "text-slate-800"}`}>
                        {ing.stock.toLocaleString()} {ing.unit}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">Lab Supplier</span>
                      <p className="text-xs text-[#171717] font-medium truncate">{ing.supplier}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">Expiry Date</span>
                      <p className="text-xs text-[#171717] font-mono font-medium">
                        {ing.expiryDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#C89A3C]" />
                            {ing.expiryDate}
                          </span>
                        ) : (
                          "No limit"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and certification footer */}
              <div className="pt-4 border-t border-[#F8F2E9] flex items-center justify-between text-[11px] font-mono text-[#6B6B6B]">
                <div className="flex items-center gap-1.5 text-[#3F8C5A]">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{isLow ? "Needs Replenishment" : "GRAS Approved"}</span>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleStartEdit(ing)}
                    className="text-slate-400 hover:text-[#C89A3C] p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Edit Specifications"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(ing.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Purge Material"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredIngredients.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-xs font-mono text-slate-400 italic bg-white border border-[#E8DDC9] rounded-2xl">
            <Info className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            No registered ingredients match current search parameters.
          </div>
        )}
      </div>

      <div className="p-4 bg-[#FFFDF8] border border-[#E8DDC9] rounded-xl flex items-center gap-3 text-left">
        <Award className="w-5 h-5 text-[#C89A3C] shrink-0" />
        <span className="text-xs text-[#6B6B6B] leading-relaxed">
          <span className="font-bold text-[#171717]">Biochemical Quality Compliance:</span> All materials listed are sourced exclusively from accredited pharmaceutical-grade, eco-conscious suppliers. Lab batch certificate verification required on delivery.
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-xl max-w-sm w-full space-y-4 animate-scale-in text-slate-900 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-50 p-2 rounded-full border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Purge Material</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you absolutely sure you want to delete this raw agent from the molecular registry? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setIdToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4 bg-emerald-500 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
