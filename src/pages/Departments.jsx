import { useState, useEffect } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { useToast } from '../context/ToastContext';
import { normalizeData } from '../utils/normalizeData';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState(null);
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'error' });

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
            setDepartments(normalizeData(data));
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };



    const handleConfirmDelete = async () => {
        if (!deptToDelete) return;
        try {
            await deleteDepartment(deptToDelete);
            showToast('Department deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to delete department';
            showAlert('Error', message, 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCrudLoading(true);
        try {
            if (editingDept) {
                await updateDepartment(editingDept.departmentID, { ...editingDept, departmentName: deptName });
                showToast('Department updated successfully', 'success');
            } else {
                await createDepartment({ departmentName: deptName });
                showToast('Department created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save department');
        } finally {
            setCrudLoading(false);
        }
    };

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

    const showAlert = (title, message, type = 'error') => {
        setAlertInfo({ title, message, type });
        setAlertOpen(true);
    };

    const confirmDelete = (id) => {
        setDeptToDelete(id);
        setConfirmOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm">Manage organizational departments.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Add Department
                </button>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading departments...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Department Name</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
                                {departments.map((dept) => (
                                    <tr key={dept.departmentID} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 text-slate-700 dark:text-neutral-300">
                                        <td className="px-6 py-3 font-medium">{dept.departmentName}</td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(dept)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(dept.departmentID)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
                                        <td colSpan="2" className="px-6 py-8 text-center text-slate-500">
                                            No departments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDept ? 'Edit Department' : 'Create Department'}
            >
                <form onSubmit={handleSave}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">
                            Department Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                            value={deptName}
                            onChange={(e) => setDeptName(e.target.value)}
                            required
                            placeholder="e.g. IT Support"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={crudLoading}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {crudLoading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                            {editingDept ? 'Save Changes' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
            />

            <AlertModal
                isOpen={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertInfo.title}
                message={alertInfo.message}
                type={alertInfo.type}
            />
        </div>
    );
}
