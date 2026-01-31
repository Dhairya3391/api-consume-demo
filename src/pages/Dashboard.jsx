import { useEffect, useState } from 'react';
import { getMeetings, getStaff, getDepartments, getRoles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { normalizeData } from '../utils/normalizeData';

export default function Dashboard() {
    const { user, hasRole } = useAuth();
    const isAdmin = hasRole(['Admin']);

    const [stats, setStats] = useState({
        meetings: 0,
        staff: 0,
        departments: 0,
        roles: 0,
        upcomingMeetings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let meetingsData = [];
                let staffData = [];
                let deptData = [];
                let rolesData = [];

                if (isAdmin) {
                    [meetingsData, staffData, deptData, rolesData] = await Promise.all([
                        getMeetings(),
                        getStaff(),
                        getDepartments(),
                        getRoles()
                    ]);
                } else {
                    meetingsData = await getMeetings();
                }

                const meetings = normalizeData(meetingsData);

                // Filter upcoming meetings (future dates)
                const now = new Date();
                const upcoming = meetings
                    .filter(m => new Date(m.meetingDate) > now)
                    .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
                    .slice(0, 5);

                setStats({
                    meetings: meetings.length,
                    staff: normalizeData(staffData).length, // Will be 0 if not admin
                    departments: normalizeData(deptData).length, // Will be 0 if not admin
                    roles: normalizeData(rolesData).length, // Will be 0 if not admin
                    upcomingMeetings: upcoming
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Meetings', value: stats.meetings, icon: 'groups', color: 'bg-blue-500', link: '/meetings' },
        { title: 'Staff Members', value: stats.staff, icon: 'badge', color: 'bg-emerald-500', link: '/staff' },
        { title: 'Departments', value: stats.departments, icon: 'apartment', color: 'bg-indigo-500', link: '/departments' },
        { title: 'Roles', value: stats.roles, icon: 'security', color: 'bg-rose-500', link: '/roles' },
    ];

    const displayName = (() => {
        const saved = localStorage.getItem('user');
        try {
            const parsed = JSON.parse(saved);
            return user?.email || parsed?.email || parsed || 'User';
        } catch {
            return user?.email || saved || 'User';
        }
    })();

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-neutral-400 mt-1">
                    Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{displayName}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Always show Meetings */}
                <Link
                    to="/meetings"
                    className="bg-white dark:bg-black p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-blue-500 bg-opacity-10 dark:bg-opacity-20`}>
                            <span className={`material-symbols-outlined text-2xl text-blue-500`}>
                                groups
                            </span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 dark:text-neutral-700 dark:group-hover:text-neutral-500 transition-colors">
                            arrow_forward
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.meetings}</h3>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">Total Meetings</p>
                </Link>

                {isAdmin && statCards.slice(1).map((card, idx) => (
                    <Link
                        to={card.link}
                        key={idx}
                        className="bg-white dark:bg-black p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${card.color} bg-opacity-10 dark:bg-opacity-20`}>
                                <span className={`material-symbols-outlined text-2xl ${card.color.replace('bg-', 'text-')}`}>
                                    {card.icon}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 dark:text-neutral-700 dark:group-hover:text-neutral-500 transition-colors">
                                arrow_forward
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{card.value}</h3>
                        <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">{card.title}</p>
                    </Link>
                ))}
            </div>

            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Meetings</h2>
                    <Link to="/meetings" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        View All
                    </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {stats.upcomingMeetings.length > 0 ? (
                        stats.upcomingMeetings.map((meeting) => (
                            <div key={meeting.meetingID} className="p-4 hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 dark:bg-neutral-800 rounded-lg text-slate-900 dark:text-white font-medium text-xs">
                                        <span>{new Date(meeting.meetingDate).getDate()}</span>
                                        <span className="text-[10px] uppercase text-slate-500 dark:text-neutral-400">
                                            {new Date(meeting.meetingDate).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-white">{meeting.meetingTitle}</h3>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                            {new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {meeting.meetingNumber}
                                        </p>
                                    </div>
                                </div>
                                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded border border-blue-100 dark:border-blue-900/30">
                                    Upcoming
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500 dark:text-neutral-400">
                            No upcoming meetings scheduled.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
