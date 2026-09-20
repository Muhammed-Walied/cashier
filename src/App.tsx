import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LoginScreen } from './components/Auth/LoginScreen';
import { POSScreen } from './components/POS/POSScreen';
import { ProductList } from './components/Products/ProductList';
import { InvoiceList } from './components/Invoices/InvoiceList';
import { CustomerList } from './components/Customers/CustomerList';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { UserManagement } from './components/Users/UserManagement';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { ActivationScreen } from './components/License/ActivationScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-[#a8a8c8] text-sm font-semibold">
        جاري تحميل البرنامج...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const [licenseStatus, setLicenseStatus] = useState<string>('checking');
  const [isCheckingLicense, setIsCheckingLicense] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    setIsCheckingLicense(true);
    try {
      if (window.electronAPI?.getLicenseStatus) {
        const result = await window.electronAPI.getLicenseStatus();
        setLicenseStatus(result.status);
      } else {
        // If not running in Electron (e.g., dev browser), skip license check
        setLicenseStatus('valid');
      }
    } catch {
      setLicenseStatus('not_found');
    }
    setIsCheckingLicense(false);
  };

  // Show loading while checking license
  if (isCheckingLicense) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-[#a8a8c8] text-sm font-semibold font-cairo" dir="rtl">
        جاري التحقق من الترخيص...
      </div>
    );
  }

  // Show activation screen if license is not valid
  if (licenseStatus !== 'valid') {
    return (
      <ActivationScreen
        status={licenseStatus as 'not_found' | 'invalid' | 'expired' | 'machine_mismatch'}
        onActivated={() => {
          setLicenseStatus('valid');
        }}
      />
    );
  }

  // License is valid — show the app normally
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<POSScreen />} />
            <Route path="products" element={<ProductList />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="reports" element={<ReportsScreen />} />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
