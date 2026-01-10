import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PermissionRoute = ({ children, permission }) => {
    const { hasPermission, loading } = useAuth();

    if (loading) {
        // You can return a loading spinner here if you have one
        return <div className="loading-spinner"></div>;
    }

    if (!hasPermission(permission)) {
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

export default PermissionRoute;
