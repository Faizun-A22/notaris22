import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { 
  LayoutDashboard, 
  Users, 
  FilePlus, 
  FolderKanban, 
  CreditCard, 
  UserCheck, 
  Activity, 
  Globe2, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Menu Items matching exact layout in screenshot
  const menuItems = [
    {
      label: 'Dashboard',
      path: role === ROLES.OWNER ? '/owner/dashboard' : '/staff/dashboard',
      icon: LayoutDashboard,
    },
    ...(role === ROLES.STAFF ? [
      {
        label: 'File Baru',
        path: '/staff/buat-berkas',
        icon: FilePlus,
      }
    ] : []),
    {
      label: 'Daftar Berkas',
      path: role === ROLES.OWNER ? '/owner/documents' : '/staff/documents',
      icon: FolderKanban,
    },
    {
      label: 'Keuangan',
      path: role === ROLES.OWNER ? '/owner/finance' : '/staff/finance',
      icon: CreditCard,
    },
    {
      label: 'Data Klien',
      path: role === ROLES.OWNER ? '/owner/clients' : '/staff/clients',
      icon: UserCheck,
    },
    ...(role === ROLES.OWNER ? [
      {
        label: 'Kelola Staf',
        path: '/owner/staff',
        icon: Users,
      }
    ] : []),
    ...(role === ROLES.STAFF ? [
      {
        label: 'Aktivitas Staf',
        path: '/staff/activity',
        icon: Activity,
      }
    ] : []),
    {
      label: 'Pelacakan Publik',
      path: '/track',
      icon: Globe2,
      target: '_blank',
    }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`h-full ${isCollapsed ? 'w-[88px]' : 'w-[260px]'} bg-white/95 backdrop-blur-md rounded-3xl m-3 lg:m-4 flex flex-col p-4 shadow-[0_10px_35px_rgba(112,144,176,0.12)] border border-white/80 shrink-0 z-50
          fixed inset-y-0 left-0 lg:static transition-all duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Header with 3D checkmark pill icon like "Taskly" */}
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            {/* Soft 3D App Icon */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-[0_8px_18px_rgba(99,102,241,0.35)] shrink-0 group hover:rotate-3 transition-transform">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            
            {!isCollapsed && (
              <div className="text-left">
                <h1 className="text-[19px] font-extrabold text-slate-800 tracking-tight font-sans flex items-center gap-1.5">
                  Taskly<span className="text-[#6366F1]">.</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">
                  Notaris Digital
                </p>
              </div>
            )}
          </div>

          {/* Close Sidebar Drawer Button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-xl hover:bg-slate-100"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar px-1 py-1 space-y-1">
          {!isCollapsed && (
            <div className="text-left px-3 py-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                MENU UTAMA
              </span>
            </div>
          )}

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isExternal = item.target === '_blank';
              const Tag = isExternal ? 'a' : Link;
              const linkProps = isExternal
                ? { href: item.path, target: '_blank', rel: 'noopener noreferrer' }
                : { to: item.path };
              const Icon = item.icon;

              return (
                <Tag
                  key={item.path}
                  {...linkProps}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3.5 px-4'} py-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#F2F1FD] text-[#6366F1] font-bold shadow-[inset_0_2px_4px_rgba(99,102,241,0.06),0_2px_6px_rgba(99,102,241,0.08)] border border-[#E0DDFB]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'text-[#6366F1] scale-105' : 'text-slate-400'}`} />
                  {!isCollapsed && (
                    <span className="text-[13.5px] font-semibold tracking-tight">{item.label}</span>
                  )}
                </Tag>
              );
            })}
          </nav>

          {/* Settings Section */}
          <div className="pt-4 mt-auto">
            {!isCollapsed && (
              <div className="text-left px-3 py-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  PENGATURAN
                </span>
              </div>
            )}
            <Link
              to={role === ROLES.OWNER ? '/owner/settings' : '/staff/settings'}
              title={isCollapsed ? 'Pengaturan' : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3.5 px-4'} py-3 rounded-2xl transition-all duration-200 ${
                location.pathname.includes('settings')
                  ? 'bg-[#F2F1FD] text-[#6366F1] font-bold shadow-[inset_0_2px_4px_rgba(99,102,241,0.06),0_2px_6px_rgba(99,102,241,0.08)] border border-[#E0DDFB]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-[#F8FAFC]'
              }`}
            >
              <Settings className={`w-5 h-5 shrink-0 ${location.pathname.includes('settings') ? 'text-[#6366F1]' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <span className="text-[13.5px] font-semibold tracking-tight">Pengaturan</span>
              )}
            </Link>
          </div>
        </div>


        {/* Collapse toggle button */}
        <div className="hidden lg:flex items-center justify-center py-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Ciutkan</span>
              </>
            )}
          </button>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* 3D Round Avatar with initials */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-[13px] shrink-0 shadow-sm border-2 border-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.full_name || 'Sarah Wijaya')
              )}
            </div>

            {!isCollapsed && (
              <div className="text-left min-w-0">
                <p className="text-[13px] font-bold text-slate-800 truncate">
                  {profile?.full_name || 'Sarah W.'}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold truncate capitalize">
                  {profile?.title || (profile?.role === 'owner' ? 'Notaris Utama' : 'Staf Administrasi')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-xl hover:bg-rose-50 shrink-0"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
