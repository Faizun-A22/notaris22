import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRedAlert } from '../../hooks/useRedAlert';
import { Search, Bell, Plus, Menu, AlertTriangle, ChevronDown } from 'lucide-react';

export const TopBar = ({ title, onMenuClick, onSearch, searchValue = '' }) => {
  const { user, profile } = useAuth();
  const { hasAlerts, count, overdueCases } = useRedAlert();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'SW';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="w-full flex items-center justify-between px-4 lg:px-8 pt-4 pb-2 shrink-0 select-none gap-4">
      {/* Search Input / Left Area */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#6366F1] active:scale-95 transition-all shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Soft Recessed Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            placeholder="Search tasks, clients, projects..."
            className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-slate-200/70 rounded-2xl text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium"
          />
        </div>
      </div>

      {/* Right Side Header Items: Notifications & User Card */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        
        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-[#6366F1] hover:shadow-md active:scale-95 transition-all relative"
            title="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            {hasAlerts && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Overdue Notification Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2.5">
                <h4 className="font-extrabold text-slate-800 text-[14px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Pemberitahuan Berkas ({count})
                </h4>
                {hasAlerts && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                    Kritis
                  </span>
                )}
              </div>

              {hasAlerts ? (
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {overdueCases.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(`/staff/documents/${c.id}`);
                      }}
                      className="p-2.5 bg-rose-50/60 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors cursor-pointer"
                    >
                      <p className="font-bold text-rose-700 text-[12.5px]">{c.clientName}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Berkas <span className="font-semibold text-slate-700">{c.serviceType}</span> batas: {c.estimationDate}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-[12.5px]">
                  Semua berkas aman dan sesuai jadwal.
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Pill matching screenshot */}
        <div 
          onClick={() => navigate(profile?.role === 'owner' ? '/owner/dashboard' : '/staff/settings')}
          className="flex items-center gap-3 bg-white/90 border border-slate-200/70 rounded-2xl px-3 py-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          {/* 3D Round Avatar */}
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-[12px] shadow-sm shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile?.full_name || 'Sarah Wijaya')
            )}
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-[13px] font-bold text-slate-800 leading-tight">
              {profile?.full_name || 'Alex Smith'}
            </h4>
            <p className="text-[10.5px] text-slate-400 font-semibold leading-none mt-0.5 capitalize">
              {profile?.title || (profile?.role === 'owner' ? 'Notaris Utama' : 'Staf Administrasi')}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
};

export default TopBar;
