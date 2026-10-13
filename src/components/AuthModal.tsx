import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
  customTitle?: string;
  customMessage?: string;
  lang?: 'en' | 'bn';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  customTitle,
  customMessage,
  lang = 'en',
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError(null);
    setSuccessNotice(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    setSuccessNotice(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessNotice(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setSuccessNotice(lang === 'bn' ? 'Google দিয়ে সফলভাবে লগইন হয়েছে!' : 'Signed in with Google successfully!');
      setTimeout(() => {
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || (lang === 'bn' ? 'Google লগইন সম্পন্ন করা যায়নি।' : 'Failed to sign in with Google.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(lang === 'bn' ? 'ইমেইল এড্রেস লিখুন।' : 'Please enter your email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError(lang === 'bn' ? 'আপনার নাম লিখুন।' : 'Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError(
          lang === 'bn'
            ? 'পাসওয়ার্ড দুটি মেলেনি। আবার পরীক্ষা করুন।'
            : 'Passwords do not match. Please verify.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(cleanEmail, password);
        setSuccessNotice(lang === 'bn' ? 'লগইন সফল হয়েছে!' : 'Logged in successfully!');
      } else {
        await register(cleanEmail, password, displayName.trim());
        setSuccessNotice(
          lang === 'bn' ? 'একাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Account registered successfully!'
        );
      }

      setTimeout(() => {
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = lang === 'bn' ? 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Authentication failed. Please try again.';
      
      const errorCode = err?.code || '';
      if (errorCode === 'auth/operation-not-allowed') {
        msg =
          lang === 'bn'
            ? 'এই Firebase প্রোজেক্টে ইমেইল/পাসওয়ার্ড চালু করা নেই। অনুগ্রহ করে নিচে দেওয়া "Google দিয়ে এগিয়ে যান" বাটন ব্যবহার করে ১-ক্লিকে লগইন করুন।'
            : 'Email/Password provider is not enabled in Firebase Console. Please use the "Continue with Google" button below for instant 1-click sign-in.';
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        msg = lang === 'bn' ? 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার পরীক্ষা করুন।' : 'Invalid email or password. Please verify and try again.';
      } else if (errorCode === 'auth/email-already-in-use') {
        msg = lang === 'bn' ? 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে। লগইন করুন।' : 'An account with this email already exists. Please log in.';
      } else if (errorCode === 'auth/weak-password') {
        msg = lang === 'bn' ? 'পাসওয়ার্ড অত্যন্ত দুর্বল। অন্তত ৬ অক্ষর দিন।' : 'Password is too weak. Please use at least 6 characters.';
      } else if (errorCode === 'auth/invalid-email') {
        msg = lang === 'bn' ? 'সঠিক ইমেইল ফরম্যাট দিন।' : 'Please enter a valid email address.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BrandLogo isDark={true} size="xs" showTagline={false} lang={lang} />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Custom Banner / Context Notice if required */}
          {(customTitle || customMessage) && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
              {customTitle && <p className="font-bold mb-0.5">{customTitle}</p>}
              {customMessage && <p>{customMessage}</p>}
            </div>
          )}

          {/* 1-Click Google Sign-In (Provisioned & Configured by default in Firebase) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 mb-5"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{lang === 'bn' ? 'Google সংযোগ হচ্ছে...' : 'Connecting with Google...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{lang === 'bn' ? 'Google দিয়ে এক ক্লিকে এগিয়ে যান' : 'Continue with Google'}</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
              {lang === 'bn' ? 'অথবা ইমেইল একাউন্ট' : 'or with email'}
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                mode === 'login'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
              {mode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                mode === 'register'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'নতুন একাউন্ট' : 'Create Account'}
              {mode === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Error & Success Feedback */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'আপনার নাম' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: তানভীর হাসান' : 'e.g. Tanvir Hasan'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'bn' ? 'কমপক্ষে ৬টি অক্ষর হতে হবে।' : 'Minimum 6 characters.'}
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'প্রক্রিয়াধীন...' : 'Processing...'}</span>
                </>
              ) : mode === 'login' ? (
                lang === 'bn' ? 'লগইন করুন' : 'Log In'
              ) : (
                lang === 'bn' ? 'একাউন্ট তৈরি করুন' : 'Create Free Account'
              )}
            </button>
          </form>

          {/* Footer information */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <p>
                {lang === 'bn' ? 'একাউন্ট নেই? ' : "Don't have an account yet? "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {lang === 'bn' ? 'রেজিস্টার করুন' : 'Sign up free'}
                </button>
              </p>
            ) : (
              <p>
                {lang === 'bn' ? 'ইতিমধ্যে একাউন্ট আছে? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {lang === 'bn' ? 'লগইন করুন' : 'Log in here'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
