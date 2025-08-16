// PATH FROM REPO ROOT: /client/src/components/SignUp.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase';
import toast from 'react-hot-toast';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [profileData, setProfileData] = useState({});
    const [loading, setLoading] = useState(false);
    const { signUpWithEmail } = useAuth();
    const navigate = useNavigate();
    
        // --- VALIDATION: Get today's date in YYYY-MM-DD format ---
    const today = new Date().toISOString().split('T')[0];

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signUpWithEmail(email, password, role, profileData);
            toast.success('Account created successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                {/* --- BRANDING ADDED --- */}
                <h1 style={{fontSize: '1.5rem', marginBottom: '0.25rem'}}>Health Credential Wallet</h1>
                <h2 style={{fontSize: '1.25rem', marginTop: 0}}>Create an Account</h2>
                <p>Join the secure health network today.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>I am a...</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                            <option value="patient">Patient</option>
                            <option value="hospital">Hospital</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" required minLength="6" />
                    </div>

                    {role === 'patient' && (
                        <>
                            <hr style={{margin: '1.5rem 0'}} />
                            <div className="form-group">
                                <label>First Name</label>
                                <input name="name" onChange={handleProfileChange} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input name="surname" onChange={handleProfileChange} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                {/* --- VALIDATION: Added max={today} attribute --- */}
                                <input name="dob" type="date" onChange={handleProfileChange} className="form-control" max={today} required />
                            </div>
                        </>
                    )}

                    {role === 'hospital' && (
                        <>
                             <hr style={{margin: '1.5rem 0'}} />
                            <div className="form-group">
                                <label>Hospital Name</label>
                                <input name="hospitalName" onChange={handleProfileChange} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input name="address" onChange={handleProfileChange} className="form-control" required />
                            </div>
                            <div className="form-group">
                                <label>License Number</label>
                                <input name="licenseNumber" onChange={handleProfileChange} className="form-control" required />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="switch-auth">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;