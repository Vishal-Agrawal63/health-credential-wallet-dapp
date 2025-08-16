// PATH FROM REPO ROOT: /client/src/components/IssuedRecords.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    // --- NEW STATE: To store patient data map { patientUid: 'Patient Name', ... } ---
    const [patientDataMap, setPatientDataMap] = useState({});

    useEffect(() => {
        const fetchIssuedRecords = async () => {
            if (!currentUser) return;
            try {
                // Step 1: Fetch all records issued by the current hospital
                const recordsQuery = query(
                    collection(db, "records"),
                    where("hospitalUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );
                const recordsSnapshot = await getDocs(recordsQuery);
                const issuedRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(issuedRecords);

                // Step 2: If records exist, fetch the corresponding patient data
                if (issuedRecords.length > 0) {
                    // Get a unique list of all patient UIDs from the records
                    const patientUids = [...new Set(issuedRecords.map(rec => rec.patientUid))];

                    // Fetch all user documents for those UIDs
                    const usersQuery = query(collection(db, "users"), where("uid", "in", patientUids));
                    const usersSnapshot = await getDocs(usersQuery);
                    
                    // Create a simple map of { uid: 'FirstName LastName' }
                    const patientMap = {};
                    usersSnapshot.forEach(doc => {
                        const userData = doc.data();
                        patientMap[userData.uid] = `${userData.name} ${userData.surname}`;
                    });
                    setPatientDataMap(patientMap);
                }
            } catch (error) {
                console.error("Error fetching records:", error);
                toast.error("Could not fetch issued records. You may need a Firestore index.");
            } finally {
                setLoading(false);
            }
        };

        fetchIssuedRecords();
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
                            {/* --- NEW COLUMN: Patient Name --- */}
                            <th>Patient Name</th>
                            <th>Date Issued</th>
                            <th>Token ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.id}>
                                <td>{record.title}</td>
                                {/* --- NEW COLUMN DATA: Look up name from the map --- */}
                                <td>{patientDataMap[record.patientUid] || 'Loading...'}</td>
                                <td>{record.issuedDate}</td>
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