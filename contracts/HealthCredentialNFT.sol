// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HealthCredentialNFT
 * @dev An ERC721 token for minting and revoking health credentials.
 */
contract HealthCredentialNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to its expiration Unix timestamp.
    mapping(uint256 => uint256) private _expirationTimestamps;
    
    // --- NEW: Add a mapping to track revoked tokens ---
    mapping(uint256 => bool) private _isRevoked;

    // --- NEW: Add an event to announce revocations ---
    event CredentialRevoked(uint256 indexed tokenId);

    /**
     * @dev Sets the contract name, symbol, and initial owner.
     */
    constructor(address initialOwner)
        ERC721("Health Credential NFT", "HCNFT")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new token and assigns it to `to`, with an expiration date.
     * Can only be called by the contract owner.
     */
    function mintTo(address to, string memory tokenURI, uint256 expirationTimestamp) public onlyOwner returns (uint256) {
        require(expirationTimestamp > block.timestamp, "Expiration must be in the future");
        
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _expirationTimestamps[tokenId] = expirationTimestamp;
        _tokenIdCounter += 1;
        
        return tokenId;
    }

    // --- NEW: Create the revoke function ---
    /**
     * @dev Revokes a token, marking it as invalid.
     * Can only be called by the contract owner.
     * @param tokenId The ID of the token to revoke.
     */
    function revoke(uint256 tokenId) public onlyOwner {
        // Ensure the token exists before revoking
        ownerOf(tokenId); 
        _isRevoked[tokenId] = true;
        emit CredentialRevoked(tokenId);
    }
    
    /**
     * @dev Returns the Unix timestamp for when a token expires.
     */
    function getExpirationTimestamp(uint256 tokenId) public view returns (uint256) {
        ownerOf(tokenId); 
        return _expirationTimestamps[tokenId];
    }
    
    /**
     * @dev Checks if a credential has expired.
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        ownerOf(tokenId);
        uint256 expiration = _expirationTimestamps[tokenId];
        return expiration > 0 && block.timestamp >= expiration;
    }

    // --- NEW: Create a public view function to check revocation status ---
    /**
     * @dev Checks if a credential has been revoked.
     * @param tokenId The ID of the token to check.
     * @return True if the token has been revoked.
     */
    function isRevoked(uint256 tokenId) public view returns (bool) {
        ownerOf(tokenId);
        return _isRevoked[tokenId];
    }

    /**
     * @dev Base URI for computing `tokenURI`.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
}