import { useEffect, useState } from 'react';
import { getDepartments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDepartments();

                if (Array.isArray(data)) {
                    setDepartments(data);
                } else if (data && Array.isArray(data.$values)) {
                    setDepartments(data.$values);
                } else if (data && Array.isArray(data.data)) {
                    setDepartments(data.data);
                } else {
                    setDepartments([]);
                }
            } catch (error) {
                setDepartments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #c084fc, #e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        College Dashboard
                    </h1>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Welcome, {user?.email}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary">
                    Logout
                </button>
            </header>

            <section>
                <h2 style={{ marginBottom: '1.5rem' }}>Departments</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading resources...</div>
                ) : (
                    <div className="dashboard-grid">
                        {departments.map((dept) => (
                            <div key={dept.departmentID || dept.id} className="glass-panel card">
                                <div style={{ width: '40px', height: '40px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#c084fc' }}>
                                    🏢
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{dept.departmentName || "Unnamed Dept"}</h3>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                                    ID: {dept.departmentID || dept.id}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
