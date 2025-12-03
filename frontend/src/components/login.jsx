import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'; // <--- Import the fancy CSS here

function Login(props) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');

    const sendOtp = async () => {
        try {
            await axios.post('http://localhost:5000/api/auth/send-otp', { phoneNumber });
            setStep(2);
            setMessage(`OTP sent to ${phoneNumber}`);
        } catch (error) {
            setMessage('Error sending OTP.');
        }
    };

    const verifyOtp = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
                phoneNumber,
                otp
            });

            const { token, user } = response.data;
            setMessage('Login Successful!');

            if (props.onLoginSuccess) {
                props.onLoginSuccess(token, user.role);
            }
        } catch (error) {
            setMessage('Invalid OTP. Try again.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Welcome Back</h2>

                {step === 1 && (
                    <div className="fade-in">
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <button className="login-btn" onClick={sendOtp}>
                            Get OTP
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="fade-in">
                        <p style={{ marginBottom: '10px' }}>Enter code sent to you</p>
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <button className="login-btn" onClick={verifyOtp}>
                            Verify Login
                        </button>
                        <button
                            onClick={() => setStep(1)}
                            style={{ background: 'none', border: 'none', color: 'white', marginTop: '10px', textDecoration: 'underline', cursor: 'pointer' }}>
                            Change Number
                        </button>
                    </div>
                )}

                {message && <p className="login-message">{message}</p>}
            </div>
        </div>
    );
}

export default Login;