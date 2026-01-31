import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, hasRole, logout } = useAuth();

    const isAdmin = hasRole(['Admin', 'SuperAdmin']);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: [] }, // All
        { name: 'Meetings', path: '/meetings', icon: 'groups', roles: [] }, // All

        // Admin Only
        { name: 'Staff Management', path: '/staff', icon: 'badge', roles: ['Admin', 'SuperAdmin'] },
        { name: 'Roles', path: '/roles', icon: 'security', roles: ['Admin', 'SuperAdmin'] },
        { name: 'Departments', path: '/departments', icon: 'apartment', roles: ['Admin', 'SuperAdmin'] },
        { name: 'Venues', path: '/venues', icon: 'location_on', roles: ['Admin', 'SuperAdmin'] },
        { name: 'Meeting Types', path: '/meeting-types', icon: 'category', roles: ['Admin', 'SuperAdmin'] },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-black border-r border-slate-200 dark:border-neutral-800 flex flex-col h-screen fixed left-0 top-0 z-20 transition-all duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-white dark:text-black text-lg">description</span>
                </div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">MOM Portal</h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    if (item.roles.length > 0 && !hasRole(item.roles)) return null;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                                    : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            {item.name}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 font-bold text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">
                            {user?.role || 'User'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-800 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
