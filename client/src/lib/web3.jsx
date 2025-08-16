// PATH FROM REPO ROOT: /client/src/lib/web3.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useAuth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

// --- FIX 1: DEFINE BOTH HEX AND DECIMAL CONSTANTS FOR CLARITY ---
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const SEPOLIA_CHAIN_ID_DECIMAL = '11155111';

const SEPOLIA_NETWORK_INFO = {
    chainId: SEPOLIA_CHAIN_ID_HEX,
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [network, setNetwork] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { currentUser, db } = useAuth();

    // --- FIX 3: REFACTOR SWITCHNETWORK TO ACCEPT A PROVIDER ARGUMENT ---
    // This avoids stale state issues when called immediately after connection.
    const switchNetwork = async (currentProvider) => {
        const providerToUse = currentProvider || provider;
        if (!providerToUse) {
            toast.error('Cannot switch network, wallet provider not available.');
            return;
        }
        try {
            await providerToUse.send('wallet_switchEthereumChain', [{ chainId: SEPOLIA_CHAIN_ID_HEX }]);
            toast.success('Switched to Sepolia Network');
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await providerToUse.send('wallet_addEthereumChain', [SEPOLIA_NETWORK_INFO]);
                } catch (addError) {
                    console.error('Failed to add Sepolia network:', addError);
                    toast.error('Failed to add Sepolia network.');
                }
            } else {
                console.error('Failed to switch network:', switchError);
                toast.error('Failed to switch network.');
            }
        }
    };

    const connectWallet = async () => {
        if (isConnected) return true;

        if (typeof window.ethereum === 'undefined') {
            toast.error('MetaMask is not installed!');
            return false;
        }

        try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            
            const accounts = await web3Provider.send('eth_requestAccounts', []);
            const currentAccount = accounts[0];
            setAccount(currentAccount);

            const web3Signer = await web3Provider.getSigner();
            setSigner(web3Signer);

            const net = await web3Provider.getNetwork();
            setNetwork(net);

            setIsConnected(true);
            toast.success('Wallet connected!');
            
            if (currentUser) {
                 const userRef = doc(db, 'users', currentUser.uid);
                 await updateDoc(userRef, { walletAddress: currentAccount });
            }

            // Use the correct decimal comparison here
            if (net.chainId.toString() !== SEPOLIA_CHAIN_ID_DECIMAL) {
                // Pass the newly created provider directly to avoid stale state
                await switchNetwork(web3Provider);
            }
            
            return true;

        } catch (error) {
            console.error('Failed to connect wallet:', error);
            toast.error(error.message || 'Failed to connect wallet.');
            return false;
        }
    };

    const disconnectWallet = () => {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setNetwork(null);
        setIsConnected(false);
        toast('Wallet disconnected.');
    };

    useEffect(() => {
        const handleAccountsChanged = async (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else if (accounts[0] !== account) {
                connectWallet(); // The simplest way to handle account switch is to just re-run connect
            }
        };

        const handleChainChanged = () => {
             window.location.reload();
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [account, provider, currentUser]);

    const value = {
        provider,
        signer,
        account,
        network,
        isConnected,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        // --- FIX 2: USE THE CORRECT DECIMAL COMPARISON ---
        isSepolia: network?.chainId.toString() === SEPOLIA_CHAIN_ID_DECIMAL
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};