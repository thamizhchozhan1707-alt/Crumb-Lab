import React, { useState, useEffect } from "react";
import { Experiment, Recipe } from "../types";
import { db, auth } from "../firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import {
  Search,
  Plus,
  Calendar,
  Flame,
  Clock,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Sliders,
  Sparkles,
  Info,
  Pencil,
  Check,
  ChevronRight,
  BookOpen
} from "lucide-react";

// Firestore Error Handler helper for Zero-Trust Audit
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  WRITE = "write"
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error("Firestore Error logged in R&D Tracker: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ExperimentTrackerViewProps {
  experiments: Experiment[];
  recipes: Recipe[];
  onRefresh: () => void;
  userEmail?: string;
}

export default function ExperimentTrackerView({
  experiments,
  recipes,
  onRefresh,
  userEmail
}: ExperimentTrackerViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form Drawer & Edit State
  const [isAdding, setIsAdding] = useState(false);
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null);

  // Form State Fields (Mapped to Experiment Firestore collection requirements)
  const [formRecipeId, setFormRecipeId] = useState("");
  const [formRecipeVersion, setFormRecipeVersion] = useState<number>(1);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTemp, setFormTemp] = useState(325);
  const [formTime, setFormTime] = useState(12);
  const [formVariables, setFormVariables] = useState("");
  const [formExpectedResult, setFormExpectedResult] = useState("");
  const [formActualResult, setFormActualResult] = useState("");
  const [formObservations, setFormObservations] = useState("");
  const [formTextureRating, setFormTextureRating] = useState(5);
  const [formTasteRating, setFormTasteRating] = useState(5);
  const [formStatus, setFormStatus] = useState<"Planned" | "Completed" | "Failed" | "Successful">("Planned");
  const [formNotes, setFormNotes] = useState("");

  // Custom modals & Toasts
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [experimentIdToDelete, setExperimentIdToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Automatically hide notifications after 3.5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // When a recipe is selected, automatically pre-fill details from it
  const handleRecipeChange = (recipeId: string) => {
    setFormRecipeId(recipeId);
    if (!recipeId) return;

    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    if (selectedRecipe) {
      setFormRecipeVersion(selectedRecipe.version || 1);
      setFormTemp(selectedRecipe.tempF || 325);
      setFormTime(selectedRecipe.timeMins || 12);
      // Optional: initialize variables with template
      if (!formVariables) {
        setFormVariables("Tuning variables from " + selectedRecipe.name);
      }
    }
  };

  // Populate form for editing an experiment
  const handleStartEdit = (exp: Experiment) => {
    setEditingExperimentId(exp.id);
    setFormRecipeId(exp.recipeId);
    setFormRecipeVersion(exp.recipeVersion || 1);
    setFormTitle(exp.title);
    setFormDate(exp.date || new Date().toISOString().split("T")[0]);
    setFormTemp(exp.bakingTemp);
    setFormTime(exp.bakingTime);
    setFormVariables(exp.variablesChanged);
    setFormExpectedResult(exp.expectedResult || "");
    setFormActualResult(exp.actualResult || "");
    setFormObservations(exp.observations || "");
    setFormTextureRating(exp.textureRating);
    setFormTasteRating(exp.tasteRating);
    setFormStatus(exp.status);
    setFormNotes(exp.notes || "");
    setIsAdding(true);

    // Scroll to form smoothly
    const formEl = document.getElementById("experiment-form-header");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset form values
  const resetForm = () => {
    setEditingExperimentId(null);
    setFormRecipeId("");
    setFormRecipeVersion(1);
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormTemp(325);
    setFormTime(12);
    setFormVariables("");
    setFormExpectedResult("");
    setFormActualResult("");
    setFormObservations("");
    setFormTextureRating(5);
    setFormTasteRating(5);
    setFormStatus("Planned");
    setFormNotes("");
  };

  const handleToggleForm = () => {
    if (isAdding && editingExperimentId) {
      // If we are currently editing and hit toggle, clear edit mode first
      resetForm();
      setIsAdding(false);
    } else {
      setIsAdding(!isAdding);
      if (!isAdding) {
        resetForm();
      }
    }
  };

  // Create or Update operation
  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipeId || !formTitle.trim()) return;

    const selectedRecipe = recipes.find((r) => r.id === formRecipeId);
    if (!selectedRecipe) return;

    const isEditMode = !!editingExperimentId;
    const expId = editingExperimentId || `exp-${Date.now()}`;

    const expData: Experiment = {
      id: expId,
      recipeId: formRecipeId,
      recipeName: selectedRecipe.name,
      recipeVersion: Number(formRecipeVersion),
      title: formTitle,
      date: formDate,
      bakingTemp: Number(formTemp),
      bakingTime: Number(formTime),
      variablesChanged: formVariables,
      expectedResult: formExpectedResult,
      actualResult: formActualResult,
      observations: formObservations || formExpectedResult || "Initial bakes in progress",
      textureRating: Number(formTextureRating),
      tasteRating: Number(formTasteRating),
      costPerCookie: selectedRecipe.costPerCookie || 120.0,
      status: formStatus,
      createdBy: userEmail || "R&D Lab Associate",
      notes: formNotes
    };

    try {
      await setDoc(doc(db, "experiments", expId), expData);
      setToastMessage(
        isEditMode
          ? "Empirical test journal updated successfully."
          : "Empirical test journal committed successfully."
      );
      setIsAdding(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, isEditMode ? OperationType.UPDATE : OperationType.CREATE, `experiments/${expId}`);
    }
  };

  // Trigger Delete confirmation modal
  const handleDeleteExperimentClick = (id: string) => {
    setExperimentIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Execute actual deletion
  const executeDeleteExperiment = async () => {
    if (!experimentIdToDelete) return;
    try {
      await deleteDoc(doc(db, "experiments", experimentIdToDelete));
      setToastMessage("Empirical test journal entry deleted successfully.");
      onRefresh();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `experiments/${experimentIdToDelete}`);
    } finally {
      setShowDeleteConfirm(false);
      setExperimentIdToDelete(null);
    }
  };

  // Quick inline status updates (with proper Firestore error handling)
  const handleUpdateStatus = async (id: string, newStatus: "Planned" | "Completed" | "Failed" | "Successful") => {
    const exp = experiments.find((e) => e.id === id);
    if (!exp) return;

    try {
      await setDoc(doc(db, "experiments", id), { ...exp, status: newStatus });
      setToastMessage(`Status updated to ${newStatus}.`);
      onRefresh();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `experiments/${id}`);
    }
  };

  // Filter & Search Logic
  const filteredExperiments = experiments.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.recipeName.toLowerCase().includes(search.toLowerCase()) ||
      (e.variablesChanged && e.variablesChanged.toLowerCase().includes(search.toLowerCase())) ||
      (e.expectedResult && e.expectedResult.toLowerCase().includes(search.toLowerCase())) ||
      (e.actualResult && e.actualResult.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="experiment_tracker" className="space-y-6 animate-fade-in text-slate-900">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Empirical Test Journals
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-2">
            Experiment Tracker
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Optimize baking conditions and test biochemical variables under secure cloud sync.
          </p>
        </div>

        <button
          onClick={handleToggleForm}
          className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className={`w-4.5 h-4.5 text-indigo-400 transition-transform duration-200 ${isAdding ? "rotate-45" : ""}`} />{" "}
          {isAdding ? (editingExperimentId ? "Cancel Editing" : "Close Form") : "Record Test Bake"}
        </button>
      </div>

      {isAdding && (
        /* Stripe-Style Form Drawer / Panel */
        <form
          onSubmit={handleSaveExperiment}
          className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm text-left animate-slide-down"
        >
          <div id="experiment-form-header" className="border-b border-slate-100 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-slate-950 tracking-tight flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-indigo-500" />{" "}
                {editingExperimentId ? "Modify Empirical Journal Entry" : "Log Empirical Test Journal"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Define biochemical modifications, thermal profiles, expected results, and taste/texture outcomes.
              </p>
            </div>
            {editingExperimentId && (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Editing Mode
              </span>
            )}
          </div>

          <div className="space-y-6">
            {/* Core Relationship details */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/40 pb-1.5">
                Core Formulation details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Select Base Formulation *
                  </label>
                  <select
                    value={formRecipeId}
                    onChange={(e) => handleRecipeChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all"
                    required
                  >
                    <option value="">-- Choose Recipe --</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (V{r.version}.0)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Recipe Version Tested *
                  </label>
                  <input
                    type="number"
                    value={formRecipeVersion}
                    onChange={(e) => setFormRecipeVersion(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Experiment Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Experiment Name & Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Experiment Name / Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Test of Ashwagandha mask via honey glaze"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all placeholder-slate-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Test Result Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg"
                >
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Successful">Successful</option>
                </select>
              </div>
            </div>

            {/* Baking parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Bake Temp (°F) *
                </label>
                <input
                  type="number"
                  value={formTemp}
                  onChange={(e) => setFormTemp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Bake Time (mins) *
                </label>
                <input
                  type="number"
                  value={formTime}
                  onChange={(e) => setFormTime(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Texture Score (1-5) *
                </label>
                <input
                  type="number"
                  value={formTextureRating}
                  onChange={(e) => setFormTextureRating(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Taste Score (1-5) *
                </label>
                <input
                  type="number"
                  value={formTasteRating}
                  onChange={(e) => setFormTasteRating(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Changes & Hypothesis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Changes Made / Modified Variables *
                </label>
                <textarea
                  value={formVariables}
                  onChange={(e) => setFormVariables(e.target.value)}
                  rows={2}
                  placeholder="e.g. Sourced honey from local bee farm, reduced granular sweetener by 10g"
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all placeholder-slate-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expected Result / Hypothesis
                </label>
                <textarea
                  value={formExpectedResult}
                  onChange={(e) => setFormExpectedResult(e.target.value)}
                  rows={2}
                  placeholder="What sensory or physical output do you predict from this shift?..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* Results, Observations & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Actual Result / Physical Outcome
                </label>
                <textarea
                  value={formActualResult}
                  onChange={(e) => setFormActualResult(e.target.value)}
                  rows={3}
                  placeholder="Describe cookie layout, spread, diameter, puff, and color outcome..."
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  R&D Observations (Empirical Logs)
                </label>
                <textarea
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  rows={3}
                  placeholder="Sensory and analytical notes regarding crumb moisture, flavor profile, and active ingredients..."
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Additional Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Academic annotations, chemical supplier specs, storage life parameters, or scaling rules..."
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all rounded-lg placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              {editingExperimentId ? <Check className="w-4 h-4" /> : <Sliders className="w-4 h-4 text-indigo-200" />}
              {editingExperimentId ? "Update Journal" : "Commit Journal Log"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Panel: Notion-style Inline Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test journals by title, recipe, variables, expected/actual results..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-xs rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {["All", "Planned", "Completed", "Failed", "Successful"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider border rounded-lg cursor-pointer transition-all shrink-0 ${
                statusFilter === st
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Experiments - Apple Visual Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperiments.map((e) => (
          <div
            key={e.id}
            className="bg-white border border-slate-200/80 hover:border-indigo-500/80 rounded-2xl p-5 flex flex-col justify-between relative group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <div>
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {e.date}
                </span>

                <select
                  value={e.status}
                  onChange={(evt) => handleUpdateStatus(e.id, evt.target.value as any)}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest font-bold rounded-md border focus:outline-none cursor-pointer ${
                    e.status === "Successful"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : e.status === "Failed"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <option value="Planned">Planned</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Successful">Successful</option>
                </select>
              </div>

              {/* Title & Formulation */}
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold">
                    {e.recipeName}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 border border-slate-200/80 px-1 py-0.2 rounded-md">
                    Target: V{e.recipeVersion || 1.0}.0
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {e.title}
                </h3>
              </div>

              {/* Active Matrix Change Details */}
              <div className="mt-4 bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-xs text-left">
                <strong className="font-mono uppercase text-[9px] tracking-wider text-slate-400 block mb-1">
                  Changes Made / Modified Variables
                </strong>
                <span className="text-slate-600 italic font-medium">{e.variablesChanged}</span>
              </div>

              {/* Expected & Actual Results Display */}
              {(e.expectedResult || e.actualResult) && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-left border-t border-slate-100 pt-2.5">
                  {e.expectedResult && (
                    <div className="space-y-0.5 border-r border-slate-100 pr-2">
                      <span className="font-mono uppercase text-[8px] text-slate-400 block">Expected Outcome</span>
                      <p className="text-slate-500 line-clamp-2 leading-snug font-medium italic">
                        "{e.expectedResult}"
                      </p>
                    </div>
                  )}
                  {e.actualResult && (
                    <div className="space-y-0.5 pl-1">
                      <span className="font-mono uppercase text-[8px] text-slate-400 block">Actual Outcome</span>
                      <p className="text-slate-600 line-clamp-2 leading-snug font-bold italic">
                        "{e.actualResult}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Observations & Additional Notes */}
              {(e.observations || e.notes) && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5 text-left text-xs">
                  {e.observations && (
                    <p className="text-slate-500 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-slate-700">Observations: </span>
                      {e.observations}
                    </p>
                  )}
                  {e.notes && (
                    <p className="text-indigo-900/70 line-clamp-2 leading-relaxed bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/30">
                      <span className="font-bold text-indigo-950">R&D Notes: </span>
                      {e.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer with parameters and quick tools */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2.5 text-[10px] font-mono text-slate-400 font-bold">
                <span className="flex items-center gap-0.5" title="Baking Temperature">
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> {e.bakingTemp}°F
                </span>
                <span className="flex items-center gap-0.5" title="Baking Duration">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {e.bakingTime}m
                </span>
                <span className="flex items-center gap-0.5 text-slate-600" title="Flavor Sensory Rating">
                  <Star className="w-3 h-3 text-amber-500" fill="currentColor" /> {e.tasteRating ? e.tasteRating.toFixed(1) : "5.0"}T
                </span>
                <span className="flex items-center gap-0.5 text-slate-600" title="Texture Sensory Rating">
                  <Star className="w-3 h-3 text-pink-500" fill="currentColor" /> {e.textureRating ? e.textureRating.toFixed(1) : "5.0"}X
                </span>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleStartEdit(e)}
                  className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Modify Test Log"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteExperimentClick(e.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Delete Test Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredExperiments.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-xs font-mono text-slate-400 italic bg-white border border-slate-200/80 rounded-2xl">
            <Info className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            No active test bakes match query. Click "Record Test Bake" to register a trial!
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
              Are you absolutely sure you want to delete this R&D journal entry? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setExperimentIdToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteExperiment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4 bg-emerald-500 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
