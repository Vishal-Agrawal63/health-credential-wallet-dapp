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
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" required minLength="6" />
                </div>
                <div className="form-group">
                    <label>I am a...</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                        <option value="patient">Patient</option>
                        <option value="hospital">Hospital</option>
                    </select>
                </div>

                {role === 'patient' && (
                    <>
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
                            <input name="dob" type="date" onChange={handleProfileChange} className="form-control" required />
                        </div>
                    </>
                )}

                {role === 'hospital' && (
                    <>
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
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
            <p className="mt-3">
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
};

export default SignUp;