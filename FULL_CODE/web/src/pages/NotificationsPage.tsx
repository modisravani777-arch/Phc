import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, CheckCheck, RefreshCw, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NotificationItem } from '../types';
import { api, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const NotificationsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Failed to load notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      success('Notification marked as read');
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Failed to mark read'));
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    try {
      await Promise.all(unread.map((n) => api.markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      success('All notifications marked as read');
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Could not mark all as read'));
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            Communications Centre
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">{unreadCount} unread system dispatches</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCheck className="w-4 h-4 text-accent-600" />}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={loadNotifications}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm w-fit text-xs font-bold">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            filter === 'ALL'
              ? 'bg-gradient-to-r from-navy-800 to-navy-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            filter === 'UNREAD'
              ? 'bg-gradient-to-r from-navy-800 to-navy-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-brand-50 mx-auto mb-3 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-card">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-base text-navy-900">
              {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              You're completely up to date with facility events.
            </p>
          </div>
        ) : (
          <div className="stagger-children">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 mb-3 ${
                  !notif.read
                    ? 'bg-white border-brand-200/60 shadow-card ring-1 ring-brand-100/50 hover:shadow-card-hover'
                    : 'bg-white/70 border-slate-200/60 shadow-sm hover:bg-white hover:shadow-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        !notif.read
                          ? 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-navy-900">{notif.title}</span>
                      {!notif.read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-lg">
                      {notif.message}
                    </p>
                    <div className="mt-2 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Notification #{notif.id}
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<CheckCircle className="w-3.5 h-3.5 text-accent-600" />}
                    onClick={() => handleMarkRead(notif.id)}
                    className="shrink-0"
                  >
                    Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
