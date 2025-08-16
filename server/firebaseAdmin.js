// PATH FROM REPO ROOT: /server/firebaseAdmin.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Important: Encode the private key when storing it in .env
const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export { admin };