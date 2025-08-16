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


Step 3: Run the Application
# from the project root
npm run dev
