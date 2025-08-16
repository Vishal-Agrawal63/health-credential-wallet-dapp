// PATH FROM REPO ROOT: /client/src/components/ProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom'; // <-- No longer needed
import toast from 'react-hot-toast';

const ProfileForm = () => {
    // Destructure the new refreshUserProfile function from the context
    const { currentUser, userProfile, db, refreshUserProfile } = useAuth();
    const [formData, setFormData] = useState({ name: '', surname: '', dob: '' });
    const [loading, setLoading] = useState(false);
    // const navigate = useNavigate(); // <-- No longer needed

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                surname: userProfile.surname || '',
                dob: userProfile.dob || ''
            });
        }
    }, [userProfile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.surname || !formData.dob) {
            toast.error('All fields are required.');
            return;
        }
        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });
            toast.success('Profile updated successfully!');
            
            // --- KEY CHANGE ---
            // After saving to the DB, refresh the global user profile state.
            // This will cause the router to re-evaluate and grant access to the main app.
            await refreshUserProfile();
            
            // The navigate() call is removed. The router will handle the redirect declaratively.
            // navigate('/profile'); 
            
        } catch (error) {
            toast.error('Failed to update profile.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>{userProfile?.name ? 'Edit Profile' : 'Complete Your Profile'}</h2>
            <p>This information is required to continue.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">First Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label htmlFor="surname">Last Name</label>
                    <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} className="form-control" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <div className="spinner"></div> : 'Save Profile'}
                </button>
            </form>
        </div>
    );
};

export default ProfileForm;