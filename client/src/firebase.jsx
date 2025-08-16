// PATH FROM REPO ROOT: /client/src/firebase.js
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "firebase/auth";
import { 
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from 'react';

// ... (firebaseConfig remains the same)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await handleUserProfile(user);
        } catch (error) {
            console.error("Error during Google sign-in:", error);
            throw error;
        }
    };

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    const handleUserProfile = async (user) => {
        if (!user) {
            setUserProfile(null);
            return null;
        }
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const profileData = userSnap.data();
            setUserProfile(profileData);
            return profileData;
        } else {
            const newUserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                name: '',
                surname: '',
                dob: '',
                walletAddress: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, newUserProfile);
            setUserProfile(newUserProfile);
            return newUserProfile;
        }
    };

    // --- START OF ADDED CODE ---
    // This function allows any component to manually trigger a refresh of the user profile.
    const refreshUserProfile = async () => {
        if (auth.currentUser) {
            await handleUserProfile(auth.currentUser);
        }
    };
    // --- END OF ADDED CODE ---
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await handleUserProfile(user);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        db,
        auth,
        refreshUserProfile // <-- Expose the new function through the context
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};