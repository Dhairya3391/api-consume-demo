import { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff, getRoles, getDepartments } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { useToast } from '../context/ToastContext';
import { normalizeData } from '../utils/normalizeData';

export default function Staff() {
    const [staffList, setStaffList] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'error' });

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        staffName: '',
        mobileNo: '',
        emailAddress: '',
        password: '',
        roleID: '',
        departmentID: '',
        isActive: true,
        remarks: ''
    });
    const [crudLoading, setCrudLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [staffData, rolesData, deptsData] = await Promise.all([
                getStaff(),
                getRoles(),
                getDepartments()
            ]);

            setStaffList(normalizeData(staffData));
            setRoles(normalizeData(rolesData));
            setDepartments(normalizeData(deptsData));
        } catch (error) {
            console.error("Failed to fetch staff data", error);
            showAlert('Error', 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };



    const openAddModal = () => {
        setEditingStaff(null);
        setFormData({
            staffName: '',
            mobileNo: '',
            emailAddress: '',
            password: '',
            roleID: roles[0]?.roleID || '',
            departmentID: departments[0]?.departmentID || '',
            isActive: true,
            remarks: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (staff) => {
        setEditingStaff(staff);

        // Reverse lookup IDs if missing (API returns names but not IDs)
        let rId = staff.roleID;
        let dId = staff.departmentID;

        if (!rId && staff.roleName) {
            const r = roles.find(role => role.roleName === staff.roleName);
            if (r) rId = r.roleID;
        }
        if (!dId && staff.departmentName) {
            const d = departments.find(dept => dept.departmentName === staff.departmentName);
            if (d) dId = d.departmentID;
        }

        setFormData({
            ...staff,
            roleID: rId || '',
            departmentID: dId || '',
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    };

    const showAlert = (title, message, type = 'error') => {
        setAlertInfo({ title, message, type });
        setAlertOpen(true);
    };

    const confirmDelete = (id) => {
        setStaffToDelete(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!staffToDelete) return;
        try {
            await deleteStaff(staffToDelete);
            showToast('Staff member deleted successfully', 'success');
            await fetchData();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to delete staff';
            showAlert('Error', message, 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCrudLoading(true);
        try {
            const payload = {
                ...formData,
                roleID: parseInt(formData.roleID),
                departmentID: parseInt(formData.departmentID)
            };

            if (editingStaff) {
                await updateStaff(editingStaff.staffID, { ...editingStaff, ...payload });
                showToast('Staff member updated successfully', 'success');
            } else {
                await createStaff(payload);
                showToast('Staff member created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save staff. Email might be duplicate.');
        } finally {
            setCrudLoading(false);
        }
    };

    const getRoleName = (id) => {
        if (!roles.length) return 'Loading...';
        const role = roles.find(r => (r.roleID || r.roleId) == id);
        return role ? (role.roleName || role.rolename) : 'N/A';
    };

    const getDeptName = (id) => {
        if (!departments.length) return 'Loading...';
        const dept = departments.find(d => (d.departmentID || d.departmentId) == id);
        return dept ? (dept.departmentName || dept.departmentname) : 'N/A';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm">Manage employees and their access roles.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Add Staff
                </button>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading staff data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Department</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
                                {staffList.map((staff) => (
                                    <tr key={staff.staffID || staff.staffId} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 text-slate-700 dark:text-neutral-300">
                                        <td className="px-6 py-3 font-medium">
                                            <div className="flex flex-col">
                                                <span>{staff.staffName}</span>
                                                <span className="text-xs text-slate-400 font-normal">{staff.emailAddress}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">{staff.roleName || getRoleName(staff.roleID)}</td>
                                        <td className="px-6 py-3">{staff.departmentName || getDeptName(staff.departmentID)}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${staff.isActive
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                }`}>
                                                {staff.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(staff)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(staff.staffID)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {staffList.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No staff members found.
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
                title={editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                            value={formData.staffName}
                            onChange={e => setFormData({ ...formData, staffName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.emailAddress}
                                onChange={e => setFormData({ ...formData, emailAddress: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Mobile No</label>
                            <input
                                type="tel"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.mobileNo}
                                onChange={e => setFormData({ ...formData, mobileNo: e.target.value })}
                            />
                        </div>
                    </div>

                    {!editingStaff && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Role</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.roleID}
                                onChange={e => setFormData({ ...formData, roleID: e.target.value })}
                                required
                            >
                                <option value="">Select Role</option>
                                {roles.map(r => (
                                    <option key={r.roleID} value={r.roleID}>{r.roleName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Department</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.departmentID}
                                onChange={e => setFormData({ ...formData, departmentID: e.target.value })}
                                required
                            >
                                <option value="">Select Dept</option>
                                {departments.map(d => (
                                    <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="text-sm font-medium text-slate-700 dark:text-neutral-300">Active Account</label>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
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
                            {editingStaff ? 'Save Changes' : 'Create Member'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Staff Member"
                message="Are you sure you want to delete this staff member? This will remove their access."
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
