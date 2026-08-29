import React from 'react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Video, 
  PlusCircle, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  LayoutDashboard,
  Sliders
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'clients' | 'reports' | 'generator' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'clients' | 'reports' | 'generator' | 'settings') => void;
  onOpenAddModal: () => void;
  todayCount: number;
  upcomingCount: number;
  totalCount: number;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  user: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  todayCount,
  upcomingCount,
  totalCount,
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
  user
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      subLabel: 'Daily Schedule & Overview',
      icon: LayoutDashboard,
      badge: todayCount > 0 ? `${todayCount} Today` : null,
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold animate-pulse'
    },
    {
      id: 'clients' as const,
      label: 'All Clients',
      subLabel: 'Customer Training Directory',
      icon: Users,
      badge: `${totalCount}`,
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700'
    },
    {
      id: 'reports' as const,
      label: 'Reports & Analytics',
      subLabel: 'Trainer Performance & Metrics',
      icon: BarChart3,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      subLabel: 'Dropdowns & Custom Fields',
      icon: Sliders,
      badge: null,
      badgeColor: ''
    }
  ];

  const handleNavClick = (tab: 'dashboard' | 'clients' | 'reports' | 'generator' | 'settings') => {
    setActiveTab(tab);
    if (isMobileOpen) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200 overflow-hidden no-scrollbar">
      
      {/* Brand / Logo Top */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="transition-opacity duration-200">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                TM System
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Training Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu (Slide bar modules) */}
      <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
        <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Main Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}-btn`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
              title={item.label}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="block text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                    {item.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Slide bar) */}
      <aside 
        className={`hidden md:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ease-in-out w-64 ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Slide-over drawer) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />
          
          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
