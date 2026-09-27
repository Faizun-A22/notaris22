import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';
import { useAuth } from '../../hooks/useAuth';

export const OwnerLayout = () => {
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tampilkan loading spinner saat session sedang dicek
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-[40px]">sync</span>
      </div>
    );
  }

  // Redirect jika belum login atau bukan owner
  if (!user || !profile || profile.role !== 'owner') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar 
          title="LexNotary Admin" 
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable Content Shell */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-margin-page py-4 sm:py-6 md:py-stack-lg animate-fade-in">
            <Outlet />
          </div>

          {/* Consistent Footer */}
          <footer className="w-full max-w-[1440px] mx-auto px-margin-page py-6 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center text-[12px] text-on-surface-variant font-medium mt-auto">
            <p>&copy; 2026 Notaris Digital - Sistem Manajemen Berkas Terpadu</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                System Operational
              </span>
              <span>v1.0.4-stable</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
