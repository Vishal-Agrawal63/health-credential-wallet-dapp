// PATH FROM REPO ROOT: /client/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase';
import WalletConnect from './WalletConnect';


const Navbar = () => {
    const { userProfile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <Link to="/profile" className="navbar-brand">Health Wallet</Link>
            <div className="nav-links">
                {userProfile?.role === 'patient' && (
                    <>
                        <Link to="/records">My Records</Link>
                    </>
                )}
                {userProfile?.role === 'hospital' && (
                    <>
                        <Link to="/issue">Issue Credential</Link>
                        <Link to="/issued">Issued Records</Link>
                    </>
                )}
                <Link to="/profile">Profile</Link>
                <Link to="/verify">Verify Credential</Link>
                <WalletConnect />
                <button onClick={handleSignOut} className="btn btn-danger btn-sm">Sign Out</button>
            </div>
        </header>
    );
};

export default Navbar;