# Health Credential Wallet dApp

This is a full-stack decentralized application (dApp) for managing personal health credentials as NFTs on the Ethereum blockchain. It uses Firebase for user authentication and data management, Pinata for decentralized file storage on IPFS, and a Solidity smart contract on the Sepolia testnet.

## Features

- **Google Authentication**: Easy and secure login/signup via Firebase.
- **User Profiles**: Manage personal information linked to your account.
- **MetaMask Integration**: Connect your Ethereum wallet to interact with the blockchain.
- **Sepolia Network Support**: All blockchain operations are on the Sepolia testnet.
- **Decentralized File Storage**: Health documents (PDF, PNG, JPG) are uploaded to IPFS via Pinata.
- **NFT Minting**: Each uploaded document is minted as a unique ERC721 NFT, with metadata also stored on IPFS.
- **Secure Backend**: A Node.js/Express server handles file uploads to prevent client-side exposure of API keys.
- **Record Management**: View, download, and share your health credentials from a personal dashboard.

## Tech Stack

- **Frontend**: React, Vite, React Router, ethers.js, Firebase SDK
- **Backend**: Node.js, Express, Multer, Firebase Admin
- **Smart Contract**: Solidity, OpenZeppelin, Truffle
- **Blockchain**: Sepolia Testnet (via Infura/Alchemy)
- **Storage**: IPFS (via Pinata)
- **Database**: Firestore

---

## 🚀 Step-by-Step Setup & Run Guide

### Prerequisites

1.  **Node.js**: v18 or later.
2.  **MetaMask**: Browser extension installed.
3.  **Truffle**: `npm install -g truffle`
4.  **Firebase Project**: Create a new project at [firebase.google.com](https://firebase.google.com).
5.  **Pinata Account**: Create a new account at [pinata.cloud](https://pinata.cloud).
6.  **Infura/Alchemy Account**: For an Ethereum RPC URL.

### Step 1: Clone the Repository

```bash
git clone <repository_url>
cd health-credential-wallet-dapp


Step 2: Install Dependencies
# from the project root
npm install        # installs root dependencies
cd client && npm install
cd ../server && npm install

next step:
After that you need to make the below file:
    
health-credential-wallet-dapp\.env:
    ```
    DEPLOYER_PRIVATE_KEY=
    SEPOLIA_RPC_URL=    
    ```
health-credential-wallet-dapp\client\.env.local
    ```
    # health-credential-wallet-dapp/client/.env.local
    # Firebase Web App Config
    VITE_FIREBASE_API_KEY=
    VITE_FIREBASE_AUTH_DOMAIN=
    VITE_FIREBASE_PROJECT_ID=
    VITE_FIREBASE_STORAGE_BUCKET=
    VITE_FIREBASE_MESSAGING_SENDER_ID=
    VITE_FIREBASE_APP_ID=

    # Server & Contract
    VITE_SERVER_URL=""
    VITE_CONTRACT_ADDRESS= # Add this after deployment in Step 5

    # Pinata API Keys for JSON metadata upload (alternative to backend proxy for JSON)
    # For better security, proxy JSON uploads too. For simplicity, we can use keys on client.
    VITE_PINATA_JWT_FOR_JSON=

    # IPFS Gateway
    VITE_IPFS_GATEWAY=""
    ```
    
    health-credential-wallet-dapp\server\.env:
    ```
    
    PORT=3001
    CLIENT_URL="http://localhost:5173"

    # Pinata API Key (JWT)
    PINATA_JWT=""

    # Your preferred IPFS Gateway
    IPFS_GATEWAY=""

    # Firebase Admin SDK credentials (Base64 encoded)
    # 1. Generate a new private key in your Firebase project settings.
    # 2. Base64 encode the entire JSON file content.
    # 3. Paste the Base64 string here.
    # Example command: base64 -i /path/to/your/serviceAccountKey.json | pbcopy
    FIREBASE_SERVICE_ACCOUNT_BASE64=""
    
    # Optional: Set to 'true' to enforce server-side authentication
    ENABLE_FIREBASE_TOKEN_VERIFICATION='false'  
    ```

step 3: truffle compile
    truffle migrate --network sepolia
    
    change the value of 'VITE_CONTRACT_ADDRESS' in this file "client\.env.local"

    copy "build\contracts\HealthCredentialNFT.json"
    paste inside "client\src\abi\HealthCredentialNFT.json"
    

Step 4: Run the Application
# from the project root
npm run dev
