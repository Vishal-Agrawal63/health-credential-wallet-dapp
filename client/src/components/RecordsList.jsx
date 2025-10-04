import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

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
                    orderBy("createdAt", "desc")
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
    
    const truncateHash = (hash) => {
        if (!hash) return '...';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    const formatGasPrice = (priceInWei) => {
        if (!priceInWei || priceInWei === "0") return 'N/A';
        return `${parseFloat(ethers.formatUnits(priceInWei, 'gwei')).toFixed(2)} Gwei`;
    };
    
    const formatTransactionFee = (gasUsed, gasPrice) => {
        if (!gasUsed || !gasPrice || gasPrice === "0") return 'N/A';
        const gasUsedBigInt = BigInt(gasUsed);
        const gasPriceBigInt = BigInt(gasPrice);
        const feeInWei = gasUsedBigInt * gasPriceBigInt;
        return `${ethers.formatEther(feeInWei)} ETH`;
    };
    
    const isCredentialExpired = (expiryDateString) => {
        if (!expiryDateString) return false;
        const expiry = new Date(expiryDateString);
        expiry.setHours(23, 59, 59, 999);
        return expiry < new Date();
    };

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
                    const isExpired = isCredentialExpired(record.expiryDate);
                    const previousHash = (index + 1 < records.length) 
                        ? records[index + 1].txHash 
                        : '0x0000000000000000000000000000000000000000';

                    return (
                        <div key={record.id} className={`credential-card ${record.revoked ? 'revoked' : ''} ${isExpired ? 'expired' : ''}`}>
                            <div className="card-header">
                                Credential Block #{record.tokenId}
                                {record.revoked && <span className="revoked-badge">REVOKED</span>}
                                {!record.revoked && isExpired && <span className="expired-badge">EXPIRED</span>}
                            </div>
                            
                            <div className="card-body">
                                <div className="section-title">Document Info</div>
                                <div className="data-row"><span className="icon">📎</span><span className="label">Title:</span><span className="value">{record.title}</span></div>
                                <div className="data-row"><span className="icon">🏥</span><span className="label">Issuer Name:</span><span className="value">{record.issuerName}</span></div>
                                {record.expiryDate && (
                                     <div className="data-row">
                                        <span className="icon">⏳</span><span className="label">Expires:</span>
                                        <span className={`value ${record.revoked ? 'revoked-text' : ''} ${isExpired ? 'expired-text' : ''}`}>
                                            {new Date(record.expiryDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                <hr />
                                <div className="section-title">On-Chain Data</div>
                                <div className="colored-bar-section purple">
                                    <div className="data-row title-row"><span className="label"><strong>Timestamp:</strong></span><span className="value">{new Date(record.createdAt?.seconds * 1000).toLocaleString()}</span></div>
                                    <div className="data-row indented"><span className="icon">⏱️</span><span className="label">Issuer Addr:</span><span className="value">{truncateHash(record.contractAddress)}</span></div>
                                    <div className="data-row indented"><span className="icon">👤</span><span className="label">Receiver Addr:</span><span className="value">{truncateHash(record.wallet)}</span></div>
                                </div>
                                <div className="colored-bar-section split">
                                     <div className="data-row title-row"><span className="label"><strong>Integrity Hashes</strong></span><span className="value">{truncateHash(record.txHash)}</span></div>
                                    <div className="data-row indented"><span className="label">Previous Hash</span><span className="value">{truncateHash(previousHash)}</span></div>
                                </div>
                                <hr />
                                <div className="section-title">Transaction Details <a href={`https://sepolia.etherscan.io/tx/${record.txHash}`} target="_blank" rel="noopener noreferrer">{truncateHash(record.txHash)} 🔗</a></div>
                                <div className="data-row"><span className="icon">📦</span><span className="label">Block Number:</span><span className="value">{record.tokenId || 'N/A'}</span></div>
                                <div className="data-row"><span className="icon">⛽</span><span className="label">Gas Used:</span><span className="value">{record.gasUsed ? parseInt(record.gasUsed).toLocaleString() : 'N/A'}</span></div>
                                <div className="data-row"><span className="icon">💰</span><span className="label">Gas Price:</span><span className="value">{formatGasPrice(record.gasPrice)}</span></div>
                                <div className="data-row"><span className="icon">💸</span><span className="label">Trxn Fee:</span><span className="value">{formatTransactionFee(record.gasUsed, record.gasPrice)}</span></div>
                            </div>
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