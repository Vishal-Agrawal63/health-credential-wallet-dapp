// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HealthCredentialNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // --- MAPPING FOR REVOCATION ---
    mapping(uint256 => bool) private _revokedTokens;

    // --- MAPPING FOR EXPIRATION ---
    mapping(uint256 => uint256) public expirationTimestamps;

    // --- EVENTS ---
    event CredentialRevoked(uint256 indexed tokenId);
    event CredentialIssued(uint256 indexed tokenId, uint256 expirationTimestamp);


    constructor(address initialOwner)
        ERC721("Health Credential NFT", "HCNFT")
        Ownable(initialOwner)
    {}

    /**
     * @dev UPDATED: Now accepts an expiration timestamp.
     */
    function mintTo(address to, string memory tokenURI, uint256 expirationTimestamp) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        if (expirationTimestamp > 0) {
            expirationTimestamps[tokenId] = expirationTimestamp;
        }

        _tokenIdCounter += 1;
        emit CredentialIssued(tokenId, expirationTimestamp);
        return tokenId;
    }

    /**
     * --- FUNCTION TO REVOKE A CREDENTIAL ---
     */
    function revoke(uint256 tokenId) public onlyOwner {
        // --- CORRECTED: Use the public ownerOf function to ensure the token exists. ---
        // This will automatically revert with an "ERC721NonexistentToken" error if the tokenId
        // has not been minted, which is the desired behavior.
        ownerOf(tokenId);
        
        _revokedTokens[tokenId] = true;
        emit CredentialRevoked(tokenId);
    }

    /**
     * --- PUBLIC VIEW FUNCTION TO CHECK REVOCATION STATUS ---
     */
    function isRevoked(uint256 tokenId) public view returns (bool) {
        return _revokedTokens[tokenId];
    }

    /**
     * --- PUBLIC VIEW FUNCTION TO CHECK EXPIRATION STATUS ---
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        uint256 expiration = expirationTimestamps[tokenId];
        return expiration != 0 && expiration < block.timestamp;
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
}