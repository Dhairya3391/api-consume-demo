import { useState, useEffect } from 'react';
import { getMeetingMembersByMeetingId, createMeetingMember, deleteMeetingMember, updateMeetingMember, getStaff } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { normalizeData } from '../utils/normalizeData';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

export default function MeetingMembersManager({ meeting }) {
    const [members, setMembers] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auth
    const { hasRole } = useAuth();
    const isAdmin = hasRole(['Admin']);

    // Form State
    const [selectedStaff, setSelectedStaff] = useState('');
    const [remarks, setRemarks] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    // Delete State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        if (meeting) {
            fetchData();
        }
    }, [meeting]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch meeting members and staff separately to handle errors independently
            const membersPromise = getMeetingMembersByMeetingId(meeting.meetingID)
                .then(data => normalizeData(data))
                .catch(error => {
                    console.error("Failed to load meeting members", error);
                    return []; // Return empty array if endpoint doesn't exist
                });
            
            const staffPromise = getStaff()
                .then(data => normalizeData(data))
                .catch(error => {
                    console.error("Failed to load staff", error);
                    showToast('Failed to load staff list', 'error');
                    return [];
                });
            
            const [membersData, staffData] = await Promise.all([membersPromise, staffPromise]);
            
            setMembers(membersData);
            setStaffList(staffData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedStaff) return;

        // Check if already added
        if (members.some(m => m.staffID === parseInt(selectedStaff))) {
            showToast('Staff member is already added to this meeting', 'error');
            return;
        }

        try {
            setAddLoading(true);
            const payload = {
                meetingID: meeting.meetingID,
                staffID: parseInt(selectedStaff),
                isPresent: false,
                remarks: remarks
            };

            await createMeetingMember(payload);
            showToast('Member added successfully', 'success');

            // Reset form
            setSelectedStaff('');
            setRemarks('');

            // Refresh list
            const updatedMembers = await getMeetingMembersByMeetingId(meeting.meetingID);
            setMembers(normalizeData(updatedMembers));

        } catch (error) {
            console.error(error);
            showToast('Failed to add member', 'error');
        } finally {
            setAddLoading(false);
        }
    };

    const confirmDelete = (id) => {
        setMemberToDelete(id);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!memberToDelete) return;
        try {
            await deleteMeetingMember(memberToDelete);
            showToast('Member removed successfully', 'success');

            // Refresh list
            const updatedMembers = await getMeetingMembersByMeetingId(meeting.meetingID);
            setMembers(normalizeData(updatedMembers));
        } catch (error) {
            console.error(error);
            showToast('Failed to remove member', 'error');
        }
    };

    const toggleAttendance = async (member) => {
        if (!isAdmin) return;

        try {
            await updateMeetingMember(member.meetingMemberID, {
                ...member,
                isPresent: !member.isPresent
            });

            // Optimistic update
            setMembers(members.map(m =>
                m.meetingMemberID === member.meetingMemberID
                    ? { ...m, isPresent: !m.isPresent }
                    : m
            ));

        } catch (error) {
            console.error(error);
            showToast('Failed to update attendance', 'error');
            fetchData(); // Revert on error
        }
    };

    const getStaffName = (id) => {
        const staff = staffList.find(s => s.staffID === id);
        return staff ? staff.staffName : 'Unknown Staff';
    };

    const getStaffDept = (id) => {
        const staff = staffList.find(s => s.staffID === id);
        return staff ? staff.departmentName : '-';
    };

    if (loading) return <div className="p-4 text-center text-slate-500">Loading members...</div>;

    return (
        <div className="space-y-6">
            {/* Add Member Form - Admin Only */}
            {isAdmin && (
                <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-lg border border-slate-200 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Add Participant</h3>
                    <form onSubmit={handleAddMember} className="flex gap-3 items-start">
                        <div className="flex-1">
                            <select
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                required
                            >
                                <option value="">Select Staff Member</option>
                                {staffList
                                    .filter(s => !members.some(m => m.staffID === s.staffID))
                                    .map(s => (
                                        <option key={s.staffID} value={s.staffID}>
                                            {s.staffName} ({s.departmentName})
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Remarks (Optional)"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addLoading || !selectedStaff}
                            className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {addLoading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">person_add</span>}
                            Add
                        </button>
                    </form>
                </div>
            )}

            {/* Members List */}
            <div className="overflow-hidden border border-slate-200 dark:border-neutral-800 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
                        <tr>
                            <th className="px-4 py-3 font-medium">Staff Name</th>
                            <th className="px-4 py-3 font-medium">Department</th>
                            <th className="px-4 py-3 font-medium text-center">Attendance</th>
                            <th className="px-4 py-3 font-medium">Remarks</th>
                            {isAdmin && <th className="px-4 py-3 font-medium text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                        {members.length > 0 ? (
                            members.map((member) => (
                                <tr key={member.meetingMemberID} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                        {getStaffName(member.staffID)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                                        {getStaffDept(member.staffID)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleAttendance(member)}
                                            disabled={!isAdmin}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${member.isPresent
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {member.isPresent ? 'check_circle' : 'cancel'}
                                            </span>
                                            {member.isPresent ? 'Present' : 'Absent'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                                        {member.remarks || '-'}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => confirmDelete(member.meetingMemberID)}
                                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                                                title="Remove Member"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-neutral-500">
                                    No members assigned to this meeting yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Remove Participant"
                message="Are you sure you want to remove this staff member from the meeting?"
            />
        </div>
    );
}
