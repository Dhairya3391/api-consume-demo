# Consuming JWT Auth API in React

> **[Live Demo](https://apidemo.noobokay.me)**

This guide demonstrates how to consume a .NET Web API with JWT Authentication in a React application using Vite.

## 🎯 Goal
- **Login** using the API (`/api/Auth/login`).
- **Store** the JWT token (in `localStorage` for this demo, but we can use cookies as well).
- **Protect** routes so only logged-in users can access the dashboard.
- **Attach** the token automatically to every API request using Axios Interceptors.
- **Logout** functionality.

---

## 🛠 Prerequisites

- **Frontend**: React + Vite (created via `npm create vite client --template react`).
- **Backend**: Existing API at `https://mom-webapi.onrender.com`.
- **Packages**: `axios`, `react-router-dom`.

```bash
npm add axios react-router-dom
```

---

## 🏗 Step 1: Configure Axios with Interceptors

We create a central `api.js` file to handle all HTTP requests. This ensures we don't repeat code.

**What are Interceptors?**
Think of them like **middleware** or a **security guard** for your API calls:
- **Request Interceptor**: intercepts every outgoing request. We use it to **automatically attach the JWT token**. This means you don't have to manually add headers for every single API call.
- **Response Interceptor**: intercepts every incoming response. We use it to **catch 401 (Unauthorized) errors** globally. If the token expires or is invalid, it automatically logs the user out.

**File:** `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://mom-webapi.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Attach Token
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

// 2. Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

// API Methods
export const login = async (email, password) => {
    // Note: This specific API expects query parameters for login
    const response = await api.post(`/Auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/Department/GetAll');
  return response.data;
};

export default api;
```

---

## 🔐 Step 2: Manage Auth State (Context API)

We use React Context to make the user and login function available everywhere in the app.

**File:** `src/context/AuthContext.jsx`

```jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on page refresh
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
        setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      
      // Store token
      // Assuming API returns object with token or just the token string
      let token = data.token || data; 
      
      if (token) {
        localStorage.setItem('token', token);
        const userInfo = { email }; // Can also decode token to get user info
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

---

## 🛡 Step 3: Protect Routes

Create a wrapper component that checks if the user is logged in. If not, redirect them to Login.

**File:** `src/App.jsx` (Snippet)

```jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};
```

**Usage in Routing:**

```jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 💻 Step 4: Login Page UI

The login page captures credentials and calls `login()` from our context.

**File:** `src/pages/Login.jsx`

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const success = await login(email, password); // Context function
    if (success) navigate('/dashboard');
  } catch (err) {
    setError('Invalid credentials');
  }
};
```

---

## 📊 Step 5: Consuming Data (Dashboard)

Now that we have the token, calling any API is simple. The interceptor adds the token automatically.

**File:** `src/pages/Dashboard.jsx`

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getDepartments(); // Just call the function!
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching", error);
    }
  };
  fetchData();
}, []);
```

---


## ✅ Summary

1. **Axios** is the bridge. Interceptors handle the "plumbing" (headers, errors).
2. **Context** holds the "state" (Who is logged in?).
3. **Router** controls access (Public vs Protected).
4. **LocalStorage** persists the session (so refreshing doesn't kill the login).

---

## Bonus: Full CRUD Implementation

We expanded the demo to include **Create**, **Update**, and **Delete** operations for the **Department** table, converting the Dashboard into a full management interface.

### 1. Updated API Service (`src/services/api.js`)

We added methods to interact with the standard CRUD endpoints:

```javascript
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
```

### 2. Enhanced Dashboard (`src/pages/Dashboard.jsx`)

The dashboard now features:
- **Add Button**: Opens a modal to create a new department.
- **Edit Action**: Pre-fills the modal with existing data for updates.
- **Delete Action**: Confirms before removing a department.
- **Real-time Updates**: Refetches the list automatically after any change.

This demonstrates a complete cycle of data management consuming a RESTful API in React.
