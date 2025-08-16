// PATH FROM REPO ROOT: /client/src/components/IssueCredential.jsx
import React, { useState } from 'react';
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
    const { userProfile, auth, db } = useAuth(); // Hospital's profile
    const { signer, account, isConnected, isSepolia, connectWallet } = useWeb3();
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({ title: '', issuedDate: '', description: '', patientWalletAddress: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.title || !formData.issuedDate || !formData.patientWalletAddress) {
            return toast.error('Please fill all required fields and select a file.');
        }
        if (!ethers.isAddress(formData.patientWalletAddress)) {
            return toast.error('Invalid patient wallet address.');
        }
        
                // --- FIX: Sanitize the input address to lowercase before using it ---
        const patientAddress = formData.patientWalletAddress.trim().toLowerCase();

        if (!ethers.isAddress(patientAddress)) {
            return toast.error('Invalid patient wallet address.');
        }
        
        if (!isConnected || !signer) {
            toast.error('Please connect your wallet first.');
            await connectWallet();
            return;
        }
    

        setLoading(true);
        const toastId = toast.loading('Starting issuance process...');

        try {
            // Find patient UID from their wallet address
            const usersRef = collection(db, "users");
             const q = query(usersRef, where("walletAddress", "==", patientAddress));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                throw new Error("No patient found with this wallet address.");
            }
            const patientUid = querySnapshot.docs[0].id;
            
            toast.loading('1/4: Uploading file to IPFS...', { id: toastId });
            const idToken = await auth.currentUser.getIdToken();
            const fileRes = await uploadFileToIPFS(file, idToken);

            toast.loading('2/4: Uploading metadata to IPFS...', { id: toastId });
            const metadata = {
                title: formData.title,
                issuer: userProfile.hospitalName, // From hospital's profile
                issuedDate: formData.issuedDate,
                description: formData.description,
                mimeType: fileRes.mimeType,
                ipfsFileUrl: fileRes.ipfsFileUrl,
                fileCid: fileRes.cid,
                ownerWallet: formData.patientWalletAddress,
            };
            const metaRes = await uploadJsonToIPFS(metadata);

            toast.loading('3/4: Awaiting transaction confirmation...', { id: toastId });
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
            const tx = await contract.mintTo(formData.patientWalletAddress, metaRes.ipfsUrl);
            const receipt = await tx.wait();

            const transferLog = receipt.logs.find(log => log.eventName === 'Transfer');
            const tokenId = transferLog.args.tokenId.toString();

            toast.loading('4/4: Saving record to database...', { id: toastId });
            await setDoc(doc(db, 'records', uuidv4()), {
                patientUid: patientUid,
                hospitalUid: auth.currentUser.uid,
                issuerName: userProfile.hospitalName,
                wallet: formData.patientWalletAddress,
                tokenId: tokenId,
                txHash: receipt.hash,
                contractAddress: contractAddress,
                title: formData.title,
                issuedDate: formData.issuedDate,
                description: formData.description,
                gatewayFileUrl: fileRes.gatewayFileUrl,
                gatewayMetadataUrl: metaRes.gatewayUrl,
                createdAt: serverTimestamp(),
            });

            toast.success(`NFT minted successfully! Token ID: ${tokenId}`, { id: toastId });

        } catch (error) {
            console.error("Issuance failed:", error);
            toast.error(error.message || "An unknown error occurred.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Issue a New Health Credential</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Patient's Wallet Address *</label>
                    <input name="patientWalletAddress" onChange={handleChange} className="form-control" placeholder="0x..." required />
                </div>
                <div className="form-group">
                    <label>Document Title *</label>
                    <input name="title" onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Date Issued *</label>
                    <input name="issuedDate" type="date" onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" onChange={handleChange} className="form-control"></textarea>
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