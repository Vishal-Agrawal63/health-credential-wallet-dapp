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
 * Uploads JSON metadata to Pinata.
 * @param {object} content The JSON object to pin.
 * @param {string} name The desired filename for the JSON on Pinata.
 * @returns {Promise<object>} The response from Pinata containing IPFS data.
 */
export const uploadJsonToIPFS = async (content, name) => {
    const pinataJwt = import.meta.env.VITE_PINATA_JWT_FOR_JSON;
    if (!pinataJwt) {
        throw new Error("Pinata JWT for JSON not found in .env file.");
    }

    const data = JSON.stringify({
        pinataContent: content,
        pinataMetadata: {
            name: name, // Use the provided name for the file on Pinata
        },
        pinataOptions: {
            cidVersion: 1
        }
    });

    try {
        const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
            headers: {
                'Content-Type': 'application/json', // Set correct content type
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
        console.error('Error uploading JSON to Pinata:', error.response ? error.response.data : error.message);
        throw new Error('Failed to pin metadata to IPFS.');
    }
};