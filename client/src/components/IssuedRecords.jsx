import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import contractAbi from '../abi/HealthCredentialNFT.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const { signer, isConnected, isSepolia } = useWeb3();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);

    // Helper functions (truncateHash, formatGasPrice, etc.) remain the same...
    const truncateHash = (hash) => {
        if (!hash) return '...';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    const formatGasPrice = (priceInWei) => {
        if (!priceInWei || priceInWei === "0") return 'N/A';
        return `${parseFloat(ethers.formatUnits(priceInWei, 'gwei')).toFixed(2)} Gwei`;
    };
    
    const isCredentialExpired = (expiryDateString) => {
        if (!expiryDateString) return false;
        const expiry = new Date(expiryDateString);
        expiry.setHours(23, 59, 59, 999);
        return expiry < new Date();
    };

    const formatTransactionFee = (gasUsed, gasPrice) => {
        if (!gasUsed || !gasPrice || gasPrice === "0") return 'N/A';
        const gasUsedBigInt = BigInt(gasUsed);
        const gasPriceBigInt = BigInt(gasPrice);
        const feeInWei = gasUsedBigInt * gasPriceBigInt;
        return `${ethers.formatEther(feeInWei)} ETH`;
    };

    // --- ** START: UPDATED SECTION ** ---
    const handleRevoke = async (record) => {
        if (!isConnected || !isSepolia || !signer) {
            toast.error("Please connect your wallet to the Sepolia network first.");
            return;
        }

        if (!window.confirm(`Are you sure you want to revoke credential #${record.tokenId}? This action is irreversible.`)) {
            return;
        }

        setRevokingId(record.tokenId);
        const toastId = toast.loading('Sending revocation transaction...');

        try {
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
            const tx = await contract.revoke(record.tokenId);
            await tx.wait();

            toast.loading('Updating record status...', { id: toastId });
            const recordRef = doc(db, 'records', record.id);
            await updateDoc(recordRef, {
                revoked: true,
                revokedAt: new Date()
            });

            setRecords(currentRecords =>
                currentRecords.map(r =>
                    r.id === record.id ? { ...r, revoked: true } : r
                )
            );

            toast.success(`Credential #${record.tokenId} revoked successfully.`, { id: toastId });
        
        } catch (error) {
            console.error("Revocation failed:", error);
            
            // This is the new, more specific error handling
            if (error.code === 'CALL_EXCEPTION') {
                toast.error('Revocation failed: Only the contract owner can perform this action. Please connect the owner wallet.', { id: toastId });
            } else if (error.code === 'ACTION_REJECTED') {
                toast.error('Transaction rejected.', { id: toastId });
            } else {
                toast.error('Revocation failed. See console for details.', { id: toastId });
            }
        } finally {
            setRevokingId(null);
        }
    };
    // --- ** END: UPDATED SECTION ** ---

    useEffect(() => {
        const fetchIssuedRecords = async () => {
            if (!currentUser) return;
            try {
                const recordsQuery = query(
                    collection(db, "records"),
                    where("hospitalUid", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
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
    if (records.length === 0) return <p>You have not issued any health records yet.</p>;

    return (
        <div>
            <h2>Credentials Issued by You</h2>
            <div className="issued-records-container">
                {records.map((record, index) => {
                    const isExpired = isCredentialExpired(record.expiryDate);
                    const isInvalid = record.revoked || isExpired;
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
                                <div className="data-row">
                                    <span className="icon">📎</span><span className="label">Title:</span><span className="value">{record.title}</span>
                                </div>
                                <div className="data-row">
                                    <span className="icon">🏥</span><span className="label">Issuer Name:</span><span className="value">{record.issuerName}</span>
                                </div>
                                {record.expiryDate && (
                                     <div className="data-row">
                                        <span className="icon">⏳</span><span className="label">Expires:</span>
                                        <span className={`value ${isInvalid ? 'revoked-text' : ''}`}>{new Date(record.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <hr />
                                <div className="section-title">On-Chain Data</div>
                                <div className="colored-bar-section purple">
                                    <div className="data-row title-row"><span className="label"><strong>Timestamp:</strong></span><span className="value">{new Date(record.createdAt?.seconds * 1000).toLocaleString()}</span></div>
                                    <div className="data-row indented"><span className="icon">⏱</span><span className="label">Issuer Addr:</span><span className="value">{truncateHash(record.contractAddress)}</span></div>
                                    <div className="data-row indented"><span className="icon">👤</span><span className="label">Receiver Addr:</span><span className="value">{truncateHash(record.wallet)}</span></div>
                                </div>
                                <div className="colored-bar-section split">
                                    <div className="data-row title-row"><span className="label"><strong>Integrity Hashes</strong></span><span className="value">{truncateHash(record.txHash)}</span></div>
                                    <div className="data-row indented"><span className="label">Previous Hash</span><span className="value">{truncateHash(previousHash)}</span></div>
                                </div>
                                <hr />
                                <div className="section-title">Transaction Details <a href={`https://sepolia.etherscan.io/tx/${record.txHash}`} target="_blank" rel="noopener noreferrer">{truncateHash(record.txHash)} 🔗</a></div>
                                <div className="data-row"><span className="icon">📦</span><span className="label">Block Number:</span><span className="value">{record.tokenId}</span></div>
                                <div className="data-row"><span className="icon">⛽</span><span className="label">Gas Used:</span><span className="value">{record.gasUsed ? parseInt(record.gasUsed).toLocaleString() : 'N/A'}</span></div>
                                <div className="data-row"><span className="icon">💰</span><span className="label">Gas Price:</span><span className="value">{formatGasPrice(record.gasPrice)}</span></div>
                                <div className="data-row"><span className="icon">💸</span><span className="label">Trxn Fee:</span><span className="value">{formatTransactionFee(record.gasUsed, record.gasPrice)}</span></div>
                            </div>

                            <div className="card-footer actions">
                                {!isInvalid ? (
                                    <button
                                        onClick={() => handleRevoke(record)}
                                        className="btn btn-sm btn-danger"
                                        disabled={revokingId === record.tokenId}
                                    >
                                        {revokingId === record.tokenId ? 'Revoking...' : 'Revoke'}
                                    </button>
                                ) : (
                                    <p className="revoked-text" style={{margin: 'auto', fontSize: '0.9rem'}}>
                                        {record.revoked ? 'This credential has been revoked.' : 'This credential has expired.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default IssuedRecords;