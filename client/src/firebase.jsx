// PATH FROM REPO ROOT: /client/src/firebase.js
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from "firebase/auth";
import { 
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from 'react';

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

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const signUpWithEmail = async (email, password, role, profileData) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDoc = {
            uid: user.uid,
            email: user.email,
            role: role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...profileData
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
        setUserProfile(userDoc);
        return userCredential;
    };

    const signInWithEmail = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    const handleUserProfile = async (user) => {
        if (!user) {
            setUserProfile(null);
            return;
        }
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            setUserProfile(userSnap.data());
        } else {
            // This case should ideally not happen with the new signup flow
            console.error("No profile found for logged-in user.");
            setUserProfile(null);
        }
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            await handleUserProfile(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        db,
        auth
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};