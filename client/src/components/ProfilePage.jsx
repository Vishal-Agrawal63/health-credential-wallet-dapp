// PATH FROM REPO ROOT: /client/src/components/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';
import { Link } from 'react-router-dom';
import RecordsList from './RecordsList';

const ProfilePage = () => {
    const { userProfile } = useAuth();
    const { account } = useWeb3();

    if (!userProfile) {
        return <div className="text-center"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="card">
                <h2>User Profile</h2>
                <p><strong>Name:</strong> {userProfile.name} {userProfile.surname}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Date of Birth:</strong> {userProfile.dob}</p>
                <p><strong>Wallet Address:</strong> {account || userProfile.walletAddress || 'Not Connected'}</p>
                <Link to="/complete-profile" className="btn btn-secondary mt-3" style={{maxWidth: '150px'}}>Edit Profile</Link>
            </div>

            <div className="card">
                <h2>My Health Records</h2>
                <RecordsList />
            </div>
        </div>
    );
};

export default ProfilePage;