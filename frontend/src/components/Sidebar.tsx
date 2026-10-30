import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Network,
  Bell,
  Settings,
  LogOut,
  PlusSquare,
  Building,
  ClipboardList,
  Package,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';

interface SidebarProps {
  onOpenRegisterModal: () => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenRegisterModal, unreadCount }) => {
  const { facility, username, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', to: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Clinical Registers', to: '/app/registers', icon: ClipboardList },
    { label: 'Inventory & Supplies', to: '/app/inventory', icon: Package },
    { label: 'Village Catchment', to: '/app/villages', icon: MapPin },
    { label: 'Staff Directory', to: '/app/staff', icon: Users },
    { label: 'Reports & Returns', to: '/app/reports', icon: FileSpreadsheet },
    { label: 'Affiliations', to: '/app/affiliations', icon: Network },
    { label: 'Notifications', to: '/app/notifications', icon: Bell, count: unreadCount },
    { label: 'Facility Profile', to: '/app/settings', icon: Settings },
  ];

  return (
    <aside className="w-[270px] bg-[#090d16] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/80 shadow-2xl relative select-none">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <NavLink to="/app/dashboard" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-300">
            <span className="text-xl font-black">✚</span>
          </div>
          <div>
            <div className="font-extrabold text-base text-white tracking-tight leading-tight">
              ArogyaSathi
            </div>
            <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
              Health Platform
            </div>
          </div>
        </NavLink>
      </div>

      {/* Facility Card */}
      <div className="relative z-10 px-4 mb-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-inner">
          {facility ? (
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-blue-400" /> Active Facility
                </span>
                <Badge
                  variant={facility.facility_type === 'PHC' ? 'blue' : 'teal'}
                  size="sm"
                >
                  {facility.facility_type === 'PHC' ? 'PHC' : 'SC'}
                </Badge>
              </div>
              <div className="font-bold text-white text-xs truncate" title={facility.name}>
                {facility.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {facility.district}, {facility.state}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/90 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">
                  {facility.code}
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
                  Online
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-400 font-medium mb-2.5">
                No facility registered yet
              </p>
              <button
                onClick={onOpenRegisterModal}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-md shadow-blue-600/30"
              >
                <PlusSquare className="w-3.5 h-3.5" /> Register Facility
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="relative z-10 px-3 py-1 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200" />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full shadow-sm">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="relative z-10 p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{username}</div>
              <div className="text-[10px] text-slate-400">{role === 'PHC' ? 'Medical Officer' : 'Staff Worker'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
