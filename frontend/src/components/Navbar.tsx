import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Menu,
  RefreshCw,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useToast } from './ui/Toast';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  notifications,
  onRefreshNotifications,
}) => {
  const { facility, refreshFacility, checkConnection } = useAuth();
  const { success } = useToast();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadList = notifications.filter((n) => !n.read);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFacility(), checkConnection(), onRefreshNotifications()]);
    setIsRefreshing(false);
    success('Workspace refreshed');
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      onRefreshNotifications();
    } catch {
      // Ignored
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Home className="w-3.5 h-3.5" />
            <span>ArogyaSathi</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-800">
            {facility ? facility.name : 'Setup Clinic'}
          </span>
          {facility && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                {facility.district}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Workspace Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh workspace"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dot-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1 z-50 animate-fade-in-down">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">Clinical Alerts</span>
                  {unreadList.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      {unreadList.length} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.title.includes('EMERGENCY') ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                            🚨
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </div>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="shrink-0 p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
