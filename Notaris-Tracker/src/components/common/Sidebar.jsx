import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export const Sidebar = ({ isOpen, onClose }) => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();



  // Close drawer on path change (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const role = profile?.role === 'owner' ? ROLES.OWNER : ROLES.STAFF;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Avatar initials
  const getInitials = (name) => {
    if (!name) return 'SW';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Sidebar Menu Items based on Screenshot
  const menuItems = [
    {
      label: 'Dashboard',
      path: role === ROLES.OWNER ? '/owner/dashboard' : '/staff/dashboard',
      icon: 'dashboard',
    },
    ...(role === ROLES.OWNER ? [
      {
        label: 'Kelola Staf',
        path: '/owner/staff',
        icon: 'manage_accounts',
      }
    ] : []),
    ...(role === ROLES.STAFF ? [
      {
        label: 'File Baru',
        path: '/staff/buat-berkas',
        icon: 'add_box',
      }
    ] : []),
    {
      label: 'Semua File',
      path: role === ROLES.OWNER ? '/owner/documents' : '/staff/documents',
      icon: 'folder_open',
    },
    {
      label: 'Keuangan',
      path: role === ROLES.OWNER ? '/owner/finance' : '/staff/finance',
      icon: 'payments',
    },
    {
      label: 'Klien',
      path: role === ROLES.OWNER ? '/owner/clients' : '/staff/clients',
      icon: 'group',
    },
    ...(role === ROLES.STAFF ? [
      {
        label: 'Aktivitas Staf',
        path: '/staff/activity',
        icon: 'bar_chart',
      }
    ] : []),
    {
      label: 'Pelacakan Publik',
      path: '/track',
      icon: 'public',
      target: '_blank',
    }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`h-full w-[280px] bg-white border-r border-[#E2E8F0] flex flex-col p-6 shrink-0 z-50
          fixed inset-y-0 left-0 lg:static transition-transform duration-300 lg:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                gavel
              </span>
            </div>
            <div className="text-left">
              <h1 className="text-[19px] font-extrabold text-on-surface leading-none tracking-tight flex items-center gap-1 font-sans">
                LexNotary
              </h1>
            </div>
          </div>

          {/* Close Sidebar Drawer Button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-on-surface-variant hover:text-primary transition-colors p-1"
            aria-label="Close Sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* MENU Group */}
        <div className="flex flex-col flex-1">
          <div className="text-left mb-3">
            <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
              MENU
            </span>
          </div>

          {/* Menu Items List */}
          <nav className="space-y-2 mb-6 text-left">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isExternal = item.target === '_blank';
              const Tag = isExternal ? 'a' : Link;
              const linkProps = isExternal
                ? { href: item.path, target: '_blank', rel: 'noopener noreferrer' }
                : { to: item.path };

              return (
                <Tag
                  key={item.path}
                  {...linkProps}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-body-md ${
                    isActive
                      ? 'bg-primary-soft text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low transition-colors'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[15px] font-semibold">{item.label}</span>
                </Tag>
              );
            })}
          </nav>

          {/* SISTEM Group */}
          <div className="mt-auto border-t border-[#F1F5F9] pt-4 text-left">
            <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-3">
              SISTEM
            </span>
            <div className="space-y-2">


              {/* Pengaturan */}
              <Link
                to={role === ROLES.OWNER ? '/owner/settings' : '/staff/settings'}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-body-md ${
                  location.pathname.includes('settings')
                    ? 'bg-primary-soft text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low transition-colors'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  settings
                </span>
                <span className="text-[15px] font-semibold">Pengaturan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User profile card at the absolute bottom */}
        <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Avatar Circle */}
            <div className="w-11 h-11 rounded-full bg-[#E2E8F0] flex items-center justify-center flex-shrink-0 overflow-hidden border border-outline-variant shadow-sm">
              <span className="text-on-surface font-extrabold text-[14px]">
                {getInitials(profile?.full_name || 'Sarah Wijaya')}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-label-bold text-on-surface text-[14px] leading-tight font-bold truncate max-w-[140px]">
                {profile?.full_name || 'Sarah W.'}
              </p>
              <p className="text-[12px] text-on-surface-variant leading-none mt-1.5 font-medium truncate max-w-[140px]">
                {profile?.role === 'owner' ? 'Notaris Utama' : 'Staf Administrasi'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-error-container/20"
            title="Keluar"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
