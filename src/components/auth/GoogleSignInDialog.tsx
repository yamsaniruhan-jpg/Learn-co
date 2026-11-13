import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Mail,
  Lock,
  ChevronRight,
  ExternalLink,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface GoogleSignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialIntent?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const GoogleSignInDialog: React.FC<GoogleSignInDialogProps> = ({
  isOpen,
  onClose,
  initialIntent = 'signin',
  onSuccess,
}) => {
  const { signInWithGoogle } = useAuth();
  const [intent, setIntent] = useState<'signin' | 'signup'>(initialIntent);
  const [optionalEmailHint, setOptionalEmailHint] = useState<string>('');
  const [requireExactEmail, setRequireExactEmail] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState<boolean>(false);
  const [step, setStep] = useState<'prompt' | 'authorizing' | 'success'>('prompt');

  const savedGoogleEmail = localStorage.getItem('learnco_last_google_email') || '';
  const savedGoogleName = localStorage.getItem('learnco_last_google_name') || '';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAccountNotFound(false);
      setStep('prompt');
      setIntent(initialIntent);
      setOptionalEmailHint(savedGoogleEmail);
      setRequireExactEmail(false);
    }
  }, [isOpen, initialIntent, savedGoogleEmail]);

  if (!isOpen) return null;

  const handlePopupGoogleAuth = async (forcedIntent?: 'signin' | 'signup', enforcedEmail?: string) => {
    const activeIntent = forcedIntent || intent;
    const expectedEmail = enforcedEmail ? enforcedEmail.trim().toLowerCase() : undefined;

    setIsSubmitting(true);
    setError(null);
    setAccountNotFound(false);
    setStep('authorizing');

    try {
      await signInWithGoogle(
        expectedEmail,
        undefined,
        undefined,
        activeIntent
      );

      setStep('success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setStep('prompt');
      if (err?.notFound || err?.message?.includes('No Learn.co account found')) {
        setAccountNotFound(true);
        if (err?.email) setOptionalEmailHint(err.email);
        setError(err.message || 'No Learn.co account found for this Google email. Create one now?');
      } else {
        setError(err?.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A4A]/80 dark:bg-[#100E1C]/90 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#2A2647] rounded-3xl border border-[#E3DFF5] dark:border-[#3D3861] shadow-[0_12px_36px_rgba(45,42,74,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1B33] border border-[#E3DFF5] dark:border-[#3D3861] flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {intent === 'signup' ? 'Create Account with Google' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-400">Google OAuth 2.0 Identity Protocol</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intent Mode Selector */}
        <div className="px-6 pt-4">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIntent('signin');
                setError(null);
                setAccountNotFound(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                intent === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In (Existing)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIntent('signup');
                setError(null);
                setAccountNotFound(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                intent === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (New User)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
              {accountNotFound && (
                <button
                  type="button"
                  onClick={() => {
                    setIntent('signup');
                    setAccountNotFound(false);
                    setError(null);
                    handlePopupGoogleAuth('signup');
                  }}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    Create New Account{optionalEmailHint ? ` with ${optionalEmailHint}` : ''}
                  </span>
                </button>
              )}
            </div>
          )}

          {step === 'authorizing' ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Opening Google Account Chooser...
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Select your Google account in the popup window to verify your cryptographically signed identity token.
              </p>
            </div>
          ) : step === 'success' ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Google Authorization Verified!
              </h4>
              <p className="text-xs text-slate-400">Loading your Learn.co workspace...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {savedGoogleEmail && (
                  <button
                    type="button"
                    onClick={() => handlePopupGoogleAuth(intent)}
                    className="w-full p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                        {savedGoogleEmail.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {savedGoogleName || savedGoogleEmail.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Recent: {savedGoogleEmail}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>{intent === 'signup' ? 'Sign Up' : 'Continue'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )}

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireExactEmail}
                      onChange={(e) => setRequireExactEmail(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Verify against a specific Google email address</span>
                  </label>

                  {requireExactEmail && (
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={optionalEmailHint}
                        onChange={(e) => setOptionalEmailHint(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {intent === 'signup' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>New Account Initialization</span>
                  </div>
                  <p className="leading-relaxed">
                    Your account starts cleanly with 0 XP (Level 1 Scholar), tracked daily streaks, and full personalized onboarding.
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Google OAuth 2.0 Verification</span>
                </div>
                <p className="leading-relaxed">
                  You can pick any Google account in the popup chooser. Google issues a signed ID token verified directly on our server.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting || (requireExactEmail && !optionalEmailHint.trim())}
                onClick={() =>
                  handlePopupGoogleAuth(
                    intent,
                    requireExactEmail ? optionalEmailHint : undefined
                  )
                }
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting
                  ? 'Opening Google...'
                  : intent === 'signup'
                  ? 'Continue with Google (Sign Up)'
                  : 'Continue with Google (Sign In)'}
              </Button>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Cryptographic Firebase ID Token Auth</span>
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span>Learn.co Privacy</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
