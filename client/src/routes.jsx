// PATH FROM REPO ROOT: /client/src/routes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './firebase';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';
import RecordsList from './components/RecordsList';
import Login from './components/Login';
import SignUp from './components/SignUp';
import IssueCredential from './components/IssueCredential';
import IssuedRecords from './components/IssuedRecords';

// A layout for authenticated users
const AppLayout = () => (
    <>
        <Navbar />
        <main className="container">
            <Outlet /> {/* Nested routes will render here */}
        </main>
    </>
);

// Route guard for Hospitals
const HospitalRoute = () => {
    const { userProfile } = useAuth();
    if (userProfile?.role !== 'hospital') {
        return <Navigate to="/records" />; // Or an unauthorized page
    }
    return <Outlet />;
};

// Route guard for Patients
const PatientRoute = () => {
    const { userProfile } = useAuth();
    if (userProfile?.role !== 'patient') {
        return <Navigate to="/issue" />; // Or an unauthorized page
    }
    return <Outlet />;
};


const AppRoutes = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <Router>
            <Routes>
                {!currentUser ? (
                    <>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </>
                ) : (
                    <Route element={<AppLayout />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        
                        {/* Hospital-only routes */}
                        <Route element={<HospitalRoute />}>
                            <Route path="/issue" element={<IssueCredential />} />
                            <Route path="/issued" element={<IssuedRecords />} />
                        </Route>

                        {/* Patient-only routes */}
                        <Route element={<PatientRoute />}>
                            <Route path="/records" element={<RecordsList />} />
                        </Route>

                        {/* Default route after login */}
                        <Route path="*" element={<Navigate to="/profile" />} />
                    </Route>
                )}
            </Routes>
        </Router>
    );
};

export default AppRoutes;