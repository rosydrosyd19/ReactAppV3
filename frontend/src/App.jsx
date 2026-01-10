import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetDashboard from './pages/Dashboard/AssetDashboard'; // New
import SysAdminDashboard from './pages/Dashboard/SysAdminDashboard'; // New
import UserList from './pages/SysAdmin/UserList'; // New
import UserDetail from './pages/SysAdmin/UserDetail'; // New
import RoleList from './pages/SysAdmin/RoleList'; // New
import SettingsPage from './pages/SysAdmin/Settings/SettingsPage'; // New
import AssetList from './pages/Asset/AssetList/AssetList';
import AssetDetail from './pages/Asset/AssetDetail/AssetDetail'; // New
import CategoryDetail from './pages/Asset/CategoryDetail/CategoryDetail';
import CategoryList from './pages/Asset/CategoryList/CategoryList'; // New
import SupplierList from './pages/Asset/SupplierList/SupplierList'; // New
import SupplierDetail from './pages/Asset/SupplierList/SupplierDetail'; // New
import LocationList from './pages/Asset/LocationList/LocationList'; // New
import LocationDetail from './pages/Asset/LocationList/LocationDetail'; // New
import CredentialList from './pages/Asset/CredentialList/CredentialList'; // New
import CredentialDetail from './pages/Asset/CredentialList/CredentialDetail'; // New
import CredentialCategoryList from './pages/Asset/CredentialList/CredentialCategoryList'; // New
import CredentialCategoryDetail from './pages/Asset/CredentialList/CredentialCategoryDetail'; // New
import MaintenanceList from './pages/Asset/Maintenance/MaintenanceList'; // New
import MaintenanceDetail from './pages/Asset/Maintenance/MaintenanceDetail'; // New
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
                      <div className="card"><h2>Activity Logs</h2><p>Coming soon...</p></div>
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
                    <PermissionRoute permission="asset.credentials.manage">
                      <CredentialCategoryList />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="credential-categories/:id"
                  element={
                    <PermissionRoute permission="asset.credentials.manage">
                      <CredentialCategoryDetail />
                    </PermissionRoute>
                  }
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
