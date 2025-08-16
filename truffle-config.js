// PATH FROM REPO ROOT: /truffle-config.js
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*", // Match any network id
        },
        sepolia: {
            provider: () => new HDWalletProvider(DEPLOYER_PRIVATE_KEY, SEPOLIA_RPC_URL),
            network_id: 11155111, // Sepolia's network ID
            confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
            timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
        },
    },
    compilers: {
        solc: {
            version: "0.8.21", // Fetch exact version from solc-bin (default: truffle's version)
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    },
    plugins: [
        'truffle-plugin-verify'
    ],
    api_keys: {
        // Add Etherscan API key for contract verification
        // etherscan: process.env.ETHERSCAN_API_KEY 
    }
};