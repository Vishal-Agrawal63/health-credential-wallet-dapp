import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3'; // Import useWeb3
import { ethers } from 'ethers'; // Import ethers
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import contractAbi from '../abi/HealthCredentialNFT.json'; // Import ABI

// Ensure your contract address is in your .env file
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const { signer, provider, isSepolia } = useWeb3(); // Get signer and provider for on-chain actions
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientDataMap, setPatientDataMap] = useState({});
    
    // State to hold the on-chain status of each token
    const [tokenStatuses, setTokenStatuses] = useState({});

    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUser || !provider) {
                if(!currentUser) setLoading(false);
                return;
            };

            setLoading(true);
            try {
                // Step 1: Fetch all records issued by the current hospital from Firestore
                const recordsQuery = query(
                    collection(db, "records"),
                    where("hospitalUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );
                const recordsSnapshot = await getDocs(recordsQuery);
                const issuedRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(issuedRecords);

                // Step 2: If records exist, fetch their on-chain statuses in parallel
                if (issuedRecords.length > 0) {
                    const contract = new ethers.Contract(contractAddress, contractAbi.abi, provider);
                    const statusPromises = issuedRecords.map(async (record) => {
                        const isRevoked = await contract.isRevoked(record.tokenId);
                        const isExpired = await contract.isExpired(record.tokenId);
                        return { tokenId: record.tokenId, isRevoked, isExpired };
                    });
                    const statuses = await Promise.all(statusPromises);
                    const statusMap = statuses.reduce((acc, status) => {
                        acc[status.tokenId] = { revoked: status.isRevoked, expired: status.isExpired };
                        return acc;
                    }, {});
                    setTokenStatuses(statusMap);
                }
                
                // Step 3: Fetch corresponding patient data
                if (issuedRecords.length > 0) {
                    const patientUids = [...new Set(issuedRecords.map(rec => rec.patientUid))];
                    if(patientUids.length > 0) {
                        const usersQuery = query(collection(db, "users"), where("uid", "in", patientUids));
                        const usersSnapshot = await getDocs(usersQuery);
                        const patientMap = {};
                        usersSnapshot.forEach(doc => {
                            const userData = doc.data();
                            patientMap[userData.uid] = `${userData.name} ${userData.surname}`;
                        });
                        setPatientDataMap(patientMap);
                    }
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Could not fetch records. Check console for details.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currentUser, db, provider]); // Rerun when the provider is available

    // Handle the revocation transaction
    const handleRevoke = async (tokenId) => {
        if (!signer || !isSepolia) {
            toast.error("Please connect to the Sepolia network with your wallet.");
            return;
        }

        if (!window.confirm(`Are you sure you want to revoke Token ID #${tokenId}? This action is irreversible.`)) {
            return;
        }

        const toastId = toast.loading("Sending revocation transaction...");
        try {
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
            const tx = await contract.revoke(tokenId);
            await tx.wait();

            // Update local state to reflect the change immediately without a full refresh
            setTokenStatuses(prev => ({ ...prev, [tokenId]: { ...prev[tokenId], revoked: true } }));
            
            toast.success(`Token ID #${tokenId} has been revoked.`, { id: toastId });
        } catch (error) {
            console.error("Revocation failed:", error);
            const errorMessage = error.reason || "Revocation failed. See console for details.";
            toast.error(errorMessage, { id: toastId });
        }
    };

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
                            <th>Patient Name</th>
                            <th>Date Issued</th>
                            <th>Token ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => {
                            const status = tokenStatuses[record.tokenId];
                            let statusText = 'Loading...';
                            if (status) {
                                if (status.revoked) statusText = 'Revoked';
                                else if (status.expired) statusText = 'Expired';
                                else statusText = 'Active';
                            }
                            
                            return (
                                <tr key={record.id}>
                                    <td>{record.title}</td>
                                    <td>{patientDataMap[record.patientUid] || 'N/A'}</td>
                                    <td>{record.issuedDate}</td>
                                    <td>{record.tokenId}</td>
                                    <td>
                                        <span className={`status-${statusText.toLowerCase()}`}>{statusText}</span>
                                    </td>
                                    <td>
                                        <a href={record.gatewayFileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">View</a>
                                        {/* Only show the Revoke button if the token is still active */}
                                        {status && !status.revoked && !status.expired && (
                                            <button 
                                                onClick={() => handleRevoke(record.tokenId)} 
                                                className="btn btn-sm btn-danger" 
                                                style={{marginLeft: '4px'}}
                                                disabled={!isSepolia}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IssuedRecords;