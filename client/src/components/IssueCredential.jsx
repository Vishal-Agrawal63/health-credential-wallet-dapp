// PATH FROM REPO ROOT: /client/src/components/IssueCredential.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';
import { uploadFileToIPFS, uploadJsonToIPFS } from '../lib/ipfs';
import { ethers } from 'ethers';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import contractAbi from '../abi/HealthCredentialNFT.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const IssueCredential = () => {
    const { userProfile, auth, db } = useAuth();
    const { signer, isConnected, isSepolia, connectWallet } = useWeb3();
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({ title: '', issuedDate: '', description: '', patientWalletAddress: '' });
    const [loading, setLoading] = useState(false);
    
    const [patientList, setPatientList] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    
    // --- VALIDATION: Get today's date in YYYY-MM-DD format ---
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const q = query(collection(db, "users"), where("role", "==", "patient"));
                const querySnapshot = await getDocs(q);
                const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPatientList(patients);
            } catch (error) {
                toast.error("Could not fetch patient list.");
                console.error("Error fetching patients:", error);
            } finally {
                setPatientsLoading(false);
            }
        };
        fetchPatients();
    }, [db]);

    const handlePatientSelect = (e) => {
        const patientId = e.target.value;
        if (!patientId) {
            setFormData({ ...formData, patientWalletAddress: '' });
            return;
        }
        const patient = patientList.find(p => p.id === patientId);
        if (patient && patient.walletAddress) {
            setFormData({ ...formData, patientWalletAddress: patient.walletAddress });
        } else {
            toast.error("This patient has not connected their wallet yet.");
            setFormData({ ...formData, patientWalletAddress: '' });
        }
    };
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const patientAddress = formData.patientWalletAddress.trim().toLowerCase();

        if (!file || !formData.title || !formData.issuedDate || !patientAddress) {
            return toast.error('Please select a patient and fill all required fields.');
        }
        if (!ethers.isAddress(patientAddress)) {
            return toast.error('Selected patient has an invalid wallet address.');
        }
        // --- MODIFICATION 1: CUSTOM TOAST FOR UNCONNECTED WALLET ---
        if (!isConnected || !signer) {
            toast.error('Please connect your account first.'); // Specific message
            await connectWallet();
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Starting issuance process...');

        try {
            const patient = patientList.find(p => p.walletAddress === patientAddress);
            if (!patient) throw new Error("Could not verify selected patient.");
            
            toast.loading('1/4: Uploading file...', { id: toastId });
            const idToken = await auth.currentUser.getIdToken();
            const fileRes = await uploadFileToIPFS(file, idToken);

            toast.loading('2/4: Uploading metadata...', { id: toastId });
            const metadata = {
                title: formData.title, issuer: userProfile.hospitalName, issuedDate: formData.issuedDate,
                description: formData.description, mimeType: fileRes.mimeType,
                ipfsFileUrl: fileRes.ipfsFileUrl, fileCid: fileRes.cid,
                ownerWallet: patientAddress,
            };
            const metaRes = await uploadJsonToIPFS(metadata);

            toast.loading('3/4: Awaiting transaction...', { id: toastId });
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
            const tx = await contract.mintTo(patientAddress, metaRes.ipfsUrl);
            const receipt = await tx.wait();

            let tokenId = null;
            if (receipt && receipt.logs) {
                const transferLog = receipt.logs.find(
                    (log) =>
                    log.address.toLowerCase() === contractAddress.toLowerCase() &&
                    log.topics[0] === ethers.id("Transfer(address,address,uint256)")
                );
                if (transferLog) {
                    const parsedLog = contract.interface.parseLog(transferLog);
                    tokenId = parsedLog.args.tokenId.toString();
                }
            }

            if (tokenId === null) {
                throw new Error("Could not extract Token ID from transaction receipt.");
            }

            toast.loading('4/4: Saving record...', { id: toastId });
            await setDoc(doc(db, 'records', uuidv4()), {
                patientUid: patient.id, hospitalUid: auth.currentUser.uid,
                issuerName: userProfile.hospitalName, wallet: patientAddress, tokenId: tokenId,
                txHash: receipt.hash, contractAddress: contractAddress, title: formData.title,
                issuedDate: formData.issuedDate, description: formData.description,
                gatewayFileUrl: fileRes.gatewayFileUrl, gatewayMetadataUrl: metaRes.gatewayUrl,
                createdAt: serverTimestamp(),
            });

            toast.success(`NFT minted! Token ID: ${tokenId}`, { id: toastId });
            e.target.reset();
            setFile(null);
            setFormData({ title: '', issuedDate: '', description: '', patientWalletAddress: '' });

        } catch (error) {
            console.error("Issuance failed:", error);
            // --- MODIFICATION 2: CUSTOM TOAST FOR TRANSACTION REJECTION ---
            if (error.code === 'ACTION_REJECTED') {
                toast.error('User rejected the transaction.', { id: toastId });
            } else {
                toast.error(error.message || "An unknown error occurred.", { id: toastId });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Issue a New Health Credential</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Select Patient *</label>
                    <select className="form-control" onChange={handlePatientSelect} disabled={patientsLoading} defaultValue="">
                        <option value="" disabled>{patientsLoading ? 'Loading patients...' : 'Select a patient'}</option>
                        {patientList.map(patient => (
                            <option key={patient.id} value={patient.id}>
                                {patient.name} {patient.surname}
                            </option>
                        ))}
                    </select>
                </div>

                {formData.patientWalletAddress && (
                     <div className="form-group">
                        <label>Patient's Wallet Address</label>
                        <input type="text" value={formData.patientWalletAddress} className="form-control" readOnly />
                    </div>
                )}
                
                <div className="form-group">
                    <label>Document Title *</label>
                    <input name="title" onChange={handleChange} value={formData.title} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Date Issued *</label>
                    {/* --- VALIDATION: Added max={today} attribute --- */}
                    <input name="issuedDate" type="date" value={formData.issuedDate} onChange={handleChange} className="form-control" max={today} required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-control"></textarea>
                </div>
                <div className="form-group">
                    <label>File (PDF, PNG, JPG) *</label>
                    <input type="file" onChange={handleFileChange} className="form-control" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !isSepolia}>
                    {loading ? 'Issuing...' : 'Issue Credential'}
                </button>
            </form>
        </div>
    );
};

export default IssueCredential;