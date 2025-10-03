// PATH FROM REPO ROOT: /client/src/components/RecordsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ethers } from 'ethers'; // Import ethers for formatting

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
                    where("patientUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc") // Order by creation time, newest first
                );
                const querySnapshot = await getDocs(q);
                const userRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecords(userRecords);
            } catch (error) {
                console.error("Error fetching records:", error);
                toast.error("Could not fetch records. You may need to create a Firestore index.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [currentUser, db]);
    
    // Helper function to truncate wallet addresses and hashes
    const truncateHash = (hash) => {
        if (!hash) return '...';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    // Helper to format gas price from Wei to Gwei
    const formatGasPrice = (priceInWei) => {
        if (!priceInWei || priceInWei === "0") return 'N/A';
        return `${parseFloat(ethers.formatUnits(priceInWei, 'gwei')).toFixed(2)} Gwei`;
    };
    
        // --- NEW HELPER FUNCTION ---
    // Calculates and formats the total transaction fee.
    const formatTransactionFee = (gasUsed, gasPrice) => {
        // Check if the necessary data exists (for older records)
        if (!gasUsed || !gasPrice || gasPrice === "0") return 'N/A';
        
        // Use BigInt for safe multiplication of large numbers
        const gasUsedBigInt = BigInt(gasUsed);
        const gasPriceBigInt = BigInt(gasPrice);
        const feeInWei = gasUsedBigInt * gasPriceBigInt;

        // Format the result from Wei to a readable ETH string
        return `${ethers.formatEther(feeInWei)} ETH`;
    };
    // --- END NEW HELPER ---
    
        // --- NEW HELPER FUNCTION ---
    const isCredentialExpired = (expiryDateString) => {
        if (!expiryDateString) return false; // If no expiry date, it's not expired
        // Set time to end of the day for comparison
        const expiry = new Date(expiryDateString);
        expiry.setHours(23, 59, 59, 999);
        return expiry < new Date();
    };
    // --- END NEW HELPER ---

    const handleShare = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    if (loading) return <div className="text-center"><div className="spinner"></div></div>;

    if (records.length === 0) {
        return <p>You have no health records yet.</p>;
    }

    return (
        <div>
            <h2>Your Health Credentials</h2>
            <div className="issued-records-container">
                {records.map((record, index) => {
                    
                    // --- FIX: CALL THE HELPER FUNCTION HERE ---
                    // This creates the 'isExpired' variable for the JSX below.
                    const isExpired = isCredentialExpired(record.expiryDate);
                    
                    const previousHash = (index + 1 < records.length) 
                        ? records[index + 1].txHash 
                        : '0x0000000000000000000000000000000000000000';

                    return (
                        <div key={record.id} className={`credential-card ${isExpired ? 'expired' : ''}`}>
                            <div className="card-header">Credential Block #{record.tokenId}</div>
                            {/* Adding the visual "EXPIRED" badge */}
                                {isExpired && <span className="expired-badge">EXPIRED</span>}
                            
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
                                
                                                                {/* --- NEW EXPIRATION DISPLAY --- */}
                                {record.expiryDate && (
                                     <div className="data-row">
                                        <span className="icon">⏳</span>
                                        <span className="label">Expires:</span>
                                        <span className={`value ${isExpired ? 'expired-text' : ''}`} >
                                            {new Date(record.expiryDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {/* --- END NEW DISPLAY --- */}

                                <hr />

                                <div className="section-title">On-Chain Data</div>

                                <hr />
                                
                                <div className="colored-bar-section purple">
                                    <div className="data-row title-row">
                                        <span className="label"><strong>Timestamp:</strong></span>
                                        <span className="value">{new Date(record.createdAt?.seconds * 1000).toLocaleString()}</span>
                                    </div>
                                    <div className="data-row indented">
                                        <span className="icon">⏱️</span>
                                        <span className="label">Issuer Addr:</span>
                                        <span className="value">{truncateHash(record.contractAddress)}</span>
                                    </div>
                                    <div className="data-row indented">
                                         <span className="icon">👤</span>
                                         <span className="label">Receiver Addr:</span>
                                         <span className="value">{truncateHash(record.wallet)}</span>
                                    </div>
                                </div>

                                <hr />

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
                                    <span className="value">{record.tokenId || 'N/A'}</span>
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
                                <div className="data-row">
                                    <span className="icon">💸</span>
                                    <span className="label">Trxn Fee:</span>
                                    <span className="value">{formatTransactionFee(record.gasUsed, record.gasPrice)}</span>
                                </div>

                            </div>

                            {/* Action Buttons */}
                            <div className="card-footer actions">
                                <a href={record.gatewayFileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">View</a>
                                <a href={record.gatewayFileUrl} download className="btn btn-sm btn-secondary">Download</a>
                                <button onClick={() => handleShare(record.gatewayFileUrl)} className="btn btn-sm btn-primary">Share</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecordsList;