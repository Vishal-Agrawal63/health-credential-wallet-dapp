// PATH FROM REPO ROOT: /client/src/components/IssuedRecords.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ethers } from 'ethers'; // Ethers is needed for formatting gas price

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper function to truncate wallet addresses and hashes for display
    const truncateHash = (hash) => {
        if (!hash) return '...';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    // Helper to format gas price from Wei to Gwei for readability
    const formatGasPrice = (priceInWei) => {
        if (!priceInWei || priceInWei === "0") return 'N/A';
        return `${parseFloat(ethers.formatUnits(priceInWei, 'gwei')).toFixed(2)} Gwei`;
    };

    useEffect(() => {
        const fetchIssuedRecords = async () => {
            if (!currentUser) return;
            try {
                const recordsQuery = query(
                    collection(db, "records"),
                    where("hospitalUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc") // Fetch newest first
                );
                const recordsSnapshot = await getDocs(recordsQuery);
                const issuedRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(issuedRecords);
            } catch (error) {
                console.error("Error fetching records:", error);
                toast.error("Could not fetch issued records.");
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
        <div>
            <h2>Credentials Issued by You</h2>
            <div className="issued-records-container">
                {records.map((record, index) => {
                    const previousHash = (index + 1 < records.length) 
                        ? records[index + 1].txHash 
                        : '0x0000000000000000000000000000000000000000'; 

                    return (
                        <div key={record.id} className="credential-card">
                            <div className="card-header">Credential Block #{record.tokenId}</div>
                            
                            <div className="card-body">
                                <div className="section-title">Document Info</div>
                                <div className="data-row">
                                    <span className="icon">📎</span>
                                    <span className="label">Title:</span>
                                    <span className="value">{record.title}</span>
                                </div>
                                <div className="data-row">
                                    <span className="icon">🏥</span>
                                    <span className="label">Issuer Name:</span>
                                    <span className="value">{record.issuerName}</span>
                                </div>

                                <hr />

                                <div className="section-title">On-Chain Data</div>
                                
                                
                                <div className="colored-bar-section purple">
                                    <div className="data-row title-row">
                                        <span className="label"><strong>Timestamp:</strong></span>
                                        <span className="value">{new Date(record.createdAt?.seconds * 1000).toLocaleString()}</span>
                                    </div>
                                    <div className="data-row indented">
                                        <span className="icon">⏱️</span>
                                        <span className="label">Issuer Addr:</span>
                                        <span className="value">{truncateHash(record.issuerWallet)}</span>
                                    </div>
                                    <div className="data-row indented">
                                         <span className="icon">👤</span>
                                         <span className="label">Receiver Addr:</span>
                                         <span className="value">{truncateHash(record.patientWallet)}</span>
                                    </div>
                                </div>

                                <div className="colored-bar-section split">
                                     <div className="data-row title-row">
                                         <span className="label"><strong>Integrity Hashes</strong></span>
                                          <span className="value">{truncateHash(record.txHash)}</span>
                                     </div>
                                    <div className="data-row indented">
                                         <span className="label">Previous Hash</span>
                                         <span className="value">{truncateHash(previousHash)}</span>
                                    </div>
                                </div>

                                 <hr />

                                <div className="section-title">
                                    Transaction Details <a href={`https://sepolia.etherscan.io/tx/${record.txHash}`} target="_blank" rel="noopener noreferrer">{truncateHash(record.txHash)} 🔗</a>
                                </div>
                                
                                 <div className="data-row">
                                    <span className="icon">📦</span>
                                    <span className="label">Block Number:</span>
                                    <span className="value">{record.blockNumber}</span>
                                </div>
                                 <div className="data-row">
                                    <span className="icon">⛽</span>
                                    <span className="label">Gas Used:</span>
                                    <span className="value">{record.gasUsed ? parseInt(record.gasUsed).toLocaleString() : 'N/A'}</span>
                                </div>
                                 <div className="data-row">
                                    <span className="icon">💰</span>
                                    <span className="label">Gas Price:</span>
                                    <span className="value">{formatGasPrice(record.gasPrice)}</span>
                                </div>
                            </div>
                            
                            <div className="card-footer text">
                                ↓ Connects to Block #{parseInt(record.tokenId) + 1}'s Previous Hash
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default IssuedRecords;