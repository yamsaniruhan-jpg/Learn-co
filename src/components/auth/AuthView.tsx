import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

interface AuthViewProps {
  initialMode?: 'signin' | 'signup' | 'session';
  onNavigateToTab?: (tab: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'signin',
  onNavigateToTab,
}) => {
  const {
    user,
    profile,
    gamification,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    authError,
    clearAuthError,
  } = useAuth();

  const [activeMode, setActiveMode] = useState<'signin' | 'signup' | 'session'>(
    isAuthenticated ? 'session' : initialMode === 'session' ? 'signin' : initialMode
  );

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      setSuccessMessage('Successfully signed in! Accessing scholar kernel...');
      setTimeout(() => {
        if (onNavigateToTab) onNavigateToTab('dashboard');
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid email or password combination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, fullName || 'Learn.co Scholar');
      setSuccessMessage('Account created successfully! Launching personalized onboarding...');
      setTimeout(() => {
        if (onNavigateToTab) onNavigateToTab('dashboard');
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    clearAuthError();
    try {
      await signInWithGoogle('scholar.google@learn.co', 'Google Scholar');
      setSuccessMessage('Google Single Sign-On verified! Loading dashboard...');
      setTimeout(() => {
        if (onNavigateToTab) onNavigateToTab('dashboard');
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Google Single Sign-On failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSignIn = async (demoEmail: string, demoPass: string) => {
    setIsSubmitting(true);
    setLocalError(null);
    clearAuthError();
    try {
      await signInWithEmail(demoEmail, demoPass);
      setSuccessMessage(`Switched to demo account: ${demoEmail}`);
      setTimeout(() => {
        if (onNavigateToTab) onNavigateToTab('dashboard');
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || 'Demo authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutAction = () => {
    signOut();
    setSuccessMessage('You have been securely signed out of your session.');
    setActiveMode('signin');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Learn.co Session & Identity Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
          Authentication Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Manage your verified student credentials, sign in to sync streaks and XP, or securely sign out of your device.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <button
            onClick={() => {
              setActiveMode('signin');
              setLocalError(null);
              clearAuthError();
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'signin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('signup');
              setLocalError(null);
              clearAuthError();
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                setActiveMode('session');
                setLocalError(null);
                clearAuthError();
              }}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'session'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out / Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {(localError || authError) && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-semibold">{localError || authError}</span>
        </div>
      )}

      {/* TAB: SIGN IN */}
      {activeMode === 'signin' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Main Form */}
          <Card variant="elevated" padding="lg" className="md:col-span-7 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Scholar Sign In</span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter your registered credentials to restore state and continue practice streaks.
              </p>
            </div>

            {/* Google Single Sign On */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer"
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
              <span>Continue with Google Single Sign-On</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or with Email & Password
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@learn.co"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In to Learn.co'}
              </Button>
            </form>
          </Card>

          {/* Right Demo Preset Cards */}
          <div className="md:col-span-5 space-y-4">
            <Card variant="bordered" padding="md" className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Instant Demo Accounts
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click any pre-seeded persona to test authenticated sessions, level-ups, and streak tracking:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSignIn('learner@learn.co', 'LearnCo2026!')}
                  className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Alex Vance (Student)
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> 85 XP •{' '}
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> 4d Streak
                    </span>
                  </div>
                  <Badge variant="primary" size="sm">
                    Student
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoSignIn('elena@learn.co', 'Cohort2026!')}
                  className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Elena Rostova (Top Scholar)
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> 1,420 XP •{' '}
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> 18d Streak
                    </span>
                  </div>
                  <Badge variant="default" size="sm">
                    Master
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoSignIn('marcus@learn.co', 'Educator2026!')}
                  className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Dr. Marcus Thorne (Educator)
                    </span>
                    <span className="text-[10px] text-slate-400">Educator Studio & Reviewer</span>
                  </div>
                  <Badge variant="cs" size="sm">
                    Educator
                  </Badge>
                </button>
              </div>
            </Card>

            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cryptographically Signed JWT</span>
              </div>
              <p>
                Tokens are stored in standard local storage and verified against server-side authorization endpoints on every request.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CREATE ACCOUNT */}
      {activeMode === 'signup' && (
        <Card variant="elevated" padding="lg" className="max-w-xl mx-auto space-y-6">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Create New Scholar Account</span>
            </h3>
            <p className="text-xs text-slate-400">
              Join the cohort to track STEM mastery across Math, CS, Physics, Chemistry, and Biology.
            </p>
          </div>

          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.vance@stanford.edu"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Scholar Benefits:
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                <li>+50 XP Welcome Orientation Credit</li>
                <li>Daily Practice Allowance (25 questions/day)</li>
                <li>AI Socratic Mentorship & Concept Graph Analytics</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full"
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              {isSubmitting ? 'Creating Account...' : 'Register & Launch Scholar Onboarding'}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB: SIGN OUT / ACTIVE SESSION */}
      {activeMode === 'session' && (
        <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.displayName || profile?.fullName || 'Scholar'}
                size="lg"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {profile?.displayName || profile?.fullName || 'Active Scholar'}
                </h3>
                <p className="text-xs text-slate-400">{user?.email || profile?.email}</p>
              </div>
            </div>

            <Badge variant="primary" size="sm">
              Level {gamification?.level || 1} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current XP
              </span>
              <span className="text-base font-black text-amber-500">
                {gamification?.xp || 85} XP
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Daily Streak
              </span>
              <span className="text-base font-black text-orange-500">
                {gamification?.currentStreak || 4} Days
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Role
              </span>
              <span className="text-base font-black text-slate-800 dark:text-slate-200 uppercase">
                {user?.role || 'STUDENT'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <LogOut className="w-4 h-4" />
              <span>Terminate Session & Sign Out</span>
            </div>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
              Signing out will invalidate your active token on this browser. All your verified XP, streaks, and mistake logs remain safely recorded on the Learn.co server.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleSignOutAction}
                className="bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Confirm Sign Out
              </Button>

              <button
                type="button"
                onClick={() => setActiveMode('signin')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Switch Account Instead
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
