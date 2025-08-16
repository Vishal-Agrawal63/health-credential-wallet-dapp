// PATH FROM REPO ROOT: /migrations/2_deploy_HealthCredentialNFT.js
const HealthCredentialNFT = artifacts.require("HealthCredentialNFT");

module.exports = function (deployer, network, accounts) {
    // The deployer address will be the initial owner of the contract
    const ownerAddress = accounts[0];
    deployer.deploy(HealthCredentialNFT, ownerAddress);
};