import { useEffect, useState } from 'react';
import { getDepartments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDepartments();
                console.log("Fetched departments data:", data);

                if (Array.isArray(data)) {
                    setDepartments(data);
                } else if (data && Array.isArray(data.$values)) {
                    setDepartments(data.$values);
                } else if (data && Array.isArray(data.data)) {
                    setDepartments(data.data);
                } else {
                    setDepartments([]);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
                setDepartments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <div className="min-h-screen p-6">
            <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Welcome, {(() => {
                            const saved = localStorage.getItem('user');
                            try {
                                const parsed = JSON.parse(saved);
                                return user?.email || parsed?.email || parsed || 'User';
                            } catch {
                                return user?.email || saved || 'User';
                            }
                        })()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-200">Departments</h2>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400">Count: {departments.length}</span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">ID</th>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {departments.map((dept) => (
                                        <tr key={dept.departmentID || dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                                            <td className="px-6 py-3 font-mono text-slate-400 dark:text-slate-500">#{dept.departmentID || dept.id}</td>
                                            <td className="px-6 py-3 font-medium">{dept.departmentName || "Unnamed"}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {departments.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                                                No departments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
