import React, { useEffect, useState } from 'react';
import { Mail, KeyRound, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthClient } from '../../services/authClient';

/**
 * Password reset, in three steps: request -> confirm -> choose a password.
 *
 * Deliberately kept as its own component rather than another branch inside
 * `AuthView` (already 558 lines). It reuses `AuthClient` and the same visual
 * language — same radii, same input treatment, same indigo/slate palette — so it
 * reads as part of the existing portal rather than a bolted-on screen.
 *
 * Honesty rule: the API answers identically for known and unknown addresses, so
 * this UI never says "we found your account". When the deployment has no mail
 * provider the response's `transport` is `operator-console` and we say plainly
 * that an email was not sent.
 */

interface PasswordResetFlowProps {
  /** Pre-filled token when the user arrives from a reset link. */
  initialToken?: string | null;
  onBackToSignIn: () => void;
  onResetComplete?: () => void;
}

type Step = 'request' | 'checking' | 'choose' | 'done';

const passwordProblem = (value: string): string | null => {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter.';
  if (!/[0-9]/.test(value)) return 'Password must include at least one number.';
  return null;
};

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  initialToken,
  onBackToSignIn,
  onResetComplete,
}) => {
  const [step, setStep] = useState<Step>(initialToken ? 'checking' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string>(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Arriving from a reset link: verify the token before showing the form, so a
  // stale link is reported immediately instead of after typing a new password.
  useEffect(() => {
    let cancelled = false;
    if (!initialToken) return;

    (async () => {
      const valid = await AuthClient.validateResetToken(initialToken);
      if (cancelled) return;
      if (valid) {
        setStep('choose');
      } else {
        setStep('request');
        setError('That reset link is invalid or has expired. Request a new one below.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialToken]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const result = await AuthClient.requestPasswordReset(email.trim());
      setNotice(
        result.transport === 'email'
          ? `If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox and spam folder.`
          : "Request received. This deployment has no email provider configured, so no email was sent — the reset link has been written to the server log for the administrator.",
      );
    } catch (err: any) {
      setError(err?.message || 'Could not send the reset link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setSending(true);
    try {
      await AuthClient.resetPassword(token, password);
      setStep('done');
      onResetComplete?.();
    } catch (err: any) {
      setError(err?.message || 'Could not reset your password.');
    } finally {
      setSending(false);
    }
  };

  const backButton = (
    <button
      type="button"
      onClick={onBackToSignIn}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to sign in
    </button>
  );

  const errorBox = error && (
    <div
      role="alert"
      className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  );

  if (step === 'checking') {
    return (
      <div className="p-6 flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking your reset link…
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="p-6 space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Password updated</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You're signed in with your new password. All other devices have been signed out.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToSignIn}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          Continue to LearnCo
        </button>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <form onSubmit={handleReset} className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Choose a new password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            At least 8 characters, including a letter and a number.
          </p>
        </div>

        {errorBox}

        <div className="space-y-1.5">
          <label htmlFor="reset-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reset-confirm" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {sending ? 'Updating…' : 'Update password'}
        </button>

        <div className="text-center pt-1">{backButton}</div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Reset your password
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter the email address on your account and we'll send a reset link.
        </p>
      </div>

      {errorBox}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Email address
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {sending ? 'Sending…' : 'Send reset link'}
      </button>

      <div className="text-center pt-1">{backButton}</div>
    </form>
  );
};

export default PasswordResetFlow;
