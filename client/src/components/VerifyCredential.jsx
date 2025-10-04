import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import contractAbi from '../abi/HealthCredentialNFT.json';
import { Link } from 'react-router-dom';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

const VerifyCredential = () => {
    const [tokenId, setTokenId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [credential, setCredential] = useState(null);

    const resolveIpfsUrl = (ipfsUrl) => {
        if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return null;
        return ipfsUrl.replace('ipfs://', ipfsGateway);
    };
    
    const truncateHash = (hash) => {
        if (!hash) return '...';
        return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tokenId.trim()) {
            setError("Please enter a Token ID.");
            return;
        }
        
        setLoading(true);
        setError(null);
        setCredential(null);

        try {
            if (!sepoliaRpcUrl) {
                throw new Error("Sepolia RPC URL is not configured in environment variables.");
            }
            const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
            const contract = new ethers.Contract(contractAddress, contractAbi.abi, provider);

            const ownerAddress = await contract.ownerOf(tokenId);
            const tokenURI = await contract.tokenURI(tokenId);
            const isExpiredOnChain = await contract.isExpired(tokenId);
            const isRevokedOnChain = await contract.isRevoked(tokenId);
            
            const metadataUrl = resolveIpfsUrl(tokenURI);
            if (!metadataUrl) throw new Error("Invalid IPFS metadata URL found on-chain.");
            
            const metadataResponse = await axios.get(metadataUrl);
            const metadata = metadataResponse.data;

            setCredential({
                tokenId,
                ownerAddress,
                isExpired: isExpiredOnChain,
                isRevoked: isRevokedOnChain,
                metadata,
            });

        } catch (err) {
            console.error("Verification failed:", err);
            if (err.message.includes('ERC721NonexistentToken')) {
                setError(`Credential with Token ID #${tokenId} not found.`);
            } else {
                setError("An error occurred during verification. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container" style={{maxWidth: '600px'}}>
                <h1 style={{fontSize: '1.5rem', marginBottom: '0.25rem'}}>Public Credential Verification</h1>
                <p>Enter a Token ID to verify its authenticity and status directly on the blockchain.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="tokenId">Token ID</label>
                        <input type="number" id="tokenId" value={tokenId} onChange={(e) => setTokenId(e.target.value)} className="form-control" placeholder="e.g., 0" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify Credential'}
                    </button>
                </form>

                {error && <p style={{color: 'var(--danger-color)', marginTop: '1rem'}}>{error}</p>}
                
                {credential && (
                    <div className={`credential-card ${credential.isRevoked ? 'revoked' : ''} ${credential.isExpired ? 'expired' : ''}`} style={{marginTop: '2rem', textAlign: 'left'}}>
                        <div className="card-header">
                            Verification Result
                            {credential.isRevoked && <span className="revoked-badge">REVOKED</span>}
                            {!credential.isRevoked && credential.isExpired && <span className="expired-badge">EXPIRED</span>}
                            {!credential.isRevoked && !credential.isExpired && <span className="valid-badge">VALID</span>}
                        </div>
                        <div className="card-body">
                             <div className="section-title">Document Info</div>
                             <div className="data-row"><span className="icon">📎</span><span className="label">Title:</span><span className="value">{credential.metadata.title}</span></div>
                             <div className="data-row"><span className="icon">🏥</span><span className="label">Issuer:</span><span className="value">{credential.metadata.issuer}</span></div>
                             <div className="data-row"><span className="icon">🗓️</span><span className="label">Issued:</span><span className="value">{new Date(credential.metadata.issuedDate).toLocaleDateString()}</span></div>
                            {credential.metadata.expiryDate && (
                                <div className="data-row">
                                    <span className="icon">⏳</span><span className="label">Expires:</span>
                                    <span className={`value ${credential.isRevoked ? 'revoked-text' : ''} ${credential.isExpired ? 'expired-text' : ''}`}>{new Date(credential.metadata.expiryDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            <hr />
                            <div className="section-title">Blockchain Data</div>
                            <div className="data-row"><span className="icon">📦</span><span className="label">Token ID:</span><span className="value">#{credential.tokenId}</span></div>
                            <div className="data-row"><span className="icon">👤</span><span className="label">Owner:</span><span className="value">{truncateHash(credential.ownerAddress)}</span></div>
                            <div className="data-row"><span className="icon">🔗</span><span className="label">Contract:</span><span className="value">{truncateHash(contractAddress)}</span></div>
                        </div>
                        <div className="card-footer actions">
                            <a href={resolveIpfsUrl(credential.metadata.ipfsFileUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-info">View Original Document</a>
                        </div>
                    </div>
                )}
                 <p className="switch-auth">
                    <Link to="/login">Return to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyCredential;