// PATH FROM REPO ROOT: /client/src/lib/ipfs.js
import axios from 'axios';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

/**
 * Uploads a file to the backend server, which then pins it to Pinata (IPFS).
 * @param {File} file The file to upload.
 * @param {string} idToken Firebase authentication token.
 * @returns {Promise<object>} The response from the server containing IPFS data.
 */
export const uploadFileToIPFS = async (file, idToken) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
    }

    try {
        const response = await axios.post(`${serverUrl}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...headers,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error.response?.data?.error || error.message);
        throw new Error(error.response?.data?.error || "File upload failed.");
    }
};

/**
 * Uploads JSON metadata to Pinata directly (less secure, used for simplicity).
 * In a production-level app, this should also go through the backend.
 * @param {object} metadata The JSON object to pin.
 * @returns {Promise<object>} The response from Pinata containing IPFS data.
 */
export const uploadJsonToIPFS = async (metadata) => {
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
        // Fallback to JWT if direct keys are not provided
        const pinataJwt = import.meta.env.VITE_PINATA_JWT_FOR_JSON;
        if (!pinataJwt) throw new Error("Pinata API credentials not found in .env file.");

        try {
            const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
                headers: {
                    'Authorization': `Bearer ${pinataJwt}`
                }
            });
            const cid = response.data.IpfsHash;
            const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
            return {
                cid: cid,
                ipfsUrl: `ipfs://${cid}`,
                gatewayUrl: `${ipfsGateway}${cid}`
            };
        } catch (error) {
            console.error('Error uploading JSON to Pinata with JWT:', error.response ? error.response.data : error.message);
            throw new Error('Failed to pin metadata to IPFS.');
        }

    }

    console.warn("Using direct API keys for JSON upload. For enhanced security, proxy this through your backend.");

    try {
        const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });
        const cid = response.data.IpfsHash;
        const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        return {
            cid: cid,
            ipfsUrl: `ipfs://${cid}`,
            gatewayUrl: `${ipfsGateway}${cid}`
        };
    } catch (error) {
        console.error('Error uploading JSON to Pinata:', error.response ? error.response.data : error.message);
        throw new Error('Failed to pin metadata to IPFS.');
    }
};