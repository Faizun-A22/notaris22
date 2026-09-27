import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRedAlert } from '../../hooks/useRedAlert';

export const TopBar = ({ title, onMenuClick }) => {
  const { user, profile } = useAuth();
  const { hasAlerts, count, overdueCases } = useRedAlert();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Helper to get clean display title
  const getDisplayTitle = () => {
    if (title === 'Dashboard Berkas Notaris') return 'Dashboard';
    if (title === 'Documents') return 'Semua File';
    return title || 'Dashboard';
  };

  return (
    <header className="w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 h-[80px] shrink-0 select-none">
      
      {/* Page Title & Hamburger for Mobile */}
      <div className="flex items-center gap-4">
        {/* Responsive Drawer Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-xl border border-outline-variant bg-white shadow-sm active:scale-95 animate-in fade-in"
          aria-label="Open Sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <h2 className="text-[24px] font-extrabold text-on-surface leading-none hidden lg:block tracking-tight font-sans">
          {getDisplayTitle()}
        </h2>
      </div>

      {/* Right side aligned elements (Notifications, CTA Button) */}
      <div className="flex items-center gap-4 flex-1 justify-end">

        {/* Notifications Button */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-11 h-11 border border-[#E2E8F0] rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors bg-white relative active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              notifications
            </span>
            {hasAlerts && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Overdue Notification Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="font-bold text-on-surface text-[15px] flex items-center gap-2 border-b border-outline-variant pb-2 mb-2">
                <span className="material-symbols-outlined text-error">warning</span>
                Pemberitahuan ({count})
              </h4>
              {hasAlerts ? (
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {overdueCases.map((c) => (
                    <div key={c.id} className="text-left text-label-sm p-2 bg-error-container/20 rounded border border-error-container">
                      <p className="font-bold text-error">{c.clientName}</p>
                      <p className="text-on-surface-variant font-medium text-[12px] mt-0.5">
                        Berkas {c.serviceType} Overdue sejak {c.estimationDate}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-[13px] py-4 text-center">
                  Tidak ada pemberitahuan penting.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Green CTA "+ File Baru" Button (Only for Staff) */}
        {profile?.role === 'staff' && (
          <button
            onClick={() => navigate('/staff/buat-berkas')}
            className="h-11 px-5 bg-primary text-white rounded-full font-bold text-[13px] hover:opacity-95 shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.97] shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">add</span>
            <span>File Baru</span>
          </button>
        )}

      </div>
    </header>
  );
};

export default TopBar;
