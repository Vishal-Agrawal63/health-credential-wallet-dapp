// PATH FROM REPO ROOT: /client/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';
import WalletConnect from './WalletConnect';

const Navbar = () => {
    const { currentUser, signOut } = useAuth();
    const { isConnected } = useWeb3();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <Link to="/" className="navbar-brand">Health Wallet</Link>
            <div className="nav-links">
                {currentUser ? (
                    <>
                        <Link to="/profile">Profile</Link>
                        <Link to="/records">My Records</Link>
                        <Link to="/upload">Upload & Mint</Link>
                        <WalletConnect />
                        <button onClick={handleSignOut} className="btn btn-danger btn-sm">Sign Out</button>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </header>
    );
};

export default Navbar;