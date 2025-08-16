// PATH FROM REPO ROOT: /client/src/components/WalletConnect.jsx
import React from 'react';
import { useWeb3 } from '../lib/web3';

const WalletConnect = () => {
    const { connectWallet, disconnectWallet, isConnected, account, network, isSepolia, switchNetwork } = useWeb3();

    if (!isConnected) {
        return <button onClick={connectWallet} className="btn btn-primary">Connect Wallet</button>;
    }
    
    return (
        <div>
            <span>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
                ({network?.name})
            </span>
            {!isSepolia && (
                 <button onClick={switchNetwork} className="btn btn-warning btn-sm" style={{marginLeft: '8px'}}>Switch to Sepolia</button>
            )}
            <button onClick={disconnectWallet} className="btn btn-secondary btn-sm" style={{marginLeft: '8px'}}>Disconnect</button>
        </div>
    );
};

export default WalletConnect;