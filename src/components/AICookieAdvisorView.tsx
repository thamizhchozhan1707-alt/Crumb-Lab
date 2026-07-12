import React, { useState } from "react";
import { Recipe, Ingredient } from "../types";
import {
  Sparkles,
  Brain,
  Cpu,
  ArrowRight,
  BookOpen,
  Scale,
  AlertCircle,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Lightbulb,
  FileText
} from "lucide-react";

interface AICookieAdvisorViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
}

export default function AICookieAdvisorView({ recipes, ingredients }: AICookieAdvisorViewProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [queryType, setQueryType] = useState<"optimize-cost" | "improve-texture" | "suggest-functional-boost" | "general">("optimize-cost");
  const [customQuery, setCustomQuery] = useState("");
  const [adviceText, setAdviceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  const handleGetAdvice = async () => {
    if (!selectedRecipeId) return;
    setLoading(true);
    setAdviceText("");

    try {
      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: selectedRecipe,
          query: queryType === "general" ? customQuery : "",
          type: queryType
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAdviceText(data.text);
      } else {
        setAdviceText(
          `### R&D Advisory Warning\n\nFailed to establish synaptic linkage to advisor engine. Reason: ${
            data.error || "Unknown server response."
          }`
        );
      }
    } catch (err: any) {
      console.error(err);
      setAdviceText(
        `### Laboratory Connectivity Failure\n\nUnable to reach server. Please ensure the development server is active and the GEMINI_API_KEY is configured in the Secrets panel.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adviceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe manual markdown parser supporting bullet points, bold text, headings, and code blocks
  const parseMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4
            key={idx}
            className="text-xs font-bold text-slate-900 mt-5 mb-2 border-b border-slate-100 pb-1 uppercase tracking-wider font-mono"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3
            key={idx}
            className="text-sm font-bold text-indigo-600 mt-6 mb-3 border-b border-slate-150 pb-1 uppercase tracking-wider"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-base font-bold text-slate-950 mt-6 mb-3 uppercase tracking-tight">
            {line.replace("# ", "")}
          </h2>
        );
      }

      // Unordered list items
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-600 leading-relaxed my-1">
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-indigo-500 bg-indigo-50/50 p-3 text-xs italic text-slate-600 my-3 rounded-r-lg font-medium"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      }

      // Empty line
      if (line.trim() === "") {
        return <div key={idx} className="h-2.5"></div>;
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed my-2 font-medium">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Sub helper to render inline bold elements: **text**
  const renderInlineMarkdown = (inlineText: string) => {
    const parts = inlineText.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return inlineText;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div id="ai_advisor_view" className="space-y-6 animate-fade-in text-slate-900">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Molecular AI Formulation Intelligence
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-2">AI Cookie Advisor</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Optimize compound performance, solve flavor masking challenges, and simulate baking dynamics.
          </p>
        </div>
        <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse hidden sm:block shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Parameter Panel: Notion-style Controls */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-6 shadow-sm text-left">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-950 tracking-tight">Advisor Inputs</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Specify the optimization vectors for active compound blending.
            </p>
          </div>

          {/* Recipe Select */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Formulation Target
            </label>
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="">-- Choose Target Recipe --</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (V{r.version}.0)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Advisor Analysis Angle
            </label>
            <div className="space-y-2">
              {[
                {
                  id: "optimize-cost",
                  label: "Financial / Cost Optimization",
                  desc: "Reduce raw ingredient prices without sacrificing sensory performance."
                },
                {
                  id: "improve-texture",
                  label: "Structural / Texture Chemistry",
                  desc: "Configure moisture ratios for crisp perimeters and chewy centers."
                },
                {
                  id: "suggest-functional-boost",
                  label: "Active Therapeutic Synergy",
                  desc: "Incorporate bioactive extracts and mask bitter earthy tastes."
                },
                {
                  id: "general",
                  label: "Custom Molecular Query",
                  desc: "Direct prompt input for arbitrary food chemistry questions."
                }
              ].map((m) => (
                <label
                  key={m.id}
                  onClick={() => setQueryType(m.id as any)}
                  className={`block border p-3.5 cursor-pointer transition-all rounded-xl text-left ${
                    queryType === m.id
                      ? "bg-indigo-50/50 border-indigo-500/60 shadow-inner"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={queryType === m.id}
                      onChange={() => {}}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-900">{m.label}</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1 pl-5 leading-normal font-medium">
                    {m.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Query box if general query selected */}
          {queryType === "general" && (
            <div className="space-y-1.5 animate-slide-down">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Custom Research Hypothesis
              </label>
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="e.g. How will replacing whole butter fats with extra-virgin coconut lipid systems affect gluten-free matrix elasticity?"
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg focus:bg-white"
              />
            </div>
          )}

          {/* Trigger */}
          <button
            onClick={handleGetAdvice}
            disabled={loading || !selectedRecipeId}
            className="w-full bg-slate-950 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4 animate-spin text-indigo-400" /> Analyzing Molecular Ratios...
              </span>
            ) : (
              <>
                Initiate AI Advisory <ArrowRight className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        </div>

        {/* Right Output Panel: Clean Markdown Workspace */}
        <div className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[450px] shadow-sm text-left">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-500" /> Scientific Advisory Log
              </h2>

              {adviceText && (
                <button
                  onClick={handleCopy}
                  className="text-[10px] font-mono uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied Draft
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Recommendations
                    </>
                  )}
                </button>
              )}
            </div>

            {loading ? (
              /* Premium scan progress indicator */
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <span className="absolute w-full h-full rounded-full border-4 border-dashed border-indigo-500 animate-spin"></span>
                  <span className="absolute w-10 h-10 rounded-full border-2 border-dashed border-slate-900 animate-reverse-spin"></span>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold animate-pulse">
                    Scanning compound density...
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                    Comparing botanical compounds and formulating taste profiles with certified biochemical guidelines.
                  </p>
                </div>
              </div>
            ) : adviceText ? (
              /* Custom parsed markdown advice */
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {parseMarkdown(adviceText)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-200" />
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase">Consulting Desk Idle</div>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal">
                    Select a formulation from the master parameters and click "Initiate AI Advisory" to query the Senior
                    R&D food sciences simulation agent.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 flex gap-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Model: Gemini 2.5 Flash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-indigo-500" /> Precision: High-Density Food Lab
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
