import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CasesProvider } from './contexts/CasesContext';

// Layouts
import OwnerLayout from './components/layouts/OwnerLayout';
import StaffLayout from './components/layouts/StaffLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Client
import ClientTrackingPage from './pages/client/ClientTrackingPage';
import ClientPublicStatus from './pages/client/ClientPublicStatus';

// Finance
import FinancePage from './pages/common/FinancePage';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerStaffManagement from './pages/owner/OwnerStaffManagement';
import OwnerDocumentsPage from './pages/owner/OwnerDocumentsPage';
import OwnerClientsPage from './pages/owner/OwnerClientsPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffDocumentsPage from './pages/staff/StaffDocumentsPage';
import StaffActivityPage from './pages/staff/StaffActivityPage';
import StaffSettingsPage from './pages/staff/StaffSettingsPage';
import CreateDocumentPage from './pages/staff/CreateDocumentPage';
import { DocumentDetailPage } from './pages/staff/DocumentDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CasesProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/owner" element={<LoginPage />} />
            <Route path="/login/staff" element={<LoginPage />} />
            <Route path="/track" element={<ClientTrackingPage />} />
            <Route path="/status" element={<ClientPublicStatus />} />

            {/* Owner Routes */}
            <Route path="/owner" element={<OwnerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="staff" element={<OwnerStaffManagement />} />
              <Route path="documents" element={<OwnerDocumentsPage />} />
              <Route path="clients" element={<OwnerClientsPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="activity" element={<StaffActivityPage />} />
              <Route path="settings" element={<StaffSettingsPage />} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="buat-berkas" element={<CreateDocumentPage />} />
              <Route path="documents" element={<StaffDocumentsPage />} />
              <Route path="documents/:id" element={<DocumentDetailPage />} />
              <Route path="clients" element={<OwnerClientsPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="activity" element={<StaffActivityPage />} />
              <Route path="settings" element={<StaffSettingsPage />} />
            </Route>

            {/* Catch-all → login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </CasesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
