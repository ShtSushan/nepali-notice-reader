"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp,  setIsSignUp]  = useState(false);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [message,   setMessage]   = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // ── Sign Up ──
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(`Account created! We sent a confirmation email to ${email}. Click the link in that email, then come back here to log in.`);

      } else {
        // ── Log In ──
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://flagcdn.com/w160/np.png"
            alt="Nepal Flag"
            className="w-16 mx-auto"
          />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">
            Nepali Notice Reader
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          {/* Success message */}
          {message && (
            <p className="text-sm text-green-600 font-medium">{message}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {isLoading
              ? "Please wait..."
              : isSignUp ? "Create Account" : "Log In"
            }
          </button>
        </div>

        {/* Toggle sign up / log in */}
        <p className="text-center text-sm text-gray-400 mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
            className="text-blue-500 hover:underline font-medium"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}