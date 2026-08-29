import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  PlusCircle, 
  LogOut, 
  LogIn, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  ChevronDown, 
  User, 
  Bell,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Video,
  Sliders
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  onOpenMeetStudio: () => void;
  onOpenSettings?: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSync: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenAddModal,
  onOpenAuthModal,
  onOpenMeetStudio,
  onOpenSettings,
  user,
  onLogout,
  searchQuery,
  setSearchQuery,
  onSync,
  isSyncing = false
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* LEFT: Sidebar Toggle & System Name */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Hamburger / Collapse Toggle Button */}
            <button
              id="desktop-sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* System Name / Branding */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent truncate">
                  TM System
                </h1>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live System
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Client Training Schedules &amp; Support Management
              </p>
            </div>
          </div>

          {/* CENTER: Global Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="global-search-input"
                placeholder="Search client, ticket, trainer, KAM, package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 text-slate-100 placeholder-slate-400 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Quick Action, Sync & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Generate Link Button */}
            <button
              onClick={onOpenMeetStudio}
              id="header-meet-link-btn"
              className="hidden lg:flex px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl items-center gap-1.5 transition-colors cursor-pointer"
              title="Generate Instant Google Meet Link"
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span>Meet Link</span>
            </button>

            {/* Quick Settings Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                id="header-settings-btn"
                className="hidden lg:flex px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl items-center gap-1.5 transition-colors cursor-pointer"
                title="Dropdown Settings"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </button>
            )}

            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Sync Database"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* User Profile Section */}
            <div className="relative" ref={dropdownRef}>
              {user ? (
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    id="user-profile-menu-btn"
                    className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full ring-2 ring-emerald-500/50" 
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium capitalize">
                        {user.role || 'Trainer'}
                      </p>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <p className="text-xs font-bold text-white truncate">
                          {user.displayName || 'Tipsoi Team Member'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                          Role: {user.role === 'admin' ? 'System Admin' : 'Certified Trainer'}
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenMeetStudio();
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 flex items-center gap-2.5 transition-colors"
                        >
                          <Video className="w-4 h-4 text-emerald-400" />
                          <span>Meeting Link Generator</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAddModal();
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 flex items-center gap-2.5 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-400" />
                          <span>Add New Customer</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out / Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  id="header-login-btn"
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gmail / Login</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
