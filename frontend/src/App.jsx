import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetDashboard from './pages/Dashboard/AssetDashboard'; // New
import SysAdminDashboard from './pages/Dashboard/SysAdminDashboard'; // New
import UserList from './pages/SysAdmin/UserList'; // New
import UserDetail from './pages/SysAdmin/UserDetail'; // New
import AssetList from './pages/Asset/AssetList/AssetList';
import AssetDetail from './pages/Asset/AssetDetail/AssetDetail'; // New
import CategoryDetail from './pages/Asset/CategoryDetail/CategoryDetail';
import CategoryList from './pages/Asset/CategoryList/CategoryList'; // New
import SupplierList from './pages/Asset/SupplierList/SupplierList'; // New
import LocationList from './pages/Asset/LocationList/LocationList'; // New
import LocationDetail from './pages/Asset/LocationList/LocationDetail'; // New
import ModuleSelection from './pages/Modules/ModuleSelection';
import Profile from './pages/Profile/Profile'; // New


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

            {/* Sysadmin routes */}
            <Route path="sysadmin">
              <Route path="dashboard" element={<SysAdminDashboard />} /> {/* New */}
              <Route path="users" element={<UserList />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="roles" element={<div className="card"><h2>Role Management</h2><p>Coming soon...</p></div>} />
              <Route path="logs" element={<div className="card"><h2>Activity Logs</h2><p>Coming soon...</p></div>} />
            </Route>

            {/* Asset routes */}
            <Route path="asset">
              <Route path="dashboard" element={<AssetDashboard />} /> {/* New */}
              <Route path="items" element={<AssetList />} />
              <Route path="items/:id" element={<AssetDetail />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="categories/:id" element={<CategoryDetail />} />
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="locations" element={<LocationList />} />
              <Route path="locations/:id" element={<LocationDetail />} />
              <Route path="maintenance" element={<div className="card"><h2>Maintenance</h2><p>Coming soon...</p></div>} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
