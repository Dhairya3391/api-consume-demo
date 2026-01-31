import { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin } from '../services/api';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getRoleFromToken = (decodedToken) => {
        return decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    };

    const getIdFromToken = (decodedToken) => {
        return decodedToken.nameid || decodedToken.sub || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    };

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                } else {
                    const role = getRoleFromToken(decoded);
                    const id = getIdFromToken(decoded);
                    if (storedUser) {
                        setUser({ ...JSON.parse(storedUser), role, id });
                    } else {
                        setUser({ email: decoded.sub || decoded.email, role, id });
                    }
                }
            } catch (error) {
                console.error("Invalid token on mount", error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const data = await apiLogin(email, password);

            let token = data.token || data; // Fallback if data is just the token string

            if (token && typeof token === 'string') {
                localStorage.setItem('token', token);

                try {
                    const decoded = jwtDecode(token);
                    const role = getRoleFromToken(decoded);
                    const id = getIdFromToken(decoded);

                    const userInfo = {
                        email,
                        role,
                        id,
                        // Add other claims if needed
                    };

                    localStorage.setItem('user', JSON.stringify(userInfo));
                    setUser(userInfo);
                    return true;
                } catch (e) {
                    console.error("Failed to decode token", e);
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const hasRole = (requiredRoles) => {
        if (!user || !user.role) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
    };

    const value = {
        user,
        login,
        logout,
        loading,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
