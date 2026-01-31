import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading, hasRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        // User is logged in but doesn't have the required role
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-4">
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-neutral-800 text-center max-w-md">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-4">gpp_bad</span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-neutral-400 mb-6">
                        You do not have permission to view this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="text-sm font-medium text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
