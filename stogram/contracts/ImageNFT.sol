// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC7007.sol";

contract OnChainImageNFT is ERC721Enumerable, Ownable, IERC7007 {
    struct Metadata {
        string image; // The image URL or Base64 string
        string name;
        string description;
    }

    // Mapping of tokenId to its metadata
    mapping(uint256 => Metadata) private tokenMetadata;

    // Event for metadata update
    event MetadataUpdated(uint256 tokenId, string image, string name, string description);

    constructor() ERC721("OnChainImageNFT", "OCNFT") {}

    /**
     * @dev Mints a new NFT with metadata stored on-chain.
     * @param to The address to receive the NFT.
     * @param image The image URL or Base64 string.
     * @param name The name of the NFT.
     * @param description The description of the NFT.
     */
    function mint(
        address to,
        string memory image,
        string memory name,
        string memory description
    ) external onlyOwner {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(to, tokenId);
        tokenMetadata[tokenId] = Metadata(image, name, description);
    }

    /**
     * @dev Updates the metadata of an existing token. Only callable by the owner.
     * @param tokenId The ID of the token to update.
     * @param image The new image URL or Base64 string.
     * @param name The new name.
     * @param description The new description.
     */
    function updateMetadata(
        uint256 tokenId,
        string memory image,
        string memory name,
        string memory description
    ) external onlyOwner {
        require(_exists(tokenId), "ERC721: Token does not exist");
        tokenMetadata[tokenId] = Metadata(image, name, description);
        emit MetadataUpdated(tokenId, image, name, description);
    }

    /**
     * @dev Returns metadata of a token as per ERC-7007.
     * @param tokenId The ID of the token.
     * @return metadata The metadata as a JSON string.
     */
    function tokenMetadataURI(uint256 tokenId) external view override returns (string memory metadata) {
        require(_exists(tokenId), "ERC721: Token does not exist");
        Metadata memory data = tokenMetadata[tokenId];
        return string(abi.encodePacked(
            '{',
            '"name": "', data.name, '",',
            '"description": "', data.description, '",',
            '"image": "', data.image, '"',
            '}'
        ));
    }

    /**
     * @dev Overrides the ERC721 `tokenURI` function to return on-chain metadata.
     * @param tokenId The ID of the token.
     * @return URI The metadata URI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return tokenMetadataURI(tokenId);
    }

    /**
     * @dev Supports interface override for ERC-7007 and ERC721Enumerable.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return interfaceId == type(IERC7007).interfaceId || super.supportsInterface(interfaceId);
    }
}
