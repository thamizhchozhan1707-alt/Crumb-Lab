import React, { useState } from "react";
import { Ingredient } from "../types";
import { db } from "../firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { Search, Plus, Trash2, AlertTriangle, ArrowUp, Check, Info, FileSpreadsheet, Package, Pencil } from "lucide-react";

interface IngredientInventoryViewProps {
  ingredients: Ingredient[];
  inventoryLogs?: any[];
  userEmail?: string;
  onRefresh: () => void;
}

export default function IngredientInventoryView({
  ingredients,
  inventoryLogs = [],
  userEmail = "guest.scientist@crumblab.co",
  onRefresh
}: IngredientInventoryViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Add Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Functional Actives");
  const [formStock, setFormStock] = useState(0);
  const [formUnit, setFormUnit] = useState("g");
  const [formUnitCost, setFormUnitCost] = useState(0);
  const [formSupplier, setFormSupplier] = useState("");
  const [formMinStock, setFormMinStock] = useState(100);

  // Quick replenish input state
  const [replenishAmount, setReplenishAmount] = useState<{ [id: string]: number }>({});

  // Toast notifications state
  const [notifications, setNotifications] = useState<{ id: string; type: "success" | "error" | "info"; message: string }[]>([]);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setEditingIngredientId(null);
    setFormName("");
    setFormCategory("Functional Actives");
    setFormStock(0);
    setFormUnit("g");
    setFormUnitCost(0);
    setFormSupplier("");
    setFormMinStock(100);
  };

  const handleToggleForm = () => {
    if (isAdding) {
      resetForm();
      setIsAdding(false);
    } else {
      resetForm();
      setIsAdding(true);
    }
  };

  const handleStartEdit = (ing: Ingredient) => {
    setEditingIngredientId(ing.id);
    setFormName(ing.name);
    setFormCategory(ing.category);
    setFormStock(ing.stock);
    setFormUnit(ing.unit);
    setFormUnitCost(ing.unitCost);
    setFormSupplier(ing.supplier);
    setFormMinStock(ing.minStock);
    setIsAdding(true);
    showNotification(`Pre-filled edit form for ${ing.name}`, "info");
  };

  // Manual query verification of Firestore ingredients collection using getDocs
  const fetchCurrentInventory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "ingredients"));
      console.log(`[getDocs] Verification successful. Total registered agents: ${querySnapshot.size}`);
    } catch (err: any) {
      console.warn("Failed to run getDocs check:", err);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification("Ingredient name cannot be empty.", "error");
      return;
    }

    try {
      if (editingIngredientId) {
        // Edit mode: update existing document using updateDoc
        await updateDoc(doc(db, "ingredients", editingIngredientId), {
          name: formName,
          category: formCategory,
          stock: Number(formStock),
          unit: formUnit,
          unitCost: Number(formUnitCost),
          supplier: formSupplier,
          minStock: Number(formMinStock),
          updatedAt: new Date().toISOString()
        });

        // Log edit action
        await addDoc(collection(db, "inventory"), {
          ingredientId: editingIngredientId,
          ingredientName: formName,
          changeAmount: Number(formStock),
          actionType: "edit",
          timestamp: new Date().toISOString(),
          performedBy: userEmail
        });

        showNotification(`Raw agent "${formName}" updated successfully!`, "success");
      } else {
        // Add mode: create a new document using addDoc
        const docRef = await addDoc(collection(db, "ingredients"), {
          name: formName,
          category: formCategory,
          stock: Number(formStock),
          unit: formUnit,
          unitCost: Number(formUnitCost),
          supplier: formSupplier,
          minStock: Number(formMinStock),
          updatedAt: new Date().toISOString()
        });

        // Log registration action
        await addDoc(collection(db, "inventory"), {
          ingredientId: docRef.id,
          ingredientName: formName,
          changeAmount: Number(formStock),
          actionType: "register",
          timestamp: new Date().toISOString(),
          performedBy: userEmail
        });

        showNotification(`Raw agent "${formName}" registered successfully!`, "success");
      }

      setIsAdding(false);
      resetForm();
      await fetchCurrentInventory();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to save raw agent: ${err.message}`, "error");
    }
  };

  const handleReplenishStock = async (ing: Ingredient) => {
    const amt = replenishAmount[ing.id];
    if (!amt || amt <= 0) {
      showNotification("Please enter a valid amount to replenish.", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "ingredients", ing.id), {
        stock: ing.stock + amt,
        updatedAt: new Date().toISOString()
      });

      // Log replenishment transaction
      await addDoc(collection(db, "inventory"), {
        ingredientId: ing.id,
        ingredientName: ing.name,
        changeAmount: amt,
        actionType: "replenish",
        timestamp: new Date().toISOString(),
        performedBy: userEmail
      });

      setReplenishAmount({ ...replenishAmount, [ing.id]: 0 });
      showNotification(`Successfully replenished ${amt} ${ing.unit} of ${ing.name}!`, "success");
      await fetchCurrentInventory();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to replenish stock: ${err.message}`, "error");
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this raw agent from the master database?")) return;
    try {
      await deleteDoc(doc(db, "ingredients", id));
      showNotification("Raw agent deleted successfully!", "success");
      await fetchCurrentInventory();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to delete raw agent: ${err.message}`, "error");
    }
  };

  const categories = ["All", "Functional Actives", "Flours", "Sweeteners", "Fats", "Inclusions", "Leaveners"];

  return (
    <div id="ingredient_inventory" className="space-y-6 animate-fade-in text-slate-900">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Raw Agent Stock Control
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-2">
            Ingredient Inventory
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Audit biochemical stock levels, trace supplier partners, and replenish safe buffer targets.
          </p>
        </div>

        <button
          onClick={handleToggleForm}
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5 text-indigo-400" /> {isAdding ? "Close Form" : "Catalog Raw Agent"}
        </button>
      </div>

      {isAdding && (
        /* Form Card */
        <form
          onSubmit={handleAddIngredient}
          className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm text-left animate-slide-down"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-1.5">
              <Package className="w-5 h-5 text-indigo-500" /> {editingIngredientId ? "Edit Raw Agent / Ingredient" : "Register Raw Agent / Ingredient"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Establish raw matrix pricing parameters and safety thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ingredient Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ashwagandha Extract KSM-66"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all placeholder-slate-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all"
              >
                <option value="Functional Actives">Functional Actives</option>
                <option value="Flours">Flours</option>
                <option value="Sweeteners">Sweeteners</option>
                <option value="Fats">Fats</option>
                <option value="Inclusions">Inclusions</option>
                <option value="Leaveners">Leaveners</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supplier Partner
              </label>
              <input
                type="text"
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                placeholder="e.g. Aura Mycologicals"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Initial Stock
              </label>
              <input
                type="number"
                value={formStock || ""}
                onChange={(e) => setFormStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg"
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Unit (e.g., g, kg, ml)
              </label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg"
                placeholder="g"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cost Per Unit (₹ per unit)
              </label>
              <input
                type="number"
                value={formUnitCost || ""}
                onChange={(e) => setFormUnitCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg"
                min="0"
                step="0.0001"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Min Safety Stock Threshold
              </label>
              <input
                type="number"
                value={formMinStock || ""}
                onChange={(e) => setFormMinStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg"
                min="0"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(false);
              }}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              {editingIngredientId ? "Update Agent" : "Save Agent"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and search panels: Stripe Inline Database Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search raw agents or suppliers..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-xs rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-lg cursor-pointer transition-all ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stripe-style tabular database */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                <th className="p-4 pl-6">Raw Agent Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Available Stock</th>
                <th className="p-4 text-right">Unit Cost</th>
                <th className="p-4">Supplier Partner</th>
                <th className="p-4 text-center">Quick Replenish</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredIngredients.map((ing) => {
                const isLow = ing.stock <= ing.minStock;
                return (
                  <tr key={ing.id} className={`hover:bg-slate-50/60 transition-colors ${isLow ? "bg-rose-50/15" : ""}`}>
                    <td className="p-4 pl-6 text-left">
                      <div className="flex items-center gap-3">
                        {isLow ? (
                          <span
                            className="p-1.5 bg-rose-50 text-rose-600 border border-rose-150 rounded-lg"
                            title="Safety Margin Violated"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{ing.name}</div>
                          <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5 tracking-wider">
                            ID: {ing.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-left">
                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-[9px] font-mono uppercase text-slate-500 font-bold rounded-md">
                        {ing.category}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className={`font-mono font-bold text-xs ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                        {ing.stock.toLocaleString()} {ing.unit}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                        Min limit: {ing.minStock} {ing.unit}
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono">
                      <div className="font-bold text-slate-800 text-xs">₹{ing.unitCost.toFixed(2)}</div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Per {ing.unit}</div>
                    </td>

                    <td className="p-4 text-left font-medium text-slate-700">{ing.supplier}</td>

                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-lg overflow-hidden">
                        <input
                          type="number"
                          placeholder="0"
                          value={replenishAmount[ing.id] || ""}
                          onChange={(e) =>
                            setReplenishAmount({ ...replenishAmount, [ing.id]: Number(e.target.value) })
                          }
                          className="w-14 bg-transparent border-none text-center font-mono text-xs font-bold text-slate-900 outline-none focus:ring-0 p-1"
                          min="0"
                        />
                        <button
                          onClick={() => handleReplenishStock(ing)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-md cursor-pointer transition-colors shadow-sm shrink-0 flex items-center justify-center w-6 h-6"
                          title="Replenish stock"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right pr-6">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleStartEdit(ing)}
                          className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Edit agent specifications"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Purge raw agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs font-mono text-slate-400 italic">
                    <Info className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                    No registered raw agents match current query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Ledger of Transactions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-950 tracking-tight flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> Real-time Stock Transaction Ledger
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Biochemically logged inventory movements recorded on Firestore in real-time.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-150 text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                <th className="pb-3 text-left">Timestamp</th>
                <th className="pb-3 text-left">Ingredient</th>
                <th className="pb-3 text-left">Action</th>
                <th className="pb-3 text-right">Adjustment</th>
                <th className="pb-3 pr-4 text-right">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {inventoryLogs && inventoryLogs.length > 0 ? (
                inventoryLogs.slice(0, 15).map((log: any) => {
                  const isRegister = log.actionType === "register";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40">
                      <td className="py-3 text-[11px] text-slate-400 text-left">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-700 font-bold text-left">{log.ingredientName}</td>
                      <td className="py-3 text-left">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                          isRegister 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {log.actionType ? log.actionType.toUpperCase() : "TRANSACTION"}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold ${isRegister ? "text-emerald-600" : "text-indigo-600"}`}>
                        +{log.changeAmount}
                      </td>
                      <td className="py-3 text-right text-slate-500 pr-4">{log.performedBy}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">
                    No transactions registered in this ledger. Use "Catalog Raw Agent" or "Quick Replenish" to commit real-time logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beautiful Toast Notifications Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-xl shadow-lg border text-white flex items-center justify-between gap-3 animate-slide-in transition-all ${
              notif.type === "success"
                ? "bg-emerald-600 border-emerald-500"
                : notif.type === "error"
                ? "bg-rose-600 border-rose-500"
                : "bg-blue-600 border-blue-500"
            }`}
          >
            <div className="flex items-center gap-2">
              {notif.type === "success" && <Check className="w-4 h-4 text-emerald-100 shrink-0" />}
              {notif.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-100 shrink-0" />}
              {notif.type === "info" && <Info className="w-4 h-4 text-blue-100 shrink-0" />}
              <span className="text-xs font-semibold">{notif.message}</span>
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
              className="text-white hover:text-slate-200 transition-colors cursor-pointer text-xs font-bold font-mono pl-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
