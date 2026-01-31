import { useEffect, useState } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting, getVenues, getMeetingTypes, getDepartments, getStaff, getMeetingMembers } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import MeetingMembersModal from '../components/MeetingMembersModal';
import { useToast } from '../context/ToastContext';
import { normalizeData } from '../utils/normalizeData';
import { useAuth } from '../context/AuthContext';

export default function Meetings() {
    const [meetings, setMeetings] = useState([]);
    const [venues, setVenues] = useState([]);
    const [types, setTypes] = useState([]);
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [formData, setFormData] = useState({
        meetingTitle: '',
        meetingNumber: '',
        meetingDescription: '',
        meetingDate: '',
        meetingVenueID: '',
        meetingTypeID: '',
        departmentID: '',
        documentFile: null
    });
    const [crudLoading, setCrudLoading] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // future use
    const [deptFilter, setDeptFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [showMyMeetingsOnly, setShowMyMeetingsOnly] = useState(false);
    const [currentStaffId, setCurrentStaffId] = useState(null);
    const [myMeetingIds, setMyMeetingIds] = useState(new Set());

    // Data for lookup
    const [allStaff, setAllStaff] = useState([]);
    const [allMembers, setAllMembers] = useState([]);

    // Members Modal State
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedMeetingForMembers, setSelectedMeetingForMembers] = useState(null);

    const { showToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '', type: 'error' });

    // Role Check
    const { user, hasRole } = useAuth();
    const isAdmin = hasRole(['Admin']);

    useEffect(() => {
        fetchData();
    }, []);

    // Resolve Staff ID and My Meetings when data and user are available
    useEffect(() => {
        if (user?.id && allMembers.length > 0) {
            // Use ID directly from token/auth context
            const myStaffId = parseInt(user.id);
            setCurrentStaffId(myStaffId);

            // Find meetings for this staff
            const myMeetings = allMembers
                .filter(m => m.staffID === myStaffId)
                .map(m => m.meetingID);
            setMyMeetingIds(new Set(myMeetings));

            // Optional: Auto-enable filter for non-admins
            if (!isAdmin) {
                setShowMyMeetingsOnly(true);
            }
        }
    }, [user, allMembers, isAdmin]);

    const fetchData = async () => {
        try {
            // Essential data - Accessible by all roles (hopefully)
            const [meetingsData, membersData] = await Promise.all([
                getMeetings(),
                getMeetingMembers()
            ]);

            setMeetings(normalizeData(meetingsData));
            setAllMembers(normalizeData(membersData));

            // Lookup data - Only fetch if Admin (others get 403 Forbidden)
            if (isAdmin) {
                const [venuesData, typesData, deptsData, staffData] = await Promise.all([
                    getVenues(),
                    getMeetingTypes(),
                    getDepartments(),
                    getStaff()
                ]);

                setVenues(normalizeData(venuesData));
                setTypes(normalizeData(typesData));
                setDepts(normalizeData(deptsData));
                setAllStaff(normalizeData(staffData));
            } else {
                // Reset/Clear for non-admins to avoid stale data issues if switching accounts
                setVenues([]);
                setTypes([]);
                setDepts([]);
                setAllStaff([]);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast("Failed to load meetings data", "error");
        } finally {
            setLoading(false);
        }
    };



    const handleConfirmDelete = async () => {
        if (!meetingToDelete) return;
        try {
            await deleteMeeting(meetingToDelete);
            showToast('Meeting deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to delete meeting';
            showAlert('Error', message, 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCrudLoading(true);
        try {
            const payload = new FormData();

            // For update, we might send JSON depending on API, but let's assume FormData or JSON based on existing valid code pattern. 
            // The previous code had a split logic: JSON for update, FormData for create. I will preserve that.

            if (editingMeeting) {
                const jsonPayload = {
                    meetingID: editingMeeting.meetingID,
                    meetingTitle: formData.meetingTitle,
                    meetingNumber: formData.meetingNumber,
                    meetingDescription: formData.meetingDescription,
                    meetingDate: formData.meetingDate,
                    meetingVenueID: parseInt(formData.meetingVenueID),
                    meetingTypeID: parseInt(formData.meetingTypeID),
                    departmentID: parseInt(formData.departmentID),
                };

                await updateMeeting(editingMeeting.meetingID, jsonPayload);
                showToast('Meeting updated successfully', 'success');
            } else {
                payload.append('MeetingTitle', formData.meetingTitle);
                payload.append('MeetingNumber', formData.meetingNumber);
                payload.append('MeetingDescription', formData.meetingDescription);
                payload.append('MeetingDate', formData.meetingDate);
                payload.append('MeetingVenueID', formData.meetingVenueID);
                payload.append('MeetingTypeID', formData.meetingTypeID);
                payload.append('DepartmentID', formData.departmentID);

                if (formData.documentFile) {
                    payload.append('DocumentFile', formData.documentFile);
                }
                await createMeeting(payload);
                showToast('Meeting scheduled successfully', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to save meeting');
        } finally {
            setCrudLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingMeeting(null);
        setFormData({
            meetingTitle: '',
            meetingNumber: '',
            meetingDescription: '',
            meetingDate: '',
            meetingVenueID: venues[0]?.meetingVenueID || '',
            meetingTypeID: types[0]?.meetingTypeID || '',
            departmentID: depts[0]?.departmentID || '',
            documentFile: null
        });
        setIsModalOpen(true);
    };

    const openMembersModal = (meeting) => {
        // Enhance meeting object with venue name specifically for the modal
        const enhancedMeeting = {
            ...meeting,
            venueName: getVenueName(meeting.meetingVenueID)
        };
        setSelectedMeetingForMembers(enhancedMeeting);
        setIsMembersModalOpen(true);
    };

    const openEditModal = (meeting) => {
        setEditingMeeting(meeting);
        setFormData({
            meetingTitle: meeting.meetingTitle,
            meetingNumber: meeting.meetingNumber,
            meetingDescription: meeting.meetingDescription,
            meetingDate: meeting.meetingDate, // Format might need adjustment for input type="datetime-local" but keeping simple for now
            meetingVenueID: meeting.meetingVenueID,
            meetingTypeID: meeting.meetingTypeID,
            departmentID: meeting.departmentID,
            documentFile: null
        });
        setIsModalOpen(true);
    };

    const showAlert = (title, message, type = 'error') => {
        setAlertInfo({ title, message, type });
        setAlertOpen(true);
    };

    const confirmDelete = (id) => {
        setMeetingToDelete(id);
        setConfirmOpen(true);
    };

    const getVenueName = (id) => venues.find(v => v.meetingVenueID === id)?.meetingVenueName || 'N/A';
    const getTypeName = (id) => types.find(t => t.meetingTypeID === id)?.meetingTypeName || 'N/A';
    const getDepartmentName = (id) => depts.find(d => d.departmentID === id)?.departmentName || 'N/A';

    // Filtering Logic
    const filteredMeetings = meetings.filter(meeting => {
        const matchesSearch = meeting.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.meetingNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'all' || meeting.departmentID === parseInt(deptFilter);
        const matchesDate = !dateFilter || meeting.meetingDate.startsWith(dateFilter);
        const matchesMyMeetings = !showMyMeetingsOnly || myMeetingIds.has(meeting.meetingID);

        return matchesSearch && matchesDept && matchesDate && matchesMyMeetings;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meetings</h1>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm">Schedule and manage meetings.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={openAddModal}
                        className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> New Meeting
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 bg-white dark:bg-black p-4 rounded-lg border border-slate-200 dark:border-neutral-800 shadow-sm">
                <div className="flex-1 min-w-[200px] relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-neutral-900 dark:text-white outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-48">
                    <select
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-neutral-900 dark:text-white outline-none"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {depts.map(d => (
                            <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
                        ))}
                    </select>
                </div>
                <div className="w-40">
                    <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-neutral-900 dark:text-white outline-none"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
                {/* My Meetings Toggle - Only show if staff ID was found */}
                {currentStaffId && (
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showMyMeetingsOnly}
                                    onChange={(e) => setShowMyMeetingsOnly(e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-slate-900 dark:peer-checked:bg-white/90"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-gray-300">My Meetings</span>
                        </label>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading meetings...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date & No.</th>
                                    <th className="px-6 py-3 font-medium">Title</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 font-medium">Document</th>
                                    <th className="px-6 py-3 font-medium">Venue</th>
                                    <th className="px-6 py-3 font-medium">Department</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-neutral-700">
                                {filteredMeetings.map((meeting) => (
                                    <tr key={meeting.meetingID} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 text-slate-700 dark:text-neutral-300">
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(meeting.meetingDate).toLocaleDateString()}</span>
                                                <span className="text-xs text-slate-400 font-mono">{meeting.meetingNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-medium">
                                            <div>{meeting.meetingTitle}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-xs">{meeting.meetingDescription}</div>
                                        </td>
                                        <td className="px-6 py-3">{getTypeName(meeting.meetingTypeID)}</td>
                                        <td className="px-6 py-3">
                                            {meeting.documentPath ? (
                                                <a
                                                    href={`https://mom-webapi.onrender.com${meeting.documentPath}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                    Download
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">{getVenueName(meeting.meetingVenueID)}</td>
                                        <td className="px-6 py-3">{getDepartmentName(meeting.departmentID)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openMembersModal(meeting)}
                                                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                                    title={isAdmin ? "Manage Participants" : "View Participants"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {isAdmin ? 'group' : 'visibility'}
                                                    </span>
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(meeting)}
                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(meeting.meetingID)}
                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {meetings.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            No meetings scheduled.
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
                title={editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Title</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                            value={formData.meetingTitle}
                            onChange={e => setFormData({ ...formData, meetingTitle: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Meeting No.</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.meetingNumber}
                                onChange={e => setFormData({ ...formData, meetingNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Date & Time</label>
                            <input
                                type="datetime-local"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.meetingDate}
                                onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none h-20 resize-none"
                            value={formData.meetingDescription}
                            onChange={e => setFormData({ ...formData, meetingDescription: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Venue</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.meetingVenueID}
                                onChange={e => setFormData({ ...formData, meetingVenueID: e.target.value })}
                                required
                            >
                                <option value="">Select Venue</option>
                                {venues.map(v => (
                                    <option key={v.meetingVenueID} value={v.meetingVenueID}>{v.meetingVenueName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-slate-500 dark:bg-black dark:text-white outline-none"
                                value={formData.meetingTypeID}
                                onChange={e => setFormData({ ...formData, meetingTypeID: e.target.value })}
                                required
                            >
                                <option value="">Select Type</option>
                                {types.map(t => (
                                    <option key={t.meetingTypeID} value={t.meetingTypeID}>{t.meetingTypeName}</option>
                                ))}
                            </select>
                        </div>
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
                            {depts.map(d => (
                                <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
                            ))}
                        </select>
                    </div>

                    {!editingMeeting && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Attachment</label>
                            <input
                                type="file"
                                className="w-full text-sm text-slate-500 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-neutral-900 file:text-slate-700 dark:file:text-neutral-300 hover:file:bg-slate-200 dark:hover:file:bg-neutral-800"
                                onChange={e => setFormData({ ...formData, documentFile: e.target.files[0] })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
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
                            {editingMeeting ? 'Save Changes' : 'Schedule Meeting'}
                        </button>
                    </div>
                </form>
            </Modal>


            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Meeting"
                message="Are you sure you want to delete this meeting? This action cannot be undone."
            />

            <AlertModal
                isOpen={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertInfo.title}
                message={alertInfo.message}
                type={alertInfo.type}
            />

            <MeetingMembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                meeting={selectedMeetingForMembers}
            />
        </div>
    );
}
