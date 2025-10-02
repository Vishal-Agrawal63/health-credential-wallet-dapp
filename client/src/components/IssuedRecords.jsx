import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3'; // Import useWeb3
import { ethers } from 'ethers'; // Import ethers
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ethers } from 'ethers'; // Ethers is needed for formatting gas price
import contractAbi from '../abi/HealthCredentialNFT.json'; // Import ABI

// Ensure your contract address is in your .env file
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const IssuedRecords = () => {
    const { currentUser, db } = useAuth();
    const { signer, provider, isSepolia } = useWeb3(); // Get signer and provider for on-chain actions
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
                    orderBy("createdAt", "desc") // Fetch newest first
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