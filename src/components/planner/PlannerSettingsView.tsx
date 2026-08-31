import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Clock,
  Calendar,
  Bell,
  RotateCcw,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { StudyScheduleSettings, DayOfWeek } from '../../types/planner';

interface PlannerSettingsViewProps {
  settings: StudyScheduleSettings;
  onSaveSettings: (updates: Partial<StudyScheduleSettings>) => Promise<void>;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const PlannerSettingsView: React.FC<PlannerSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>(settings.availableDays);
  const [dailyMinutes, setDailyMinutes] = useState(settings.dailyAvailableMinutes);
  const [preferredStartTime, setPreferredStartTime] = useState(settings.preferredStartTime);
  const [preferredEndTime, setPreferredEndTime] = useState(settings.preferredEndTime);
  const [preferredSessionLength, setPreferredSessionLength] = useState(
    settings.preferredSessionLength
  );
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(
    settings.breakDurationMinutes
  );
  const [autoRescheduleMissed, setAutoRescheduleMissed] = useState(
    settings.autoRescheduleMissed
  );
  const [reminderNotifications, setReminderNotifications] = useState(
    settings.reminderNotifications
  );
  const [targetExamTrack, setTargetExamTrack] = useState(
    settings.targetExamTrack || 'Advanced STEM Mastery'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setAvailableDays(settings.availableDays);
    setDailyMinutes(settings.dailyAvailableMinutes);
    setPreferredStartTime(settings.preferredStartTime);
    setPreferredEndTime(settings.preferredEndTime);
    setPreferredSessionLength(settings.preferredSessionLength);
    setBreakDurationMinutes(settings.breakDurationMinutes);
    setAutoRescheduleMissed(settings.autoRescheduleMissed);
    setReminderNotifications(settings.reminderNotifications);
    setTargetExamTrack(settings.targetExamTrack || 'Advanced STEM Mastery');
  }, [settings]);

  const toggleDay = (d: DayOfWeek) => {
    if (availableDays.includes(d)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((day) => day !== d));
      }
    } else {
      setAvailableDays([...availableDays, d]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        availableDays,
        dailyAvailableMinutes: dailyMinutes,
        preferredStartTime,
        preferredEndTime,
        preferredSessionLength,
        breakDurationMinutes,
        autoRescheduleMissed,
        reminderNotifications,
        targetExamTrack,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Planner & Capacity Settings</h3>
            <p className="text-xs text-slate-400">
              Configure your daily workload limits, available days, and scheduling heuristics
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Available Study Days */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Available Study Days
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((d) => {
              const active = availableDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Capacity Slider */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Daily Available Study Time
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                The planner flags overload conflicts whenever scheduled tasks exceed this limit
              </p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-400">
              {dailyMinutes} mins ({Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60}m)
            </span>
          </div>

          <input
            type="range"
            min="30"
            max="300"
            step="15"
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Time Windows & Session Durations */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Study Windows & Durations
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">Preferred Start Time</label>
              <input
                type="time"
                value={preferredStartTime}
                onChange={(e) => setPreferredStartTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">Preferred End Time</label>
              <input
                type="time"
                value={preferredEndTime}
                onChange={(e) => setPreferredEndTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Default Session Duration
              </label>
              <select
                value={preferredSessionLength}
                onChange={(e) => setPreferredSessionLength(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">Break Buffer (mins)</label>
              <select
                value={breakDurationMinutes}
                onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={5}>5 mins</option>
                <option value={10}>10 mins</option>
                <option value={15}>15 mins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggles & Preferences */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
            Automation & Adaptive Settings
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Auto-Reschedule Missed Tasks
              </span>
              <span className="text-[11px] text-slate-400">
                Automatically suggest moving past uncompleted sessions forward
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRescheduleMissed}
              onChange={(e) => setAutoRescheduleMissed(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Study Session Reminders
              </span>
              <span className="text-[11px] text-slate-400">
                Notify before scheduled study blocks start
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminderNotifications}
              onChange={(e) => setReminderNotifications(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
          </label>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            id="btn-save-planner-settings"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Schedule Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
