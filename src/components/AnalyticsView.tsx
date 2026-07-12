import React from "react";
import { Recipe, Ingredient, Experiment } from "../types";
import {
  Award,
  TrendingUp,
  FlaskConical,
  Activity,
  IndianRupee,
  BarChart3,
  Percent,
  Sparkles,
  Scale,
  LineChart as LucideLineChart,
  PackageCheck
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from "recharts";

interface AnalyticsViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  experiments: Experiment[];
}

export default function AnalyticsView({ recipes, ingredients, experiments }: AnalyticsViewProps) {
  // 1. Aggregate Core KPI Stats directly from Firestore Data
  const totalRecipes = recipes.length;
  const totalIngredients = ingredients.length;
  const totalExperiments = experiments.length;

  const successfulExps = experiments.filter((e) => e.status === "Successful" || (e.tasteRating && e.tasteRating >= 4)).length;
  const successRate = totalExperiments > 0 ? (successfulExps / totalExperiments) * 100 : 0;

  // Calculate real inventory usage metrics (Sum of all stocks)
  const totalStockInGrams = ingredients.reduce((sum, i) => sum + (i.stock || 0), 0);
  const lowStockCount = ingredients.filter((i) => (i.stock || 0) <= (i.minStock || 100)).length;

  // Calculate average formulation cost
  const avgRecipeCost = totalRecipes > 0 
    ? recipes.reduce((sum, r) => sum + (r.costPerCookie || 0), 0) / totalRecipes 
    : 0;

  // 2. Pie Chart: Formulation Category Segment Distribution
  const categoriesMap: { [cat: string]: number } = {};
  recipes.forEach((r) => {
    categoriesMap[r.category] = (categoriesMap[r.category] || 0) + 1;
  });

  const PALETTE = ["#C89A3C", "#1E293B", "#3F8C5A", "#8B5CF6", "#EF4444", "#3B82F6"];

  const pieData = Object.entries(categoriesMap).map(([name, count], idx) => ({
    name: name,
    value: count,
    color: PALETTE[idx % PALETTE.length]
  }));

  // 3. Scatter Chart: Cost-Sensory Efficacy Curve
  const scatterData = recipes.map((r) => ({
    name: r.name,
    cost: Number((r.costPerCookie || 0).toFixed(2)),
    taste: Number((r.tasteRating || 0).toFixed(1)),
    version: r.version || 1
  }));

  // 4. Bar Chart: Functional Ingredients Inventory Usage relative to safety limits
  const functionalActives = ingredients
    .filter((i) => i.category === "Functional Actives")
    .map((i) => ({
      name: i.name.split(" ")[0] + " " + (i.name.split(" ")[1] || ""), // short name
      stock: i.stock,
      minStock: i.minStock || 100,
      cost: Number((i.unitCost || 0).toFixed(2))
    }));

  // 5. Line Chart: Sensory Rating Trends directly from Experiment Bakes in chronological order
  const sortedExperiments = [...experiments]
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const ratingTrendsData = sortedExperiments.map((exp, idx) => ({
    trial: exp.title || `Trial #${idx + 1}`,
    date: exp.date,
    taste: exp.tasteRating || 0,
    texture: exp.textureRating || 0,
    temp: exp.bakingTemp || 325
  }));

  // 6. Bar/Line Chart: Cost Trends over formulations
  const sortedRecipesByCost = [...recipes].sort((a, b) => (a.costPerCookie || 0) - (b.costPerCookie || 0));
  const costTrendsData = sortedRecipesByCost.map((r) => ({
    name: r.name,
    cost: Number((r.costPerCookie || 0).toFixed(2)),
    baseScore: r.tasteRating || 0
  }));

  // Custom tooltips
  const customTooltipScatter = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs text-left space-y-1.5 font-sans border border-slate-700">
          <div className="font-bold text-slate-100">{data.name}</div>
          <div className="text-slate-400 font-mono text-[10px]">Version: V{data.version}.0</div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-1 text-slate-300 font-mono text-[10px]">
            <span>Cost per cookie:</span>
            <span className="font-bold text-amber-400">₹{data.cost}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300 font-mono text-[10px]">
            <span>Taste Rating:</span>
            <span className="font-bold text-emerald-400">★ {data.taste}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const customTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalRecipes > 0 ? ((data.value / totalRecipes) * 100).toFixed(0) : "0";
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-md text-xs font-sans border border-slate-700">
          <span className="font-bold">{data.name}</span>: {data.value} formulation(s) ({percentage}%)
        </div>
      );
    }
    return null;
  };

  return (
    <div id="analytics_dashboard" className="space-y-8 animate-fade-in text-[#171717] text-left">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8DDC9] pb-6 gap-4">
        <div>
          <span className="text-xs font-mono text-[#C89A3C] uppercase tracking-widest font-bold">
            Biomedical Sensory & Margin Intelligence
          </span>
          <h1 className="text-3xl font-serif text-[#171717] tracking-tight mt-1">
            R&D Lab Analytics
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-2xl">
            Evaluate cost efficiencies, target formulations distribution, inventory buffer ratios, and real sensory experiment rating trends compiled in real-time from Firestore.
          </p>
        </div>
      </div>

      {/* Corporate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">Active Formulations</span>
            <span className="text-2xl font-serif text-[#171717] mt-1 block font-bold">{totalRecipes} Recipes</span>
            <span className="text-[10px] font-mono text-[#3F8C5A] block mt-1">₹{avgRecipeCost.toFixed(2)} Avg Unit Cost</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-[#E8DDC9]/50">
            <Scale className="w-5 h-5 text-[#C89A3C]" />
          </div>
        </div>

        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">Clinical Sensory Index</span>
            <span className="text-2xl font-serif text-[#171717] mt-1 block font-bold">{successRate.toFixed(1)}%</span>
            <span className="text-[10px] font-mono text-[#6B6B6B] block mt-1">{totalExperiments} Trials Run</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-[#E8DDC9]/50">
            <TrendingUp className="w-5 h-5 text-[#3F8C5A]" />
          </div>
        </div>

        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">Total Stock Volume</span>
            <span className="text-2xl font-serif text-[#171717] mt-1 block font-bold">{(totalStockInGrams / 1000).toFixed(2)} kg</span>
            <span className="text-[10px] font-mono text-[#C94949] block mt-1">{lowStockCount} Low Buffer Items</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-[#E8DDC9]/50">
            <PackageCheck className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white border border-[#E8DDC9] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">Functional Actives</span>
            <span className="text-2xl font-serif text-[#171717] mt-1 block font-bold">{totalIngredients} Compounds</span>
            <span className="text-[10px] font-mono text-indigo-600 block mt-1">Biochemically cataloged</span>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-[#E8DDC9]/50">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Trends across Recipes */}
        <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Formulation Cost Matrix Trend
              </h2>
              <p className="text-[11px] text-[#6B6B6B] font-medium">Ingredient cost levels sorted by magnitude</p>
            </div>
            <LucideLineChart className="w-4 h-4 text-[#C89A3C]" />
          </div>

          <div className="h-64">
            {costTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costTrendsData} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis unit="₹" tick={{ fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs text-left font-sans border border-slate-700">
                            <span className="font-bold block">{data.name}</span>
                            <span className="text-amber-400 block font-mono mt-1">Cost: ₹{data.cost}</span>
                            <span className="text-slate-400 block font-mono text-[10px]">Taste Target: ★{data.baseScore}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="cost" name="Raw Unit Cost (₹)" fill="#C89A3C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-mono text-slate-400 italic">
                No formulations registered to trace cost trends.
              </div>
            )}
          </div>
        </div>

        {/* Sensory Trial Rating Trends over time */}
        <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Clinical Rating Trends
              </h2>
              <p className="text-[11px] text-[#6B6B6B] font-medium">Chronological evaluation of Trial Bakes</p>
            </div>
            <Activity className="w-4 h-4 text-[#3F8C5A]" />
          </div>

          <div className="h-64">
            {ratingTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrendsData} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="trial" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs text-left font-sans border border-slate-700 space-y-1">
                            <span className="font-bold block text-slate-100">{data.trial}</span>
                            <span className="text-slate-400 text-[10px] block font-mono">Date: {data.date}</span>
                            <span className="text-emerald-400 block font-mono text-[11px]">Taste Rating: ★{data.taste}</span>
                            <span className="text-indigo-400 block font-mono text-[11px]">Texture Rating: ★{data.texture}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                  <Line type="monotone" dataKey="taste" name="Taste Rating" stroke="#3F8C5A" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="texture" name="Texture Rating" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-mono text-[#6B6B6B] italic">
                No active experiments found. Log trial bakes in Experiment Tracker to visualize ratings trends.
              </div>
            )}
          </div>
        </div>

        {/* Scatter Mapping Chart */}
        <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Cost-Sensory Efficiency Curve
              </h2>
              <p className="text-[11px] text-[#6B6B6B] font-medium">Goal: Maximized taste, optimized cost parameters</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#F8F2E9] text-[#C89A3C] px-2 py-0.5 rounded border border-[#E8DDC9]/40 font-bold">
              Scatter Mapping
            </span>
          </div>

          <div className="h-64">
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    dataKey="cost"
                    name="Cost"
                    unit=" ₹"
                    tick={{ fontSize: 9, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="taste"
                    name="Taste"
                    tick={{ fontSize: 9, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                    domain={[1, 5]}
                  />
                  <ZAxis type="number" range={[150, 250]} />
                  <Tooltip content={customTooltipScatter} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter name="Formulations" data={scatterData} fill="#C89A3C">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-mono text-slate-400 italic">
                No formulations registered to plot curve.
              </div>
            )}
          </div>
        </div>

        {/* Pie Segment chart */}
        <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
                Functional Composition Segment
              </h2>
              <p className="text-[11px] text-[#6B6B6B] font-medium">Distribution of therapeutic objectives</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">
              Formulation Segments
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64">
            <div className="w-40 h-40 shrink-0 relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={customTooltipPie} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-mono text-slate-300">No Data</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Total
                </span>
                <span className="text-xl font-bold text-slate-900">{totalRecipes}</span>
              </div>
            </div>

            {/* Pill Labels Grid */}
            <div className="space-y-2 flex-1 w-full overflow-y-auto max-h-56 pr-1 no-scrollbar text-left">
              {pieData.map((entry, idx) => {
                const percentage = totalRecipes > 0 ? ((entry.value / totalRecipes) * 100).toFixed(0) : "0";
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="font-mono text-slate-900 shrink-0 ml-2 font-bold">
                        {entry.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: entry.color }}></div>
                    </div>
                  </div>
                );
              })}

              {pieData.length === 0 && (
                <div className="text-center py-10 text-xs font-mono text-slate-400 italic">
                  No formulations yet registered to analyze.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Full-Width Ingredient Stocks/Prices Graph */}
      <div className="bg-white border border-[#E8DDC9] p-6 rounded-2xl space-y-4 shadow-sm text-left">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-bold">
              Active Biochemical Agent Stock levels
            </h2>
            <p className="text-[11px] text-[#6B6B6B] font-medium">
              Inventory buffer ratios of therapeutic active compounds relative to safety safety thresholds
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#F8F2E9] text-[#C89A3C] px-2 py-0.5 rounded border border-[#E8DDC9]/40 font-bold">
            Active Ingredients Analysis
          </span>
        </div>

        <div className="h-72">
          {functionalActives.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={functionalActives} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs text-left space-y-1">
                          <div className="font-bold text-slate-100">{data.name}</div>
                          <div className="flex justify-between gap-4 border-t border-white/10 pt-1 text-slate-300 font-mono text-[10px]">
                            <span>Current Stock:</span>
                            <span className="font-bold text-emerald-400">{data.stock}g</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300 font-mono text-[10px]">
                            <span>Min Safety Stock:</span>
                            <span className="font-bold text-amber-400">{data.minStock}g</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300 font-mono text-[10px]">
                            <span>Unit Cost:</span>
                            <span className="font-bold text-indigo-400">₹{data.cost}/g</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                <Bar dataKey="stock" name="Current Available Stock (g)" fill="#C89A3C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minStock" name="Safety Threshold Limit (g)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs font-mono text-slate-400 italic">
              No active functional ingredients are currently registered in the inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
