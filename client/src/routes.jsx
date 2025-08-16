// PATH FROM REPO ROOT: /client/src/routes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './firebase';
import Navbar from './components/Navbar';
import ProfileForm from './components/ProfileForm';
import AuthGate from './components/AuthGate';
import ProfilePage from './components/ProfilePage';
import UploadAndMint from './components/UploadAndMint';
import RecordsList from './components/RecordsList';

const AppRoutes = () => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Router>
            {/* The Navbar is shown only if the user is logged in */}
            {currentUser && <Navbar />}
            <main className="container">
                <Routes>
                    {!currentUser ? (
                        // STATE 1: User is Logged Out
                        // Only the login page is accessible. All other paths redirect to /login.
                        <>
                            <Route path="/login" element={<AuthGate />} />
                            <Route path="*" element={<Navigate to="/login" />} />
                        </>
                    ) : !userProfile?.name || !userProfile?.surname || !userProfile?.dob ? (
                        // STATE 2: User is Logged In but Profile is INCOMPLETE
                        // Only the profile completion form is accessible. All other paths redirect here.
                        <>
                            <Route path="/complete-profile" element={<ProfileForm />} />
                            <Route path="*" element={<Navigate to="/complete-profile" />} />
                        </>
                    ) : (
                        // STATE 3: User is Logged In and Profile is COMPLETE
                        // All main application routes are accessible.
                        <>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/upload" element={<UploadAndMint />} />
                            <Route path="/records" element={<RecordsList />} />
                            {/* We still need a route to allow users to EDIT their profile later */}
                            <Route path="/complete-profile" element={<ProfileForm />} />
                            <Route path="/" element={<Navigate to="/profile" />} />
                            <Route path="*" element={<Navigate to="/profile" />} />
                        </>
                    )}
                </Routes>
            </main>
        </Router>
    );
};

export default AppRoutes;