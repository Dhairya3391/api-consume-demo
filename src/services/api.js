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

export const login = async (email, password) => {
    // API Expects query params for POST /Auth/login
    // POST /api/Auth/login?email=...&password=...
    const response = await api.post(`/Auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    return response.data;
};

export const getDepartments = async () => {
    const response = await api.get('/Department/GetAll');
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

export default api;
