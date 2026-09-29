import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const StaffLayout = () => {
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'staff') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F0F2F8] overflow-hidden relative font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar 
          title="Dashboard Staf Notaris"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 py-5 space-y-6">
          <Outlet />

          {/* Footer */}
          <footer className="w-full mt-10 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center text-[12px] text-slate-400 font-medium gap-3">
            <p>&copy; 2026 LexNotary Digital &bull; Sistem Manajemen Berkas Terpadu</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Portal Staf Aktif
              </span>
              <span>v2.4.0 (Claymorphic Edition)</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
