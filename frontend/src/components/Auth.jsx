import React, { useState } from 'react';
import axios from 'axios';

const API = "https://fashion-by-nira.onrender.com/api";

function Auth({ onLoginSuccess, closeAuth }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API}/auth/login`, { phoneNumber, password });
            onLoginSuccess(res.data.token, res.data.user.role);
        } catch (err) { alert("Invalid Credentials"); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate" style={{ background: 'white', padding: '40px', width: '360px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Access</h2>
                    <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>Secure Gateway</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px' }}>
                    <input className="input" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required style={{ background: '#f9f9f9', borderColor: '#eee' }} />
                    <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ background: '#f9f9f9', borderColor: '#eee' }} />
                    <button className="btn btn-primary" style={{ width: '100%', padding: '15px', marginTop: '10px' }} disabled={loading}>
                        {loading ? "Authenticating..." : "Login to Dashboard"}
                    </button>
                </form>

                <button onClick={closeAuth} style={{ marginTop: '25px', width: '100%', background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Cancel and Return
                </button>
            </div>
        </div>
    );
}

export default Auth;