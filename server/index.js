// PATH FROM REPO ROOT: /server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import { admin } from './firebaseAdmin.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false);
        }
    }
});

// Optional: Firebase ID Token Verification Middleware
const verifyFirebaseToken = async (req, res, next) => {
    if (process.env.ENABLE_FIREBASE_TOKEN_VERIFICATION !== 'true') {
        return next();
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return res.status(403).json({ error: 'Unauthorized: No Firebase ID token was provided.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        res.status(403).json({ error: 'Unauthorized: Invalid Firebase ID token.' });
    }
};

app.post('/upload', verifyFirebaseToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const formData = new FormData();
        const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', fileBlob, req.file.originalname);

        const pinataMetadata = JSON.stringify({ name: req.file.originalname });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({ cidVersion: 1 });
        formData.append('pinataOptions', pinataOptions);

        const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                ...formData.getHeaders ? formData.getHeaders() : { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` },
            },
        });

        const cid = response.data.IpfsHash;
        const ipfsGateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

        res.status(200).json({
            cid: cid,
            ipfsFileUrl: `ipfs://${cid}`,
            gatewayFileUrl: `${ipfsGateway}${cid}`,
            mimeType: req.file.mimetype
        });

    } catch (error) {
        console.error('Error uploading to Pinata:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to upload file to IPFS.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});