
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            width: '100%',
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--bg-color)'
        }}>
            <FiAlertTriangle style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Access Denied</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px' }}>
                You do not have permission to access this page. If you believe this is an error, please contact your system administrator.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem'
                }}
            >
                <FiHome /> Back to Dashboard
            </button>
        </div>
    );
};

export default AccessDenied;
