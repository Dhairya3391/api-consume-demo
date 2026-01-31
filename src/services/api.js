import axios from 'axios';

const API_BASE_URL = 'https://mom-webapi.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle logout if needed.
            localStorage.removeItem('token');
            // Optional: Redirect to login
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;

// ==========================================
// AUTH & USERS
// ==========================================

export const login = async (email, password) => {
    const response = await api.post(`/Auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    return response.data;
};

// ==========================================
// ROLE MANAGEMENT
// ==========================================

export const getRoles = async () => {
    const response = await api.get('/MOM_Role/GetAll');
    return response.data;
};

export const getRoleById = async (id) => {
    const response = await api.get(`/MOM_Role/GetById/${id}`);
    return response.data;
};

export const createRole = async (role) => {
    const response = await api.post('/MOM_Role/Create', role);
    return response.data;
};

export const updateRole = async (id, role) => {
    const response = await api.put(`/MOM_Role/Update/${id}`, role);
    return response.data;
};

export const deleteRole = async (id) => {
    const response = await api.delete(`/MOM_Role/Delete/${id}`);
    return response.data;
};

// ==========================================
// STAFF MANAGEMENT
// ==========================================

export const getStaff = async () => {
    const response = await api.get('/MOM_Staff/GetAll');
    return response.data;
};

export const getStaffById = async (id) => {
    const response = await api.get(`/MOM_Staff/GetById/${id}`);
    return response.data;
};

export const createStaff = async (staff) => {
    const response = await api.post('/MOM_Staff/Create', staff);
    return response.data;
};

export const updateStaff = async (id, staff) => {
    const response = await api.put(`/MOM_Staff/Update/${id}`, staff);
    return response.data;
};

export const deleteStaff = async (id) => {
    const response = await api.delete(`/MOM_Staff/Delete/${id}`);
    return response.data;
};

// ==========================================
// DEPARTMENT MANAGEMENT
// ==========================================

export const getDepartments = async () => {
    const response = await api.get('/Department/GetAll');
    return response.data;
};

export const getDepartmentById = async (id) => {
    const response = await api.get(`/Department/GetById/${id}`);
    return response.data;
};

export const createDepartment = async (department) => {
    const response = await api.post('/Department/Create', department);
    return response.data;
};

export const updateDepartment = async (id, department) => {
    const response = await api.put(`/Department/Update/${id}`, department);
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await api.delete(`/Department/Delete/${id}`);
    return response.data;
};

// ==========================================
// MASTER DATA: VENUES & TYPES
// ==========================================

// Venues
export const getVenues = async () => {
    const response = await api.get('/MOM_MeetingVenue/GetAll');
    return response.data;
};

export const getVenueById = async (id) => {
    const response = await api.get(`/MOM_MeetingVenue/GetById/${id}`);
    return response.data;
};

export const createVenue = async (venue) => {
    const response = await api.post('/MOM_MeetingVenue/Create', venue);
    return response.data;
};

export const updateVenue = async (id, venue) => {
    const response = await api.put(`/MOM_MeetingVenue/Update/${id}`, venue);
    return response.data;
};

export const deleteVenue = async (id) => {
    const response = await api.delete(`/MOM_MeetingVenue/Delete/${id}`);
    return response.data;
};

// Meeting Types
export const getMeetingTypes = async () => {
    const response = await api.get('/MOM_MeetingType/GetAll');
    return response.data;
};

export const getMeetingTypeById = async (id) => {
    const response = await api.get(`/MOM_MeetingType/GetById/${id}`);
    return response.data;
};

export const createMeetingType = async (type) => {
    const response = await api.post('/MOM_MeetingType/Create', type);
    return response.data;
};

export const updateMeetingType = async (id, type) => {
    const response = await api.put(`/MOM_MeetingType/Update/${id}`, type);
    return response.data;
};

export const deleteMeetingType = async (id) => {
    const response = await api.delete(`/MOM_MeetingType/Delete/${id}`);
    return response.data;
};

// ==========================================
// MEETING MANAGEMENT
// ==========================================

export const getMeetings = async () => {
    const response = await api.get('/MOM_Meeting/GetAll');
    return response.data;
};

export const getMeetingById = async (id) => {
    const response = await api.get(`/MOM_Meeting/GetById/${id}`);
    return response.data;
};

export const getMeetingDetails = async (id) => {
    const response = await api.get(`/MOM_Meeting/GetMeetingDetails/Details/${id}`);
    return response.data;
};

export const getFullMeetingDetails = async (id) => {
    const response = await api.get(`/MOM_Meeting/GetFullMeetingDetails/FullDetails/${id}`);
    return response.data;
};

export const createMeeting = async (meetingData) => {
    // Note: Meeting creation often involves file upload (multipart/form-data)
    // Check if the input is FormData or JSON
    const config = meetingData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await api.post('/MOM_Meeting/Create', meetingData, config);
    return response.data;
};

export const updateMeeting = async (id, meetingData) => {
    const response = await api.put(`/MOM_Meeting/Update/${id}`, meetingData);
    return response.data;
};

export const deleteMeeting = async (id) => {
    const response = await api.delete(`/MOM_Meeting/Delete/${id}`);
    return response.data;
};

// ==========================================
// MEETING MEMBERS
// ==========================================

export const getMeetingMembers = async () => {
    const response = await api.get('/MOM_MeetingMember/GetAll');
    return response.data;
};

export const getMeetingMembersByMeetingId = async (meetingId) => {
    // Using GetAll and filtering client-side as the specific GetByMeetingId endpoint is returning 404s
    const response = await api.get('/MOM_MeetingMember/GetAll');
    const allMembers = response.data.data || response.data || [];
    return allMembers.filter(m => m.meetingID === parseInt(meetingId));
};

export const createMeetingMember = async (member) => {
    const response = await api.post('/MOM_MeetingMember/Create', member);
    return response.data;
};

export const updateMeetingMember = async (id, member) => {
    const response = await api.put(`/MOM_MeetingMember/Update/${id}`, member);
    return response.data;
};

export const deleteMeetingMember = async (id) => {
    const response = await api.delete(`/MOM_MeetingMember/Delete/${id}`);
    return response.data;
};
