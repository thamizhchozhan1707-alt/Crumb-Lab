import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from "firebase/firestore";
import {
  BookOpen,
  Search,
  FileText,
  Calendar,
  User,
  Eye,
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  Plus,
  Trash2,
  Pencil,
  Check,
  Award
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  category: "Clinical Research" | "Standard Operating Procedures (SOP)" | "Regulatory Compliance";
  description: string;
  content: string;
  updatedAt: string;
  author: string;
  readingTime: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-sop-thermostability",
    title: "SOP-08: Thermal Stability of Adaptogenic Compounds during High-Temperature Baking",
    category: "Standard Operating Procedures (SOP)",
    description: "Standard protocol for thermal processing limits of Hericenones, Erinacines, and Withanolides KSM-66 in functional cookie products.",
    readingTime: "5 mins read",
    author: "Dr. Evelyn Vance, Head of R&D",
    updatedAt: "2026-05-18",
    content: `### 1. Objective
Establish safe upper temperature limits for baking functional compounds without causing high-level thermal degradation of active ingredients.

### 2. High-Active Thermo-Sensitivity Matrix
Each bio-active compound has specific physical degradation temperatures:
*   **Lion's Mane (Hericenones):** Stable up to 340°F (171°C). Baking above 350°F causes immediate structural denaturation of fruiting body enzymes.
*   **Ashwagandha KSM-66:** Stable up to 330°F (165°C). Slow, low-heat baking is highly recommended.
*   **Magnesium L-Threonate:** Highly stable mineral chelate. Safe up to 400°F (204°C).
*   **L-Theanine:** Begins structural transformation at 345°F.

### 3. Recommended Baking Profile Standards
Standard operations dictate that all functional doughs containing active peptides or adaptogens must be slow-baked at **300°F to 325°F** for a period of **11 to 15 minutes**. High-temperature "flash bakes" (above 350°F) are strictly prohibited as they destroy molecular potency.`
  },
  {
    id: "doc-clinical-cognitive",
    title: "Clinical Trial Insight: Synergistic Effects of Camellia Sinensis isolates and Hericium extracts",
    category: "Clinical Research",
    description: "Whitepaper detailing clinical sensory response and alpha-wave neural coordination when pairing L-Theanine with Lion's Mane Extract.",
    readingTime: "8 mins read",
    author: "Clinical Neurosciences Dept",
    updatedAt: "2026-06-02",
    content: `### 1. Executive Summary
A double-blind, placebo-controlled study (n=45) evaluated the cognitive synergy of pairing L-Theanine (200mg) with Lion's Mane 10:1 extract (1500mg) delivered via a lipid-rich cookie medium.

### 2. Primary Clinical Findings
*   **Alpha-Wave Activity:** EEG tracking showed a 22% increase in parietal alpha-wave generation within 45 minutes of ingestion, indicating a relaxed but highly focused mental state.
*   **Sensory Masking Success:** High-lipid butter fat carriers successfully encapsulated the bitter mushroom peptides, delivering a palatable chocolate profile without flavor dampening.
*   **Cortisol Regulation:** Salivary cortisol levels dropped by an average of 14% across high-stress subjects.`
  },
  {
    id: "doc-reg-fda-gras",
    title: "FDA-GRAS (Generally Recognized as Safe) Compliance Audit Guidelines",
    category: "Regulatory Compliance",
    description: "Mandatory dosing boundaries, labeling rules, and allergen isolation procedures for commercial functional confections.",
    readingTime: "12 mins read",
    author: "Marcus Brody, Chief Regulatory Counsel",
    updatedAt: "2026-06-25",
    content: `### 1. Introduction & Scope
Any ingredient marketed as a functional therapeutic confection in the US must align with FDA-GRAS regulations.

### 2. Strict Dosage Thresholds per Serving
Product developers must never exceed the following maximum active thresholds per single cookie serving:
*   **L-Theanine:** 400mg max.
*   **Ashwagandha Extract:** 600mg max (from certified root sources only).
*   **Lion's Mane Extract:** 3000mg max.

### 3. Required Warning Labels & Disclaimers
"This product is not intended to diagnose, treat, cure, or prevent any clinical disease." All marketing claims surrounding 'focus', 'sleep comfort', or 'strength recovery' must be accompanied by full scientific citation links.`
  }
];

