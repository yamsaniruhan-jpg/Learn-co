import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Calendar,
  X,
  CheckCheck,
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { Button } from '../ui/Button';
import { SEED_NOTIFICATIONS } from '../../data/seedData';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onNavigate?: (tabId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications = SEED_NOTIFICATIONS,
  onMarkAllAsRead,
  onSelectNotification,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (item: NotificationItem) => {
    if (typeof onSelectNotification === 'function') {
      onSelectNotification(item);
    }
    if (item.actionUrl && typeof onNavigate === 'function') {
      onNavigate(item.actionUrl);
      onClose();
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'streak_warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'mentor_prescription':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study reminders, prescriptions & streaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action bar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {notifications.length} total alerts
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No notifications at this moment. You're all caught up!
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                    : 'bg-white dark:bg-slate-800 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          item.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
            Close Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};
