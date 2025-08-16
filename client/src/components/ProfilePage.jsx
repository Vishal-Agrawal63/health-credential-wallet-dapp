// PATH FROM REPO ROOT: /client/src/components/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';

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
                {userProfile.role === 'patient' && (
                    <>
                        <p><strong>Name:</strong> {userProfile.name} {userProfile.surname}</p>
                        <p><strong>Date of Birth:</strong> {userProfile.dob}</p>
                    </>
                )}
                {userProfile.role === 'hospital' && (
                    <>
                        <p><strong>Hospital Name:</strong> {userProfile.hospitalName}</p>
                        <p><strong>Address:</strong> {userProfile.address}</p>
                        <p><strong>License Number:</strong> {userProfile.licenseNumber}</p>
                    </>
                )}
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Role:</strong> <span style={{textTransform: 'capitalize'}}>{userProfile.role}</span></p>
                <p><strong>Wallet Address:</strong> {account || userProfile.walletAddress || 'Not Connected'}</p>
            </div>
        </div>
    );
};

export default ProfilePage;