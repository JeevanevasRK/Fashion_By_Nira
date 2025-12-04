import React, { useState } from 'react';
import axios from 'axios';

// API URL (Use your live link or localhost)
const API_URL = "https://fashion-backend-xp2z.onrender.com/api/auth";

function Auth({ onLoginSuccess, closeAuth }) {
    const [view, setView] = useState('login'); // 'login' or 'forgot'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');

    // Forgot Password States
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Error States
    const [error, setError] = useState('');
    const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

    // --- LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post(`${API_URL}/login`, { phoneNumber, password });
            onLoginSuccess(res.data.token, res.data.user.role);
        } catch (err) {
            setError(err.response?.data?.error || "Invalid Credentials");
        }
    };

    // --- FORGOT PASSWORD LOGIC ---
    const sendOtp = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`${API_URL}/forgot-otp`, { phoneNumber });
            setOtpSent(true);
            alert("OTP Sent! (Check Server Logs)");
        } catch (err) {
            if (err.response?.data?.error === "NOT_AUTHORIZED") {
                setShowUnauthorizedModal(true); // Trigger the clean popup
            } else {
                setError(err.response?.data?.error || "User not found");
            }
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/reset-password`, { phoneNumber, otp, newPassword });
            alert("Password Reset Successful! Please Login.");
            setView('login');
            setOtpSent(false);
        } catch (err) { setError(err.response?.data?.error || "Reset Failed"); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>

            {/* UNAUTHORIZED POPUP */}
            {showUnauthorizedModal && (
                <div style={{ position: 'absolute', zIndex: 3000, background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '300px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚫</div>
                    <h3 style={{ color: '#d32f2f', marginBottom: '10px' }}>Not Authorized</h3>
                    <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>This number is not registered as an Admin. You cannot reset this password.</p>
                    <button onClick={() => setShowUnauthorizedModal(false)} className="btn btn-black" style={{ width: '100%' }}>Close</button>
                </div>
            )}

            <div className="card animate-up" style={{ width: '350px', padding: '40px', textAlign: 'center' }}>

                {view === 'login' ? (
                    <>
                        <h2 style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Admin Login</h2>
                        {error && <p style={{ color: 'red', fontSize: '13px', marginBottom: '15px' }}>{error}</p>}

                        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '15px' }}>
                            <input className="input" placeholder="Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                            <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                            <button className="btn btn-black">Secure Login</button>
                        </form>

                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span onClick={() => { setView('forgot'); setError(''); }} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#555' }}>Forgot Password?</span>
                            <span onClick={closeAuth} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#555' }}>Cancel</span>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={{ marginBottom: '20px' }}>Reset Password</h2>
                        {error && <p style={{ color: 'red', fontSize: '13px', marginBottom: '15px' }}>{error}</p>}

                        {!otpSent ? (
                            <form onSubmit={sendOtp} style={{ display: 'grid', gap: '15px' }}>
                                <input className="input" placeholder="Enter Admin Phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                                <button className="btn btn-black">Send OTP</button>
                            </form>
                        ) : (
                            <form onSubmit={resetPassword} style={{ display: 'grid', gap: '15px' }}>
                                <input className="input" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                                <input className="input" type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                <button className="btn btn-black">Reset & Login</button>
                            </form>
                        )}
                        <button onClick={() => { setView('login'); setOtpSent(false); setError(''); }} style={{ marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Back to Login</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default Auth;