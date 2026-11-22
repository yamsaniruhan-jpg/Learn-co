import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  UserPlus,
  LogIn,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInDialog } from './GoogleSignInDialog';
import { PasswordResetFlow } from './PasswordResetFlow';
import { Button } from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, authError, clearAuthError, refreshUserData } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [accountNotFoundPrompt, setAccountNotFoundPrompt] = useState<boolean>(false);
  const [isGoogleDialogOpen, setIsGoogleDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLocalError(null);
      setAccountNotFoundPrompt(false);
      clearAuthError();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleDirectGoogleAuth = async () => {
    setLocalError(null);
    setAccountNotFoundPrompt(false);
    clearAuthError();
    setIsGoogleSubmitting(true);
    try {
      const result = await signInWithGoogle(undefined, undefined, undefined, 'auto');
      if (result === 'signed-in') onClose();
    } catch (err: any) {
      if (err?.isRedirecting) {
        return;
      }
      setLocalError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setAccountNotFoundPrompt(false);
    clearAuthError();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!password || (mode === 'signup' && (password.length < 8 || password.length > 1024 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)))) {
      setLocalError(mode === 'signup' ? 'Use 8 to 1024 characters, including a letter and a number.' : 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(cleanEmail, password);
      } else {
        await signUpWithEmail(cleanEmail, password, fullName.trim() || cleanEmail.split('@')[0]);
      }
      onClose();
    } catch (err: any) {
      const errMsg = err.message || 'Authentication failed.';
      setLocalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSignUp = () => {
    setMode('signup');
    setAccountNotFoundPrompt(false);
    setLocalError(null);
    clearAuthError();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 animate-in fade-in duration-150">
        <div
          className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#2A2647] rounded-3xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_12px_36px_rgba(45,42,74,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="p-6 pb-4 border-b border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#01000E] border border-[#6C5CE7]/60 shadow-xs shrink-0 p-0.5">
                <img
                  src="/logo-mark.png"
                  alt="LearnCo Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                  {mode === 'signin'
                    ? 'Sign In to Learn.co'
                    : mode === 'reset'
                    ? 'Reset Your Password'
                    : 'Create Learn.co Account'}
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] font-medium">
                  {mode === 'signin'
                    ? 'Access your personal learning matrix, streak & notes'
                    : mode === 'reset'
                    ? 'Recover access to your Learn.co account'
                    : 'Start your rigorous STEM mastery journey'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          {mode === 'reset' ? (
            <PasswordResetFlow
              onBackToSignIn={() => {
                setMode('signin');
                setLocalError(null);
                clearAuthError();
              }}
              onResetComplete={() => {
                void refreshUserData();
                onClose();
              }}
            />
          ) : (
          <div className="p-6 space-y-5">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                  setAccountNotFoundPrompt(false);
                  clearAuthError();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setLocalError(null);
                  setAccountNotFoundPrompt(false);
                  clearAuthError();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google Single Sign-On Button */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleDirectGoogleAuth}
                disabled={isSubmitting || isGoogleSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
              <div className="flex items-center justify-between gap-2">
                {typeof window !== 'undefined' && window.self !== window.top ? (
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in new tab</span>
                  </a>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setIsGoogleDialogOpen(true)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                >
                  Choose specific Google email &rarr;
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or with Email & Password
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Error Message */}
            {(localError || authError) && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError || authError}</span>
                </div>
                {typeof window !== 'undefined' &&
                  window.self !== window.top &&
                  /google|popup|frame|tab|unauthorized/i.test(localError || authError || '') && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open App in New Tab for Google Sign-In</span>
                    </a>
                  )}
                {mode === 'signin' && /uses Google Sign-In/i.test(localError || authError || '') && (
                  <button
                    type="button"
                    onClick={handleDirectGoogleAuth}
                    disabled={isGoogleSubmitting}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                )}
                {accountNotFoundPrompt && mode === 'signin' && !/uses Google Sign-In/i.test(localError || authError || '') && (
                  <button
                    type="button"
                    onClick={handleSwitchToSignUp}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create new account with this email</span>
                  </button>
                )}
                {mode === 'signup' && /already exists/i.test(localError || authError || '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setLocalError(null);
                      clearAuthError();
                    }}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Existing Account</span>
                  </button>
                )}
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ characters, a letter and a number"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? 'Verifying...' : mode === 'signin' ? 'Sign In to Your Account' : 'Create My Account'}
              </Button>

              {mode === 'signin' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setLocalError(null);
                      clearAuthError();
                    }}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          </div>
          )}
        </div>
      </div>

      {/* Google Authentication Dialog */}
      <GoogleSignInDialog
        isOpen={isGoogleDialogOpen}
        onClose={() => setIsGoogleDialogOpen(false)}
        initialIntent="auto"
        onSuccess={() => onClose()}
      />
    </>
  );
};

