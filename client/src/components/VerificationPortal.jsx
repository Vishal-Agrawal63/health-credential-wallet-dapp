import React, { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import contractAbi from '../abi/HealthCredentialNFT.json'; // Import ABI

// Use a public RPC URL for read-only actions so users don't need MetaMask
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;

const VerificationPortal = () => {
    const [formData, setFormData] = useState({ contractAddress: '', tokenId: '' });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const { contractAddress, tokenId } = formData;
        if (!ethers.isAddress(contractAddress) || !tokenId) {
            toast.error("Please enter a valid contract address and token ID.");
            setLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, provider);

            // Fetch all data in parallel
            const [owner, tokenURI, isRevoked, isExpired] = await Promise.all([
                contract.ownerOf(tokenId),
                contract.tokenURI(tokenId),
                contract.isRevoked(tokenId),
                contract.isExpired(tokenId),
            ]);
            
            const metadataResponse = await fetch(tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
            if (!metadataResponse.ok) throw new Error("Could not fetch metadata from IPFS.");
            const metadata = await metadataResponse.json();

            let finalStatus = "Valid";
            if(isRevoked) finalStatus = "Revoked";
            else if(isExpired) finalStatus = "Expired";
            
            setResult({
                status: finalStatus,
                owner,
                metadata
            });

        } catch (error) {
            console.error("Verification failed:", error);
            setResult({ status: 'Invalid', error: "Could not verify this credential. It may not exist or the contract address is wrong." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container" style={{ maxWidth: '600px' }}>
                <h1 style={{fontSize: '1.5rem'}}>Credential Verification</h1>
                <p>Check the authenticity and status of a Health Credential NFT.</p>

                <form onSubmit={handleVerify}>
                    <div className="form-group">
                        <label>Contract Address</label>
                        <input name="contractAddress" value={formData.contractAddress} onChange={handleChange} className="form-control" required />
                    </div>
                    <div className="form-group">
                        <label>Token ID</label>
                        <input name="tokenId" value={formData.tokenId} onChange={handleChange} className="form-control" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                {result && (
                    <div className="verification-result">
                        <hr />
                        <h3>Verification Result</h3>
                        <div className={`status-banner status-${result.status.toLowerCase()}`}>
                            Status: {result.status}
                        </div>
                        {result.status !== 'Invalid' ? (
                            <div className="result-details">
                                <p><strong>Title:</strong> {result.metadata.title}</p>
                                <p><strong>Issuer:</strong> {result.metadata.issuer}</p>
                                <p><strong>Date Issued:</strong> {result.metadata.issuedDate}</p>
                                <p><strong>Owned By:</strong> {result.owner}</p>
                                <a href={result.metadata.gatewayFileUrl || result.metadata.ipfsFileUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")} target="_blank" rel="noopener noreferrer">View Original Document</a>
                            </div>
                        ) : (
                            <p className="error-message">{result.error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationPortal;