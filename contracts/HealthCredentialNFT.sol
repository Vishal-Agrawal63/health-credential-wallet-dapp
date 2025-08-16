// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HealthCredentialNFT
 * @dev An ERC721 token for minting health credentials as NFTs.
 * Each token URI points to a JSON metadata file on IPFS.
 * The contract owner has the exclusive right to mint new tokens.
 */
contract HealthCredentialNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    /**
     * @dev Sets the contract name, symbol, and initial owner.
     */
    constructor(address initialOwner)
        ERC721("Health Credential NFT", "HCNFT")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mints a new token and assigns it to `to`.
     * The token URI is set to the IPFS metadata URL.
     * Can only be called by the contract owner.
     * @param to The address to receive the new NFT.
     * @param tokenURI The URI of the token's metadata JSON file on IPFS.
     * @return The ID of the newly minted token.
     */
    function mintTo(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter += 1;
        return tokenId;
    }

    /**
     * @dev Base URI for computing `tokenURI`. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     * Overridden to be empty as we use the full `tokenURI` in `_setTokenURI`.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }
}
