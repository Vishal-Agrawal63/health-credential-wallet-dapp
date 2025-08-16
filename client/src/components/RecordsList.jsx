// PATH FROM REPO ROOT: /client/src/components/RecordsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

const RecordsList = () => {
    const { currentUser, db } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, "records"),
                    where("uid", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const userRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(userRecords);
            } catch (error) {
                console.error("Error fetching records:", error);
                toast.error("Could not fetch records.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [currentUser, db]);
    
    const handleShare = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    if (loading) return <div className="text-center"><div className="spinner"></div></div>;

    if (records.length === 0) {
        return <p>You have no health records yet.</p>;
    }

    return (
        <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Issuer</th>
                        <th>Date Issued</th>
                        <th>Token ID</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(record => (
                        <tr key={record.id}>
                            <td>{record.title}</td>
                            <td>{record.issuer}</td>
                            <td>{record.issuedDate}</td>
                            <td>{record.tokenId}</td>
                            <td>
                                <a href={record.gatewayFileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">View</a>
                                <a href={record.gatewayFileUrl} download target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{marginLeft: '4px'}}>Download</a>
                                <button onClick={() => handleShare(record.gatewayFileUrl)} className="btn btn-sm btn-primary" style={{marginLeft: '4px'}}>Share</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RecordsList;