export default function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Form / Add / Edit states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<"Clinical Research" | "Standard Operating Procedures (SOP)" | "Regulatory Compliance">("Standard Operating Procedures (SOP)");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formReadingTime, setFormReadingTime] = useState("5 mins read");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync documents from Firestore
  useEffect(() => {
    const q = query(collection(db, "documents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DocumentItem[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as DocumentItem);
      });

      // If Firestore database is empty, seed with initial templates
      if (list.length === 0) {
        seedInitialDocuments();
      } else {
        setDocuments(list);
      }
    }, (error) => {
      console.warn("Documents query failed or blocked:", error);
      // Fallback to offline defaults if connection blocked
      setDocuments(DEFAULT_DOCUMENTS);
    });

    return unsubscribe;
  }, []);

  const seedInitialDocuments = async () => {
    try {
      for (const d of DEFAULT_DOCUMENTS) {
        await setDoc(doc(db, "documents", d.id), d);
      }
    } catch (err) {
      console.error("Error seeding initial documents:", err);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleStartEdit = (d: DocumentItem) => {
    setEditingDocId(d.id);
    setFormTitle(d.title);
    setFormCategory(d.category);
    setFormDescription(d.description);
    setFormContent(d.content);
    setFormAuthor(d.author);
    setFormReadingTime(d.readingTime);
    setIsFormOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const docId = editingDocId || `doc-${Date.now()}`;
    const authorVal = formAuthor.trim() || auth.currentUser?.email || "Dr. Guest Scientist";

    const docData: DocumentItem = {
      id: docId,
      title: formTitle,
      category: formCategory,
      description: formDescription,
      content: formContent,
      updatedAt: new Date().toISOString().split("T")[0],
      author: authorVal,
      readingTime: formReadingTime
    };

    try {
      await setDoc(doc(db, "documents", docId), docData);
      setToastMessage(editingDocId ? "Protocol revised successfully." : "New R&D document registered.");
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving document:", err);
    }
  };

  const resetForm = () => {
    setEditingDocId(null);
    setFormTitle("");
    setFormCategory("Standard Operating Procedures (SOP)");
    setFormDescription("");
    setFormContent("");
    setFormAuthor("");
    setFormReadingTime("5 mins read");
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the document "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "documents", id));
      if (selectedDocId === id) setSelectedDocId(null);
      setToastMessage("Document purged from records.");
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase()) ||
      doc.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div id="documents_view" className="space-y-8 animate-fade-in text-[#171717]">
      {selectedDocId && selectedDoc ? (
        // Detailed Document Reading Mode
        <div className="space-y-6 text-left max-w-3xl mx-auto bg-white border border-[#E8DDC9] p-8 lg:p-12 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center border-b border-[#F8F2E9] pb-4">
            <button
              onClick={() => setSelectedDocId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6B6B6B] hover:text-[#C89A3C] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> BACK TO DIRECTORY
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleStartEdit(selectedDoc)}
                className="p-2 text-xs font-mono font-bold text-slate-500 hover:text-[#C89A3C] flex items-center gap-1 cursor-pointer hover:bg-slate-50 rounded"
              >
                <Pencil className="w-3.5 h-3.5" /> EDIT
              </button>
              <button
                onClick={() => handleDeleteDocument(selectedDoc.id, selectedDoc.title)}
                className="p-2 text-xs font-mono font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer hover:bg-slate-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" /> DELETE
              </button>
            </div>
          </div>

          <div className="space-y-3 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-mono font-bold bg-[#F8F2E9] text-[#C89A3C] px-2 py-0.5 rounded border border-[#E8DDC9]/50">
                {selectedDoc.category}
              </span>
              <span className="text-[10px] font-mono text-[#6B6B6B]">
                {selectedDoc.readingTime}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif text-[#171717] leading-tight font-bold">
              {selectedDoc.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B6B] pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5" /> {selectedDoc.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Updated: {selectedDoc.updatedAt}
              </span>
            </div>
          </div>

          {/* Document Content Block */}
          <div className="prose prose-stone max-w-none text-xs leading-relaxed space-y-4 pt-4 border-t border-[#F8F2E9]">
            {selectedDoc.content.split("\n").map((line, idx) => {
              if (line.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-sm font-bold font-mono uppercase tracking-wider text-[#171717] pt-4 pb-1 border-b border-[#F8F2E9]">
                    {line.replace("### ", "")}
                  </h3>
                );
              }
              if (line.startsWith("* ")) {
                return (
                  <li key={idx} className="ml-4 list-disc text-xs text-[#6B6B6B] my-1">
                    {line.replace("* ", "")}
                  </li>
                );
              }
              if (line.trim() === "") return <div key={idx} className="h-2"></div>;
              return (
                <p key={idx} className="text-[#6B6B6B] leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[#F8F2E9] flex items-center justify-between text-[11px] font-mono text-[#3F8C5A] font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> VERIFIED COMPLIANT WITH CRUMBLAB R&D PROTOCOL v2.1
            </span>
          </div>
        </div>
      ) : (
        // Document Directory list mode
        <div className="space-y-6">
          {/* Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8DDC9] pb-6 gap-4">
            <div>
              <span className="text-xs font-mono text-[#C89A3C] uppercase tracking-widest font-bold">
                Clinical Studies & SOP Repository
              </span>
              <h1 className="text-3xl font-serif text-[#171717] tracking-tight mt-1">
                R&D Laboratory Documents
              </h1>
              <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-2xl">
                Internal knowledge base, regulatory safety compliance sheets, neuro-sensory clinical whitepapers, and standard cookie processing recipes guidelines.
              </p>
            </div>

            <button
              onClick={() => {
                if (isFormOpen) {
                  resetForm();
                }
                setIsFormOpen(!isFormOpen);
              }}
              className="bg-[#171717] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Plus className={`w-4 h-4 text-[#C89A3C] transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
              {isFormOpen ? "Close Form" : "Create Document"}
            </button>
          </div>

          {isFormOpen && (
            <form
              onSubmit={handleSaveDocument}
              className="bg-white border border-[#E8DDC9] p-6 rounded-2xl shadow-sm text-left space-y-5 animate-slide-down"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-serif font-bold text-[#171717]">
                  {editingDocId ? "Revise Laboratory Document" : "Publish New Protocol/Document"}
                </h3>
                <p className="text-xs text-slate-400">
                  Submit high-efficacy research findings, regulations audits, or recipe guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Document Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="SOP-09: Post-Baking Cooling Dynamics"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white"
                  >
                    <option value="Standard Operating Procedures (SOP)">SOP</option>
                    <option value="Clinical Research">Clinical Research</option>
                    <option value="Regulatory Compliance">Regulatory Compliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Author</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Dr. Evelyn Vance"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Reading Time</label>
                  <input
                    type="text"
                    value={formReadingTime}
                    onChange={(e) => setFormReadingTime(e.target.value)}
                    placeholder="6 mins read"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Document Summary / Brief *</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description showing on listings page..."
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Document Body Content (Markdown format supported) *</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={8}
                  placeholder="### 1. Guideline Description&#10;Add technical content here. Support lists with * bullet points."
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-900 rounded-lg outline-none focus:bg-white font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#C89A3C] hover:bg-[#A87B2D] text-white text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingDocId ? "Update Protocol" : "Publish Document"}
                </button>
              </div>
            </form>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search standard protocols, guidelines, or trials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FFFDF8] border border-[#E8DDC9] pl-9 pr-4 py-2.5 text-xs rounded-xl placeholder-[#6B6B6B]/60 focus:outline-none focus:ring-1 focus:ring-[#C89A3C]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
              {["All", "Standard Operating Procedures (SOP)", "Clinical Research", "Regulatory Compliance"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-[11px] rounded-lg border font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-[#C89A3C] border-[#C89A3C] text-white"
                      : "bg-white border-[#E8DDC9] text-[#6B6B6B] hover:text-[#171717]"
                  }`}
                >
                  {cat === "Standard Operating Procedures (SOP)" ? "SOPs" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Document list card format */}
          <div className="space-y-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-[#E8DDC9] p-6 rounded-2xl hover:border-[#C89A3C] hover:shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono font-bold bg-[#F8F2E9] text-[#C89A3C] px-2 py-0.5 rounded border border-[#E8DDC9]/50">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B6B6B]">
                      {doc.readingTime}
                    </span>
                  </div>
                  <h2 className="text-base font-serif font-bold text-[#171717] hover:text-[#C89A3C] cursor-pointer transition-colors" onClick={() => setSelectedDocId(doc.id)}>
                    {doc.title}
                  </h2>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-3xl">
                    {doc.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6B] pt-1">
                    <div className="flex items-center gap-4">
                      <span>By: <span className="font-semibold text-[#171717]">{doc.author.split(",")[0]}</span></span>
                      <span>•</span>
                      <span>Revised: {doc.updatedAt}</span>
                    </div>

                    <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(doc)}
                        className="text-slate-400 hover:text-[#C89A3C] p-1 rounded hover:bg-slate-50"
                        title="Edit specifications"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50"
                        title="Purge protocol"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDocId(doc.id)}
                  className="px-4 py-2.5 bg-[#FFFDF8] border border-[#E8DDC9] text-xs font-semibold text-[#171717] rounded-xl hover:bg-[#F8F2E9] hover:border-[#C89A3C] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Eye className="w-4 h-4 text-[#C89A3C]" /> Read Protocol
                </button>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="text-center py-16 text-xs font-mono text-slate-400 italic bg-white border border-[#E8DDC9] rounded-2xl">
                No laboratory documents match current search query.
              </div>
            )}
          </div>

          <div className="p-4 bg-white border border-[#E8DDC9] rounded-xl flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-[#3F8C5A] shrink-0" />
            <span className="text-xs text-[#6B6B6B] leading-relaxed text-left">
              <span className="font-bold text-[#171717]">Compliance & Licensing:</span> Direct standard operating documentation is protected under intellectual trademark. Any deviation from lab SOPs must be approved by the Lead Food Technologist.
            </span>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 text-xs font-semibold animate-slide-in-up">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
