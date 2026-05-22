import { emailService } from "../services/emailService";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight, CheckCircle2, AlertCircle, Facebook } from "lucide-react";
import { auth, googleProvider, facebookProvider } from "../firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import Logo from "./Logo";
import Link from "next/link";

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean,
  onClose: () => void,
  onSuccess: () => void
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        // Send Welcome Email
        try {
          await emailService.sendWelcomeEmail(email, name || 'Valued Customer');
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Auth failed:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await emailService.sendPasswordResetEmail(email);
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setShowForgotPassword(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, facebookProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Facebook login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8 md:p-10 text-center space-y-6">
              <div className="space-y-2">
                <Logo className="h-8 mx-auto" dark />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Account Access</p>
    </div>

              {showForgotPassword ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-display font-bold uppercase tracking-tighter">Reset Password</h2>
                    <p className="text-xs text-gray-500 leading-relaxed">Enter your email and we'll send you a link to reset your password.</p>
    </div>

                  {resetSent ? (
                    <div className="p-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-left">
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>Reset link sent! Check your inbox.</span>
    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-gray-900 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Reset Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                      >
                        Back to Login
                      </button>
                    </form>
                  )}
    </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h2 className="text-xl font-display font-bold uppercase tracking-tighter">
                      {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {mode === 'login'
                        ? 'Sign in to track your orders and manage your account.'
                        : 'Join Grab & Go to save your details and track your orders.'}
                    </p>
    </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-left">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
    </div>
                  )}

                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    {mode === 'signup' && (
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-xs focus:border-black outline-none transition-all text-black"
                    />
                    {mode === 'login' && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                          Forgot Password?
                        </button>
    </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-gray-900 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
    </div>
                    <div className="relative flex justify-center text-[8px] uppercase tracking-[0.2em] font-bold">
                      <span className="bg-white px-2 text-gray-300">Or continue with</span>
    </div>
    </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      title="Google"
                      className="flex items-center justify-center py-3 border border-gray-100 hover:bg-gray-50 transition-all rounded-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </button>

                    <button
                      onClick={handleFacebookLogin}
                      disabled={loading}
                      title="Facebook"
                      className="flex items-center justify-center py-3 border border-gray-100 hover:bg-gray-50 transition-all rounded-sm"
                    >
                      <Facebook size={16} className="text-[#1877F2]" />
                    </button>
    </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
                    >
                      {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
    </div>
                </>
              )}

              <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                By continuing, you agree to our <Link href="/legal" className="text-black underline">Terms</Link>
              </p>
    </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            >
              <X size={20} />
            </button>
          </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

// ─── Smart Label Download Button ─────────────────────────────────────────────
// Handles async label generation: if labelUrl is a direct URL, opens it.
export default AuthModal;
