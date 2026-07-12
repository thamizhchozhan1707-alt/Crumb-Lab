import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { ShieldCheck, Beaker, ArrowRight, UserPlus, LogIn } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (err: any) {
      if (err?.code === "auth/admin-restricted-operation") {
        console.info("Firebase Anonymous Auth is restricted/disabled by admin. Activating seamless guest scientist bypass.");
      } else {
        console.warn("Demo mode connection failed:", err);
      }
      setError("Demo mode connection activated. Initializing instant local workspace...");
      // Seamless fallback to bypass if Firebase fails or is restricted
      onLoginSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_container" className="flex flex-col space-y-5">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-2">
            <Beaker className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">CrumbLab Cloud Sync</h1>
          <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Authorization Node</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Researcher Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              placeholder="scientist@crumblab.co"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Lab Passkey
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span className="animate-pulse">Authorizing Node...</span>
            ) : isSignUp ? (
              <>
                Create Lab Profile <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                Authenticate Cloud <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-indigo-600 underline transition-colors cursor-pointer"
          >
            {isSignUp ? "Registered? Sign In" : "Register Credentials"}
          </button>
          <span>•</span>
          <button
            onClick={handleDemoAccess}
            className="hover:text-indigo-600 underline transition-colors flex items-center gap-1 font-semibold cursor-pointer"
          >
            Skip Sync <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
