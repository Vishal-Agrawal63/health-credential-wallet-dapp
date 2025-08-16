// PATH FROM REPO ROOT: /client/src/components/AuthGate.jsx
import React from 'react';
import { useAuth } from '../firebase';
import toast from 'react-hot-toast';

const AuthGate = () => {
    const { signInWithGoogle, loading } = useAuth();
    
    // The useEffect hook that caused redirects has been removed.
    // The main router now handles all navigation logic.

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            toast.success('Logged in successfully!');
        } catch (error) {
            toast.error('Failed to log in. Please try again.');
            console.error(error);
        }
    };
    
    if (loading) {
        return <div className="text-center"><div className="spinner"></div></div>;
    }

    return (
        <div className="auth-gate-container">
            <h1>Welcome to Your Health Wallet</h1>
            <p>Securely manage and own your health credentials on the blockchain.</p>
            <button onClick={handleLogin} className="btn btn-primary">
                Sign in with Google
            </button>
        </div>
    );
};

export default AuthGate;