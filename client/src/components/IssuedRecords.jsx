// PATH FROM REPO ROOT: /client/src/components/IssuedRecords.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!currentUser) return;
            try {
                // Query records where the hospitalUid matches the current user
                const q = query(
                    collection(db, "records"),
                    where("hospitalUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const userRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(userRecords);
            } catch (error) {
                console.error("Error fetching records:", error);
                toast.error("Could not fetch issued records. You may need to create a Firestore index.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [currentUser, db]);
    
    if (loading) return <div className="text-center"><div className="spinner"></div></div>;

    if (records.length === 0) {
        return <p>You have not issued any health records yet.</p>;
    }

    return (
        <div className="card">
            <h2>Credentials Issued by You</h2>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date Issued</th>
                            <th>Patient Wallet</th>
                            <th>Token ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td>{record.title}</td>
                                <td>{record.issuedDate}</td>
                                <td>{`${record.wallet.substring(0, 6)}...${record.wallet.substring(record.wallet.length - 4)}`}</td>
                                <td>{record.tokenId}</td>
                                <td>
                                    <a href={record.gatewayFileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">View Document</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IssuedRecords;