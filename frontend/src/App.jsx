import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetDashboard from './pages/Dashboard/AssetDashboard'; // New
import SysAdminDashboard from './pages/Dashboard/SysAdminDashboard'; // New
import UserList from './pages/SysAdmin/Users/UserList'; // Moved
import UserDetail from './pages/SysAdmin/Users/UserDetail'; // Moved
import RoleList from './pages/SysAdmin/Roles/RoleList'; // Moved
import SettingsPage from './pages/SysAdmin/Settings/SettingsPage';
import ActivityLogs from './pages/SysAdmin/ActivityLogs/ActivityLogs'; // Moved
import ActivityLogDetail from './pages/SysAdmin/ActivityLogs/ActivityLogDetail'; // Moved
import AssetList from './pages/Asset/Assets/AssetList'; // Moved to Assets
import AssetDetail from './pages/Asset/Assets/AssetDetail'; // Moved to Assets
import CategoryDetail from './pages/Asset/Categories/CategoryDetail'; // Moved to Categories
import CategoryList from './pages/Asset/Categories/CategoryList'; // Moved to Categories
import SupplierList from './pages/Asset/Suppliers/SupplierList'; // Moved to Suppliers
import SupplierDetail from './pages/Asset/Suppliers/SupplierDetail'; // Moved to Suppliers
import LocationList from './pages/Asset/Locations/LocationList'; // Moved to Locations
import LocationDetail from './pages/Asset/Locations/LocationDetail'; // Moved to Locations
import CredentialList from './pages/Asset/Credentials/CredentialList'; // Moved to Credentials
import CredentialDetail from './pages/Asset/Credentials/CredentialDetail'; // Moved to Credentials
import CredentialCategoryList from './pages/Asset/CredentialCategories/CredentialCategoryList'; // Moved to CredentialCategories
import CredentialCategoryDetail from './pages/Asset/CredentialCategories/CredentialCategoryDetail'; // Moved to CredentialCategories
import IpAddressList from './pages/Asset/IpAddresses/IpAddressList'; // New
import AccessoryList from './pages/Asset/Accessories/AccessoryList'; // New
import LicenseList from './pages/Asset/Licenses/LicenseList'; // New
import MaintenanceList from './pages/Asset/Maintenance/MaintenanceList';
import MaintenanceDetail from './pages/Asset/Maintenance/MaintenanceDetail';
import ModuleSelection from './pages/Modules/ModuleSelection';
import Profile from './pages/Profile/Profile'; // New

import AccessDenied from './pages/AccessDenied'; // New
import PermissionRoute from './components/Route/PermissionRoute'; // New


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/modules" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/asset/scan/:id" element={<AssetDetail readOnly={true} />} />

            {/* Protected routes */}
            <Route
              path="/modules"
              element={
                <ProtectedRoute>
                  <ModuleSelection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* MainLayout routes (with sidebar) */}
              <Route index element={<Navigate to="/modules" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="access-denied" element={<AccessDenied />} />

              {/* Sysadmin routes */}
              <Route path="sysadmin">
                <Route path="dashboard" element={<SysAdminDashboard />} />
                <Route
                  path="users"
                  element={
                    <PermissionRoute permission="sysadmin.users.view">
                      <UserList />
                    </PermissionRoute>
                  }
                />
                <Route path="users/:id" element={
                  <PermissionRoute permission="sysadmin.users.view">
                    <UserDetail />
                  </PermissionRoute>
                } />
                <Route
                  path="roles"
                  element={
                    <PermissionRoute permission="sysadmin.roles.view">
                      <RoleList />
                    </PermissionRoute>
                  }
                />
                <Route path="settings" element={<SettingsPage />} />
                <Route
                  path="logs"
                  element={
                    <PermissionRoute permission="sysadmin.logs.view">
                      <ActivityLogs />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="logs/:id"
                  element={
                    <PermissionRoute permission="sysadmin.logs.view">
                      <ActivityLogDetail />
                    </PermissionRoute>
                  }
                />
              </Route>

              {/* Asset routes */}
              <Route path="asset">
                <Route path="dashboard" element={<AssetDashboard />} />
                <Route
                  path="items"
                  element={
                    <PermissionRoute permission="asset.items.view">
                      <AssetList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="items/:id"
                  element={
                    <PermissionRoute permission="asset.items.view">
                      <AssetDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <PermissionRoute permission="asset.categories.view">
                      <CategoryList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="categories/:id"
                  element={
                    <PermissionRoute permission="asset.categories.view">
                      <CategoryDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="suppliers"
                  element={
                    <PermissionRoute permission="asset.suppliers.view">
                      <SupplierList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="suppliers/:id"
                  element={
                    <PermissionRoute permission="asset.suppliers.view">
                      <SupplierDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="locations"
                  element={
                    <PermissionRoute permission="asset.locations.view">
                      <LocationList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="locations/:id"
                  element={
                    <PermissionRoute permission="asset.locations.view">
                      <LocationDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="maintenance"
                  element={
                    <PermissionRoute permission="asset.maintenance.view">
                      <MaintenanceList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="maintenance/:id"
                  element={
                    <PermissionRoute permission="asset.maintenance.view">
                      <MaintenanceDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="credentials"
                  element={
                    <PermissionRoute permission="asset.credentials.view">
                      <CredentialList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="credentials/:id"
                  element={
                    <PermissionRoute permission="asset.credentials.view">
                      <CredentialDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="credential-categories"
                  element={
                    <PermissionRoute permission="asset.credential_categories.view">
                      <CredentialCategoryList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="credential-categories/:id"
                  element={
                    <PermissionRoute permission="asset.credential_categories.view">
                      <CredentialCategoryDetail />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="ip-addresses"
                  element={<IpAddressList />}
                />
                <Route
                  path="accessories"
                  element={<AccessoryList />}
                />
                <Route
                  path="licenses"
                  element={<LicenseList />}
                />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
