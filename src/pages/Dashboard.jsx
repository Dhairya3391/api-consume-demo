import { useEffect, useState } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptName, setDeptName] = useState('');
    const [crudLoading, setCrudLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getDepartments();
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
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const displayName = (() => {
        const saved = localStorage.getItem('user');
        try {
            const parsed = JSON.parse(saved);
            return user?.email || parsed?.email || parsed || 'User';
        } catch {
            return user?.email || saved || 'User';
        }
    })();

    const openAddModal = () => {
        setEditingDept(null);
        setDeptName('');
        setIsModalOpen(true);
    };

    const openEditModal = (dept) => {
        setEditingDept(dept);
        setDeptName(dept.departmentName);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await deleteDepartment(id);
            await fetchData();
        } catch (error) {
            alert('Failed to delete department');
            console.error(error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCrudLoading(true);
        try {
            if (editingDept) {
                await updateDepartment(editingDept.departmentID || editingDept.id, {
                    ...editingDept,
                    departmentName: deptName
                });
            } else {
                await createDepartment({ departmentName: deptName });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Failed to save department');
            console.error(error);
        } finally {
            setCrudLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6">
            <header className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Welcome, {displayName}
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
                        <div className="flex items-center gap-4">
                            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Departments</h2>
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{departments.length}</span>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">add</span> Add Department
                        </button>
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
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {departments.map((dept) => (
                                        <tr key={dept.departmentID || dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                                            <td className="px-6 py-3 font-mono text-slate-400 dark:text-slate-500">#{dept.departmentID || dept.id}</td>
                                            <td className="px-6 py-3 font-medium">{dept.departmentName || "Unnamed"}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(dept)}
                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.departmentID || dept.id)}
                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                            {editingDept ? 'Edit Department' : 'New Department'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-slate-950 dark:text-white outline-none"
                                    value={deptName}
                                    onChange={(e) => setDeptName(e.target.value)}
                                    placeholder="e.g. Engineering"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={crudLoading}
                                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {crudLoading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                    {editingDept ? 'Save Changes' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
