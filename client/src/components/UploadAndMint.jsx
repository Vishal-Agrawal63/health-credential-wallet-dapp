// PATH FROM REPO ROOT: /client/src/components/UploadAndMint.jsx
import React, { useState } from 'react';
import { useAuth } from '../firebase';
import { useWeb3 } from '../lib/web3';
import { uploadFileToIPFS, uploadJsonToIPFS } from '../lib/ipfs';
import { ethers, Log } from 'ethers'; // Import Log
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import contractAbi from '../abi/HealthCredentialNFT.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const UploadAndMint = () => {
    // ... (rest of the component state remains the same)
    const { currentUser, auth, db } = useAuth();
    const { signer, account, isConnected, isSepolia, connectWallet } = useWeb3();
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({ title: '', issuer: '', issuedDate: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && allowedFileTypes.includes(selectedFile.type)) {
            setFile(selectedFile);
        } else {
            toast.error('Invalid file type. Please select a PNG, JPG, or PDF.');
            setFile(null);
        }
    };
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (connection and validation logic remains the same)
        if (!file || !formData.title || !formData.issuer || !formData.issuedDate) {
            toast.error('Please fill all required fields and select a file.');
            return;
        }
        if (!isConnected || !signer) {
            toast('Please connect your wallet to continue.');
            const connectionSuccessful = await connectWallet();
            if (connectionSuccessful) {
                toast.success('Wallet connected! Please click "Upload and Mint" again.');
            } else {
                toast.error('Wallet connection failed. Please try again.');
            }
            return;
        }
        if (!isSepolia) {
            toast.error('Please switch to the Sepolia network to mint.');
            return;
        }

        setLoading(true);
        const mintPromise = new Promise(async (resolve, reject) => {
            try {
                // ... (IPFS upload logic remains the same)
                setLoadingText('Uploading file to IPFS...');
                const idToken = await auth.currentUser.getIdToken();
                const fileUploadResponse = await uploadFileToIPFS(file, idToken);

                setLoadingText('Uploading metadata to IPFS...');
                const metadata = {
                    title: formData.title, issuer: formData.issuer, issuedDate: formData.issuedDate,
                    description: formData.description, mimeType: fileUploadResponse.mimeType,
                    ipfsFileUrl: fileUploadResponse.ipfsFileUrl, fileCid: fileUploadResponse.cid,
                    ownerUid: currentUser.uid, ownerWallet: account
                };
                const metadataUploadResponse = await uploadJsonToIPFS(metadata);

                setLoadingText('Waiting for transaction confirmation...');
                const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
                const tokenURI = metadataUploadResponse.ipfsUrl;
                const tx = await contract.mintTo(account, tokenURI);
                const receipt = await tx.wait();
                
                // --- ROBUST TOKEN ID EXTRACTION LOGIC ---
                let tokenId = null;
                if (receipt && receipt.logs) {
                    const transferLogs = receipt.logs.filter(
                      (log) =>
                        log.address.toLowerCase() === contractAddress.toLowerCase() &&
                        log.topics[0] === ethers.id("Transfer(address,address,uint256)")
                    );
                    
                    if (transferLogs.length > 0) {
                        const parsedLog = contract.interface.parseLog(transferLogs[0]);
                        tokenId = parsedLog.args.tokenId.toString();
                    }
                }

                if (tokenId === null) {
                    throw new Error("Could not extract Token ID from transaction receipt.");
                }
                // --- END OF NEW LOGIC ---

                setLoadingText('Saving record to database...');
                const recordId = uuidv4();
                const recordRef = doc(db, 'records', recordId);
                await setDoc(recordRef, {
                    uid: currentUser.uid, wallet: account, tokenId: tokenId, txHash: receipt.hash,
                    contractAddress: contractAddress, chainId: '11155111', ...formData,
                    mimeType: fileUploadResponse.mimeType, fileCid: fileUploadResponse.cid,
                    ipfsFileUrl: fileUploadResponse.ipfsFileUrl, gatewayFileUrl: fileUploadResponse.gatewayFileUrl,
                    metadataCid: metadataUploadResponse.cid, ipfsMetadataUrl: metadataUploadResponse.ipfsUrl,
                    gatewayMetadataUrl: metadataUploadResponse.gatewayUrl, createdAt: serverTimestamp(),
                });
                
                resolve(`NFT minted successfully! Token ID: ${tokenId}`);
            } catch (error) {
                console.error("Minting failed:", error);
                reject(error.message || "An unknown error occurred during minting.");
            }
        });

        toast.promise(mintPromise, {
            loading: 'Minting process started...',
            success: (message) => message,
            error: (err) => `Minting failed: ${err}`,
        }).finally(() => {
            setLoading(false);
            setLoadingText('');
        });
    };

    return (
        <div className="form-container">
            {/* ... (rest of the JSX remains the same) */}
            <h2>Upload a New Health Record & Mint NFT</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Document Title *</label>
                    <input name="title" onChange={handleChange} className="form-control" placeholder="e.g., COVID-19 Vaccination" required />
                </div>
                <div className="form-group">
                    <label>Issuer *</label>
                    <input name="issuer" onChange={handleChange} className="form-control" placeholder="e.g., City General Hospital" required />
                </div>
                <div className="form-group">
                    <label>Date Issued *</label>
                    <input name="issuedDate" type="date" onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" onChange={handleChange} className="form-control" placeholder="Optional notes about the document"></textarea>
                </div>
                <div className="form-group">
                    <label>File (PDF, PNG, JPG) *</label>
                    <input type="file" onChange={handleFileChange} className="form-control" accept=".pdf,.png,.jpg,.jpeg" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                        <>
                            <div className="spinner" style={{width: '1rem', height: '1rem', marginRight: '8px'}}></div>
                            {loadingText}
                        </>
                    ) : 'Upload and Mint'}
                </button>
                {isConnected && !isSepolia && <p className="text-danger mt-2">Please switch to the Sepolia network to mint.</p>}
            </form>
        </div>
    );
};

export default UploadAndMint;