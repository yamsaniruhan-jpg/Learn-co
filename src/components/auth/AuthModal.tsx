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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A4A]/75 dark:bg-black/85 animate-in fade-in duration-150">
        <div
          className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#111114] rounded-xl border border-[#E3DFF5] dark:border-[#232329] shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden animate-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-[#E3DFF5] dark:border-[#232329] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#09090B] border border-[#6C5CE7]/40 dark:border-[#CCFF00]/40 shrink-0 p-0.5">
                <img
                  src="/logo-mark.png"
                  alt="LearnCo Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D2A4A] dark:text-[#F4F4F6] font-display">
                  {mode === 'signin'
                    ? 'Sign in to LearnCo'
                    : mode === 'reset'
                    ? 'Reset your password'
                    : 'Create LearnCo account'}
                </h3>
                <p className="text-xs text-[#6B6890] dark:text-[#9E9EA9] font-medium">
                  {mode === 'signin'
                    ? 'Start your session & sync your study workspace'
                    : mode === 'reset'
                    ? 'Recover access to your LearnCo account'
                    : 'Create an account to save progress & mastery'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close authentication modal"
              className="p-2 rounded-lg text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] hover:bg-[#F7F5FF] dark:hover:bg-[#16161C] transition-colors cursor-pointer"
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
          <div className="p-5 sm:p-6 space-y-5">
            {/* Tab switch */}
            <div className="flex rounded-lg bg-[#F7F5FF] dark:bg-[#09090B] border border-[#E3DFF5] dark:border-[#232329] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                  setAccountNotFoundPrompt(false);
                  clearAuthError();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]'
                    : 'text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6]'
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
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B]'
                    : 'text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6]'
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
                className="w-full py-2.5 px-4 rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#FFFFFF] dark:bg-[#16161C] hover:bg-[#F7F5FF] dark:hover:bg-[#1D1D24] disabled:opacity-60 text-[#2D2A4A] dark:text-[#F4F4F6] font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
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
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] dark:text-[#CCFF00] hover:underline"
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
                  className="text-[11px] font-semibold text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#6C5CE7] dark:hover:text-[#CCFF00] transition-colors cursor-pointer"
                >
                  Choose specific Google email &rarr;
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E3DFF5] dark:bg-[#232329]" />
              <span className="micro text-[#6B6890] dark:text-[#9E9EA9]">
                Or Email &amp; Password
              </span>
              <div className="h-px flex-1 bg-[#E3DFF5] dark:bg-[#232329]" />
            </div>

            {/* Error Message */}
            {(localError || authError) && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
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
                      className="mt-1 w-full py-1.5 px-3 rounded-lg bg-white dark:bg-[#16161C] border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-[#1E1E24] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
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
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                )}
                {accountNotFoundPrompt && mode === 'signin' && !/uses Google Sign-In/i.test(localError || authError || '') && (
                  <button
                    type="button"
                    onClick={handleSwitchToSignUp}
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                    className="mt-1 w-full py-1.5 px-3 rounded-lg bg-[#6C5CE7] dark:bg-[#CCFF00] text-white dark:text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  <label className="text-xs font-semibold text-[#2D2A4A] dark:text-[#F4F4F6]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890] dark:text-[#71717A]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] text-[#2D2A4A] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#CCFF00]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2D2A4A] dark:text-[#F4F4F6]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890] dark:text-[#71717A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] text-[#2D2A4A] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#CCFF00]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2D2A4A] dark:text-[#F4F4F6]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890] dark:text-[#71717A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ characters, a letter and a number"
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-[#E3DFF5] dark:border-[#232329] bg-[#F7F5FF] dark:bg-[#09090B] text-[#2D2A4A] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#CCFF00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6890] dark:text-[#71717A] hover:text-[#2D2A4A] dark:hover:text-[#F4F4F6] cursor-pointer"
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
                {isSubmitting ? 'Verifying...' : mode === 'signin' ? 'Sign In to LearnCo' : 'Create LearnCo Account'}
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
                    className="text-xs font-bold text-[#6B6890] dark:text-[#9E9EA9] hover:text-[#6C5CE7] dark:hover:text-[#CCFF00] transition-colors cursor-pointer"
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

