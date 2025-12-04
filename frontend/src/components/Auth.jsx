import React, { useState } from 'react';
import axios from 'axios';

function Auth({ onLoginSuccess, closeAuth }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // DEBUG: Check what we are sending
        console.log("Sending Login Request:", { phoneNumber, password });

        try {
            const res = await axios.post('https://fashion-backend-xp2z.onrender.com/api/auth/login', {
                phoneNumber: phoneNumber.trim(), // Remove accidental spaces
                password: password.trim()        // Remove accidental spaces
            });

            onLoginSuccess(res.data.token, res.data.user.role);
        } catch (err) {
            console.error("Login Failed:", err.response?.data || err.message);
            alert(err.response?.data?.error || "Connection Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate" style={{ width: '300px', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '15px' }}>
                <h2>Admin Login</h2>
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                    <input
                        className="input"
                        placeholder="Phone (e.g. 9876543210)"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        required
                    />
                    <input
                        className="input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? "Checking..." : "Login"}
                    </button>
                </form>
                <button onClick={closeAuth} style={{ marginTop: '15px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
            </div>
        </div>
    );
}

export default Auth;