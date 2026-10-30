import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { FacilityRegistrationModal } from './FacilityRegistrationModal';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { api } from '../lib/api';

export const Layout: React.FC = () => {
  const { needsFacilityRegistration } = useAuth();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (needsFacilityRegistration) {
      setIsRegisterModalOpen(true);
    }
  }, [needsFacilityRegistration]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Backend may be offline or unauthenticated
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fc] font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          unreadCount={unreadCount}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[272px] h-full flex flex-col animate-slide-in-left">
            <Sidebar
              onOpenRegisterModal={() => {
                setMobileMenuOpen(false);
                setIsRegisterModalOpen(true);
              }}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          notifications={notifications}
          onRefreshNotifications={loadNotifications}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 xl:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Facility Registration Modal */}
      <FacilityRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};
