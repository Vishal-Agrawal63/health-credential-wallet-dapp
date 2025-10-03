// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HealthCredentialNFT
 * @dev An ERC721 token for minting health credentials with expiration dates.
 */
contract HealthCredentialNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to its expiration Unix timestamp.
    mapping(uint256 => uint256) private _expirationTimestamps;

    /**
     * @dev Sets the contract name, symbol, and initial owner.
     */
    constructor(address initialOwner)
        ERC721("Health Credential NFT", "HCNFT")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new token and assigns it to `to`, with an expiration date.
     * The token URI is set to the IPFS metadata URL.
     * Can only be called by the contract owner.
     * @param to The address to receive the new NFT.
     * @param tokenURI The URI of the token's metadata JSON file on IPFS.
     * @param expirationTimestamp The Unix timestamp when the credential expires.
     * @return The ID of the newly minted token.
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

    /**
     * @dev Returns the Unix timestamp for when a token expires.
     * @param tokenId The ID of the token to query.
     * @return The expiration timestamp. Returns 0 if not set.
     */
    function getExpirationTimestamp(uint256 tokenId) public view returns (uint256) {
        // --- FIX: Use ownerOf to ensure the token exists. It will revert if it doesn't. ---
        ownerOf(tokenId); 
        return _expirationTimestamps[tokenId];
    }
    
    /**
     * @dev Checks if a credential has expired.
     * @param tokenId The ID of the token to check.
     * @return True if the current block timestamp is after the expiration timestamp.
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        // --- FIX: Use ownerOf to ensure the token exists. It will revert if it doesn't. ---
        ownerOf(tokenId);
        uint256 expiration = _expirationTimestamps[tokenId];
        return expiration > 0 && block.timestamp >= expiration;
    }

    /**
     * @dev Base URI for computing `tokenURI`. Overridden to be empty.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
}