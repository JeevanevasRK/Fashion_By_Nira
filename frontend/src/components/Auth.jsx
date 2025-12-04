import React, { useState } from 'react';
import axios from 'axios';

// API BASE URL
const API = "https://fashion-by-nira.onrender.com/api";

function Auth({ onLoginSuccess, closeAuth }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // FIX: Updated URL
            const res = await axios.post(`${API}/auth/login`, { phoneNumber, password });
            onLoginSuccess(res.data.token, res.data.user.role);
        } catch (err) { alert("Invalid Credentials or Connection Error"); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-up" style={{ width: '300px', textAlign: 'center' }}>
                <h2>Admin Login</h2>
                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                    <input className="input-field" placeholder="Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                    <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
                <button onClick={closeAuth} style={{ marginTop: '15px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
            </div>
        </div>
    );
}

export default Auth;