import { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token on mount
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
            console.log("Login response:", data);

            // Assuming data contains { token, ... } or is the token
            // Adjust based on actual API response. 
            // If the API returns just the token string:
            // const token = data; 
            // But typically it is an object.
            // Based on common patterns:

            let token = data.token || data; // Fallback

            if (token) {
                localStorage.setItem('token', token);
                // If we get user info, store it. If not, mock it or decode token.
                // For this demo, let's store the email as user info if not provided.
                const userInfo = data.user || { email };
                localStorage.setItem('user', JSON.stringify(userInfo));
                setUser(userInfo);
                return true;
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

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
