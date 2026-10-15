import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Settings as SettingsIcon,
  Flame,
  Zap,
  Award,
  BookOpen,
  Calendar,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Bot,
  Filter,
  Upload,
  Camera,
  Shield,
  Bell,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Lock,
  Download,
  FileText,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthClient } from '../../services/authClient';
import {
  UserProfile,
  UserGamification,
  UserSettings,
  UserStatistics,
  MistakeRecord,
  XPTransaction,
  SubjectId,
  calculateLevelFromXp,
} from '../../types/auth';
import { Card } from '../ui/Card';
import { FormattedMathText } from '../common/FormattedMathText';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { XPIndicator, StreakIndicator } from '../ui/GamificationIndicators';

interface ProfileViewProps {
  onOpenCopilotWithContext: (context: string) => void;
  initialTab?: 'analytics' | 'settings' | 'mistakes' | 'xp_trail';
  initialSettingsSection?: 'account' | 'appearance' | 'learning' | 'notifications' | 'privacy';
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenCopilotWithContext,
  initialTab = 'analytics',
  initialSettingsSection = 'account',
}) => {
  const { user, profile, gamification, settings, updateProfile, updateSettings, uploadAvatar, signOut } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'settings' | 'mistakes' | 'xp_trail'>(
    initialTab
  );
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>([]);
  const [mistakeFilter, setMistakeFilter] = useState<string>('all');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Settings tab sub-section
  const [settingsSection, setSettingsSection] = useState<
    'account' | 'appearance' | 'learning' | 'notifications' | 'privacy'
  >(initialSettingsSection);

  // Form states for profile editing
  const [displayName, setDisplayName] = useState<string>(profile?.displayName || profile?.fullName || '');
  const [educationLevel, setEducationLevel] = useState<string>(profile?.educationLevel || '');
  const [targetExam, setTargetExam] = useState<string>(profile?.targetExam || '');
  const [targetScore, setTargetScore] = useState<string>(profile?.targetScore || '');
  const [examDate, setExamDate] = useState<string>(profile?.examDate || '');
  const [preferredStudyTime, setPreferredStudyTime] = useState<number>(
    profile?.preferredStudyTimeMinutes || 45
  );
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [institution, setInstitution] = useState<string>(profile?.institution || '');

  // Form states for settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings?.theme || 'system');
  const [notifications, setNotifications] = useState(
    settings?.notifications || {
      studyReminders: true,
      streakAlerts: true,
      achievementAlerts: true,
      mentorAlerts: true,
      copilotAlerts: true,
    }
  );
  const [privacy, setPrivacy] = useState<{
    profileVisibility: 'public' | 'cohort' | 'private';
    leaderboardVisibility: boolean;
    analyticsSharing: boolean;
  }>(
    settings?.privacy || {
      profileVisibility: 'public',
      leaderboardVisibility: true,
      analyticsSharing: true,
    }
  );
  const [learningPreferences, setLearningPreferences] = useState<{
    socraticGuidanceLevel: 'medium' | 'high' | 'low';
    showDetailedDerivations: boolean;
    timerVisible: boolean;
    soundEffects: boolean;
  }>(
    settings?.learningPreferences || {
      socraticGuidanceLevel: 'high',
      showDetailedDerivations: true,
      timerVisible: true,
      soundEffects: true,
    }
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backend stats and history
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [statsData, mistakesData, xpData] = await Promise.all([
          AuthClient.getUserStatistics(),
          AuthClient.getMistakes(mistakeFilter),
          AuthClient.getXpHistory(),
        ]);
        setStats(statsData);
        setMistakes(mistakesData);
        setXpTransactions(xpData);
      } catch (err) {
        console.error('Failed to load user analytics', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [mistakeFilter]);

  // Sync state if profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || profile.fullName || '');
      setEducationLevel(profile.educationLevel || '');
      setTargetExam(profile.targetExam || '');
      setTargetScore(profile.targetScore || '');
      setExamDate(profile.examDate || '');
      setPreferredStudyTime(profile.preferredStudyTimeMinutes || 45);
      setBio(profile.bio || '');
      setInstitution(profile.institution || '');
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setNotifications(settings.notifications);
      setPrivacy(settings.privacy);
      setLearningPreferences(settings.learningPreferences);
    }
  }, [settings]);

  // Avatar Upload with validation (Max 2MB, PNG/JPEG/WEBP)
  const handleAvatarFile = (file: File) => {
    setAvatarError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Invalid format. Please upload PNG, JPEG, or WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 2MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
        try {
          await uploadAvatar(dataUri);
          setSaveSuccessMsg('Profile image updated successfully.');
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        } catch (err: any) {
          setAvatarError(err.message || 'Failed to upload photo.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportData = () => {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      student: {
        id: user?.id,
        email: user?.email,
      },
      profile,
      gamification,
      settings,
      statistics: stats,
      mistakes,
      xpTransactions,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnco-student-portfolio-${user?.id || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        fullName: displayName,
        educationLevel,
        targetExam,
        targetScore,
        examDate,
        preferredStudyTimeMinutes: preferredStudyTime,
        bio,
        institution,
      });

      await updateSettings({
        theme,
        notifications,
        privacy,
        learningPreferences,
      });

      setSaveSuccessMsg('Profile and settings updated successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const levelInfo = calculateLevelFromXp(gamification?.xp || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Profile Header Card */}
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with Upload Hover Trigger */}
            <div className="relative group">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.displayName || profile?.fullName || 'Scholar'}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-indigo-500/10 shadow-lg object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                title="Upload Profile Picture"
              >
                <Camera className="w-5 h-5" />
                <span>Change</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
                  {profile?.displayName || profile?.fullName || 'Learn.co Scholar'}
                </h1>
                <Badge variant="primary" size="sm">
                  {profile?.role ? profile.role.toUpperCase() : 'STUDENT'}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {profile?.userId || profile?.id || 'user-alex-001'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile?.email} • Joined {profile?.joinedDate || 'August 2026'}
              </p>

              {profile?.institution && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {profile.institution} • {profile.educationLevel}
                </p>
              )}

              {/* Protected Attributes Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Server-Authoritative Profile</span>
              </div>
            </div>
          </div>

          {/* Gamification Pills */}
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <XPIndicator xp={gamification?.xp || 0} />
            <StreakIndicator streak={gamification?.currentStreak || 0} />
          </div>
        </div>

        {avatarError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {avatarError}
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </Card>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-4">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Performance & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings & Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('mistakes')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'mistakes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Mistake Notebook ({mistakes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('xp_trail')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'xp_trail'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>XP & Streak Audit</span>
        </button>
      </div>

      {/* TAB 1: PERFORMANCE & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card variant="bordered" padding="md" className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Accuracy Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats?.accuracyPercentage ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">
                  ({stats?.correctAnswers || 0}/{stats?.completedAttempts || 0} verified)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                Formula: Correct / Completed × 100
              </span>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total XP Earned
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-500">
                  {gamification?.xp ?? 0} XP
                </span>
                <span className="text-[10px] text-slate-400">
                  Level {gamification?.level ?? 1}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                {levelInfo.xpRemainingToNextLevel} XP to Level {levelInfo.level + 1}
              </span>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Daily Streak
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-orange-500 flex items-center gap-1">
                  <Flame className="w-5 h-5 fill-orange-500" />
                  {gamification?.currentStreak ?? 0}d
                </span>
                <span className="text-[10px] text-slate-400">
                  Max: {gamification?.longestStreak ?? 0}d
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                Timezone: {profile?.timezone || 'America/New_York'}
              </span>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Study Time This Week
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                  {profile?.studyTimeMinutesThisWeek ?? 0}m
                </span>
                <span className="text-[10px] text-slate-400">
                  Target: {profile?.preferredStudyTimeMinutes || 30}m/d
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                {(profile?.studyTimeMinutesThisWeek ?? 0) > 0 ? 'On track for weekly goal' : 'Start first session today'}
              </span>
            </Card>
          </div>

          {/* Level Progression Card */}
          <Card variant="elevated" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-bold text-xs">
                  {levelInfo.level}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Scholar Progression (Level {levelInfo.level})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Level Formula: <code>Level = ⌊√(XP / 25)⌋ + 1</code>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {levelInfo.progressPercent}% to Level {levelInfo.level + 1}
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Current Level Base: {levelInfo.currentLevelMinXp} XP</span>
              <span>Next Level Unlock: {levelInfo.nextLevelMinXp} XP</span>
            </div>
          </Card>

          {/* Subject Mastery Performance Breakdown */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Subject Accuracy & Question Distribution
              </h3>
              <Badge variant="default" size="sm">
                Live Data
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Mathematics', key: 'math', color: 'indigo', icon: '📐' },
                { name: 'Computer Science', key: 'cs', color: 'cyan', icon: '💻' },
                { name: 'Physics', key: 'physics', color: 'purple', icon: '⚡' },
                { name: 'Chemistry', key: 'chemistry', color: 'emerald', icon: '🧪' },
                { name: 'Biology', key: 'biology', color: 'rose', icon: '🧬' },
                { name: 'English', key: 'english', color: 'violet', icon: '📚' },
                { name: 'Data Science', key: 'data_science', color: 'teal', icon: '🤖' },
              ].map((sub) => {
                const subStats = stats?.subjectBreakdown?.[sub.key as SubjectId] || {
                  attempted: 1,
                  correct: 1,
                  accuracy: 100,
                };
                return (
                  <div
                    key={sub.key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                      </span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {subStats.accuracy}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${subStats.accuracy}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{subStats.correct} correct</span>
                      <span>{subStats.attempted} attempts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SETTINGS & PREFERENCES */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Sub-navigation */}
          <Card variant="elevated" padding="sm" className="space-y-1 h-fit">
            {[
              { id: 'account', label: 'Account & Identity', icon: User },
              { id: 'appearance', label: 'Appearance & Theme', icon: Sliders },
              { id: 'learning', label: 'Curriculum & Goals', icon: BookOpen },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy & Visibility', icon: Eye },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = settingsSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSettingsSection(item.id as any)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-rose-600 dark:text-rose-400 justify-start"
                onClick={signOut}
              >
                Sign Out of Session
              </Button>
            </div>
          </Card>

          {/* Settings Content Area */}
          <div className="md:col-span-3">
            <Card variant="elevated" padding="lg">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* SECTION: ACCOUNT & IDENTITY */}
                {settingsSection === 'account' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Personal & Account Information
                      </h3>
                      <p className="text-xs text-slate-400">
                        Update your public display identity and verified academic affiliations.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Email Address</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Read-Only
                          </span>
                        </label>
                        <input
                          type="email"
                          disabled
                          value={profile?.email || ''}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Institution / Organization
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. Institute of Applied Sciences"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Timezone
                        </label>
                        <input
                          type="text"
                          value={profile?.timezone || 'America/New_York'}
                          disabled
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Bio & Research Focus
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Share your learning focus or research areas..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* SECTION: APPEARANCE */}
                {settingsSection === 'appearance' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Appearance & Interface Theme
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose your interface visual scheme for dark room and focused study sessions.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light Mode', desc: 'Crisp high-contrast day palette' },
                        { id: 'dark', label: 'Dark Mode', desc: 'Eye-safe deep slate dark mode' },
                        { id: 'system', label: 'System Match', desc: 'Syncs automatically with OS' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTheme(item.id as any)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            theme === item.id
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-bold block mb-1">{item.label}</span>
                          <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION: LEARNING & GOALS */}
                {settingsSection === 'learning' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Curriculum & Examination Benchmarks
                      </h3>
                      <p className="text-xs text-slate-400">
                        Configure target exams, academic milestone dates, and study intensity.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Target Examination / Track
                        </label>
                        <input
                          type="text"
                          value={targetExam}
                          onChange={(e) => setTargetExam(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Target Score / Mastery Benchmark
                        </label>
                        <input
                          type="text"
                          value={targetScore}
                          onChange={(e) => setTargetScore(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Target Exam Date
                        </label>
                        <input
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Daily Study Session (Minutes)
                        </label>
                        <input
                          type="number"
                          min={15}
                          max={180}
                          step={15}
                          value={preferredStudyTime}
                          onChange={(e) => setPreferredStudyTime(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: NOTIFICATIONS */}
                {settingsSection === 'notifications' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Study Reminders & Streak Alerts
                      </h3>
                      <p className="text-xs text-slate-400">
                        Control real-time notifications for daily practice limits and streak preservation.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          key: 'studyReminders',
                          title: 'Daily Study Reminders',
                          desc: 'Receive alerts when your daily study session is scheduled.',
                        },
                        {
                          key: 'streakAlerts',
                          title: 'Streak Freeze & Danger Warnings',
                          desc: 'Notify when your streak is within 4 hours of expiry.',
                        },
                        {
                          key: 'achievementAlerts',
                          title: 'Milestone & Level-Up Celebrations',
                          desc: 'Receive badges and level achievements in real-time.',
                        },
                        {
                          key: 'copilotAlerts',
                          title: 'Copilot Socratic Suggestions',
                          desc: 'Proactive diagnostic tips when struggling on weak concepts.',
                        },
                      ].map((item) => {
                        const isChecked = (notifications as any)[item.key];
                        return (
                          <label
                            key={item.key}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block">{item.desc}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                setNotifications({ ...notifications, [item.key]: e.target.checked })
                              }
                              className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION: PRIVACY, POLICY & PLATFORM RULES */}
                {settingsSection === 'privacy' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Header */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <span>Privacy Governance, Policy & Student Rules</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Complete transparent specification of student data rights, academic honor code, and system rules.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Export My Data (.json)</span>
                      </button>
                    </div>

                    {/* Granular Visibility & Privacy Controls */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        1. Granular Visibility Controls
                      </h4>

                      {/* Profile Visibility Tier */}
                      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Profile Visibility Mode
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                            {privacy.profileVisibility}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Controls whether cohort peers can view your badges, solved diagnostics, and STEM trajectory.
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {(['public', 'cohort', 'private'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPrivacy({ ...privacy, profileVisibility: mode })}
                              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                                privacy.profileVisibility === mode
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {mode === 'private' ? 'Anonymous' : mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Public Leaderboard Toggle */}
                      <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer">
                        <div className="space-y-0.5 pr-4">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Public Leaderboard Enrollment & Standings
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            When enabled, your rank, verified streak days, and XP appear on the cohort leaderboard. Disabling will mask your name as &quot;Anonymous Scholar&quot; while maintaining your private progression.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacy.leaderboardVisibility}
                          onChange={(e) =>
                            setPrivacy({ ...privacy, leaderboardVisibility: e.target.checked })
                          }
                          className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer shrink-0"
                        />
                      </label>

                      {/* Diagnostic Analytics Sharing */}
                      <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer">
                        <div className="space-y-0.5 pr-4">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Diagnostic Mistake History Sharing for Socratic Calibration
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Permits the Socratic AI tutor to inspect prior incorrect attempts to construct targeted derivation hints without revealing final answers.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacy.analyticsSharing}
                          onChange={(e) =>
                            setPrivacy({ ...privacy, analyticsSharing: e.target.checked })
                          }
                          className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer shrink-0"
                        />
                      </label>
                    </div>

                    {/* Official Privacy Policy Standards */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>2. Official Student Privacy Policy & Data Guarantees</span>
                      </h4>

                      <div className="space-y-2.5">
                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Zero Commercial Data Brokering Guarantee
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            Learn.co never sells, licenses, rents, or monetizes student email addresses, problem attempt histories, or study session audio. All telemetry is strictly utilized for diagnostic concept derivation and personalized pedagogical remediation.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              AI Query Isolation & Secure Proxying
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            Interactions with Google Gemini AI models are strictly executed via secure server-side proxy routes. No client-side API keys or user session tokens are exposed to third-party scripts. Raw prompts do not feed public training sets.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                              <Scale className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              FERPA & COPPA Educational Alignment
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            Educational progress metrics, question logs, and focus session records are encrypted at rest and in transit. Students and educational mentors retain the right to audit, export, or permanently purge their data records at any time.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Zero-Knowledge Password Security & Cookie Discipline
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            User passwords are automatically hashed with HMAC-SHA256 and salted. Plaintext passwords are never stored or logged. Local storage is strictly reserved for session continuity and active streak caching—never for ad tracking.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Code of Conduct & System Rules */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-500" />
                        <span>3. Platform Rules & Academic Code of Conduct</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>⚖️ Rule 1: Authentic Derivations</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            All practice submissions must reflect genuine student problem-solving. Automated scripts, scrapers, or bot solvers are strictly prohibited and trigger automatic streak resets.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🎯 Rule 2: 25-Questions Daily Limit</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Learn.co enforces a strict 25 question/day quota to eliminate cognitive fatigue and prioritize deep concept retention over superficial volume grinding.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🧠 Rule 3: Spaced Retrieval Invariant</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Logged errors are queued into the Mistake Notebook and automatically resurfaced on Ebbinghaus intervals (Day 3, 7, 14, 30) for verified neurological consolidation.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🤝 Rule 4: Mentorship & Cohort Respect</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Peer interactions, study room communications, and shared creator materials must adhere to collegial academic decorum and constructive collaboration.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🔒 Rule 5: Credential Isolation & Secure Sign-In</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Upon sign-in, user credentials and email accounts are securely persisted to the authenticated backend database. Each scholar is enrolled in the cohort leaderboard with protected ranking records.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🤖 Rule 6: Socratic AI Tutoring Integrity</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            The Socratic AI Copilot is bound to first-principles guidance. It generates pedagogical hints and conceptual scaffolding rather than leaking raw exam solutions without derivation.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>📦 Rule 7: Data Portability & Complete Erasure</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Scholars maintain unconditional sovereignty over their academic data. You can download a complete JSON telemetry export at any time or request immediate permanent account purge.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🏅 Rule 8: Fair Play in 30-Tier Leaderboard</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Streak days and XP advancement must be earned through verified daily diagnostic sessions. Weekly division resets ensure dynamic, meritocratic progression across all 30 sub-stages.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Changes are automatically verified and synced to server.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSaving}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: MISTAKE NOTEBOOK */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Active Mistake Notebook ({mistakes.length})
              </h3>
              <p className="text-xs text-slate-400">
                Questions answered incorrectly in diagnostic practice. Re-test to clear misconceptions.
              </p>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'math', 'cs', 'physics', 'chemistry', 'biology', 'english', 'data_science'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setMistakeFilter(sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    mistakeFilter === sub
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {mistakes.length === 0 ? (
            <Card variant="bordered" padding="lg" className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Mistake Notebook is Clear!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No unresolved mistakes recorded for this filter. High-accuracy mastery maintained.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mistakes.map((mistake) => (
                <Card key={mistake.id} variant="elevated" padding="md" className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={mistake.subjectId} size="sm">
                        {mistake.subjectId.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {mistake.topicId}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Bot className="w-3.5 h-3.5 text-purple-500" />}
                      className="text-xs text-indigo-600 dark:text-indigo-400"
                      onClick={() =>
                        onOpenCopilotWithContext(
                          `Let's analyze my mistake on this question: "${mistake.questionText}". My answer was "${mistake.userAnswer}", but the correct answer is "${mistake.correctAnswer}". Guide me through where my reasoning broke down.`
                        )
                      }
                    >
                      Ask Copilot
                    </Button>
                  </div>

                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <FormattedMathText text={mistake.questionText} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                      <strong className="block text-[10px] uppercase font-bold text-rose-500">
                        Your Submitted Answer
                      </strong>
                      <FormattedMathText text={String(mistake.userAnswer)} inline />
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-500">
                        Authoritative Correct Answer
                      </strong>
                      <FormattedMathText text={String(mistake.correctAnswer)} inline />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Analytical Explanation:
                    </strong>
                    <FormattedMathText text={mistake.explanation} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: XP & AUDIT TRAIL */}
      {activeTab === 'xp_trail' && (
        <div className="space-y-4">
          <Card variant="elevated" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Server Authoritative XP Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Every XP credit is cryptographically verified server-side (+5 XP per correct question).
                </p>
              </div>
              <Badge variant="primary" size="sm">
                Audited & Immutable
              </Badge>
            </div>

            <div className="space-y-2">
              {xpTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No XP transactions logged yet.</p>
              ) : (
                xpTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {tx.reason === 'QUESTION_CORRECT'
                            ? 'Diagnostic Question Solved'
                            : tx.reason === 'INITIAL_BONUS'
                            ? 'Welcome Orientation Credit'
                            : tx.reason}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {tx.id}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      +{tx.amount} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
