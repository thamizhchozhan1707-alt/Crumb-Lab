import React, { useState } from "react";
import { seedDatabase } from "../seed";
import { User, LogOut, Beaker, ShieldCheck, Database, RefreshCw, Landmark } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface SettingsViewProps {
  userEmail: string | null;
  onRefreshAllData: () => void;
  onLogout: () => void;
}

export default function SettingsView({ userEmail, onRefreshAllData, onLogout }: SettingsViewProps) {
  const [targetMargin, setTargetMargin] = useState(65);
  const [currency, setCurrency] = useState("USD ($)");
  const [labName, setLabName] = useState("CrumbLab Silicon Valley");
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (
      !window.confirm(
        "WARNING: This will restore the database to the initial premium seed dataset (Recipes, Ingredients, Experiments). Continue?"
      )
    )
      return;
    setIsResetting(true);
    try {
      await seedDatabase();
      onRefreshAllData();
      alert("Database successfully re-seeded with luxury functional R&D profiles!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error(err);
      onLogout(); // Force local logout anyway
    }
  };

  return (
    <div id="settings_panel" className="max-w-3xl mx-auto space-y-6 animate-fade-in text-slate-900">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Laboratory System Configuration
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-2">R&D Lab Settings</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage your researcher passkey credentials, database states, and active lab metadata.
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-sm text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-500" /> Researcher Credentials
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Authorized Email Profile
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{userEmail || "Anonymous Guest Scientist"}</div>
            <div className="text-[10px] font-mono text-indigo-600 mt-2 uppercase tracking-wider flex items-center gap-1.5 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-100 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Clearance Level: L3 Principal Investigator
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="bg-slate-950 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" /> Revoke Passkey / Log Out
          </button>
        </div>
      </div>

      {/* Lab Parameters */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-5 shadow-sm text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-indigo-500" /> Corporate Lab Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              R&D Lab Location Identity
            </label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-semibold">
              Financial Base Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
            >
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
              <option value="JPY (¥)">JPY (¥)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-semibold">
              Global Target Profit Margin (%)
            </label>
            <input
              type="number"
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-sm text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-rose-500" /> Database Maintenance
        </h2>

        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            In case your Firestore collections get altered or you wish to start exploring with the luxury pre-configured
            scientific recipes, ingredients, and test logs, you can click the button below to re-seed the laboratory
            databases.
          </p>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 hover:border-indigo-500 text-xs font-semibold px-5 py-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Re-seeding Molecular Profiles..." : "Restore Lab Seed Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
