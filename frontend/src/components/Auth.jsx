import React, { useState } from 'react';
import axios from 'axios';

function Auth({ onLoginSuccess, closeAuth }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { phoneNumber, password });

            // Security Check: If they are not admin, reject them
            if (res.data.user.role !== 'admin') {
                setError("Access Denied: You are not an Admin.");
                return;
            }

            onLoginSuccess(res.data.token, res.data.user.role);
        } catch (err) {
            setError("Invalid Admin Credentials");
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '15px', width: '350px',
                textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: 'Montserrat, sans-serif'
            }}>
                <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Admin Login</h2>
                <p style={{ fontSize: '12px', color: '#777', marginBottom: '20px' }}>Restricted Access: Authorized Personnel Only</p>

                {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <input
                        type="text" placeholder="Admin Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                    <input
                        type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                    <button type="submit" style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ENTER DASHBOARD
                    </button>
                </form>

                <button onClick={closeAuth} style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default Auth;