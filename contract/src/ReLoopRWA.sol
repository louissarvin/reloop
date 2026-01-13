// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReLoopRWA is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint8 public constant MAX_DEPTH = 5;
    uint16 public constant BASIS_POINTS = 10000;
    uint16 public constant PLATFORM_FEE_BPS = 150;
    uint16 public constant SPLIT_CAP_PER_DEPTH_BPS = 400; // 4% per depth level

    struct OwnerRecord {
        address owner;
        uint256 purchasePrice;
        uint256 timestamp;
    }

    struct TokenConfig {
        uint8 depth;
        uint16[] profitSplitsBps;
        bool isConfigured;
    }

    address public marketplace;
    uint256 private _nextTokenId;

    mapping(uint256 => TokenConfig) private _tokenConfigs;
    mapping(uint256 => OwnerRecord[]) private _ownerHistory;

    event TokenMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint8 depth,
        uint16[] profitSplitsBps
    );
    event MarketplaceUpdated(address indexed oldMarketplace, address indexed newMarketplace);
    event OwnerHistoryUpdated(uint256 indexed tokenId, address indexed newOwner, uint256 purchasePrice);

    error InvalidDepth(uint8 provided, uint8 max);
    error InvalidProfitSplits();
    error SplitsExceedTieredCap(uint256 totalSplits, uint256 maxAllowed);
    error TotalSplitsExceedLimit();
    error OnlyMarketplace();
    error TokenNotConfigured(uint256 tokenId);
    error MarketplaceNotSet();

    modifier onlyMarketplace() {
        if (msg.sender != marketplace) revert OnlyMarketplace();
        _;
    }

    constructor(address initialOwner) ERC721("ReLoop RWA", "RELOOP") Ownable(initialOwner) {}

    function setMarketplace(address _marketplace) external onlyOwner {
        address old = marketplace;
        marketplace = _marketplace;
        emit MarketplaceUpdated(old, _marketplace);
    }

    /**
     * @notice Get the maximum allowed split percentage for a given depth
     * @param depth The depth level (0-5)
     * @return maxSplitBps Maximum total split in basis points (depth * 400)
     */
    function getMaxSplitForDepth(uint8 depth) public pure returns (uint16 maxSplitBps) {
        return depth * SPLIT_CAP_PER_DEPTH_BPS;
    }

    /**
     * @notice Mint a new RWA token with tiered profit split configuration
     * @dev Depth 0 = no cascade (simple sale), Depth 1-5 = cascade with tiered caps
     *      Max split allowed = depth * 4% (e.g., depth 3 = max 12%)
     * @param to Address to mint the token to
     * @param uri Token metadata URI
     * @param depth Number of generations for profit sharing (0-5)
     * @param profitSplitsBps Basis points for each generation (must sum to <= depth * 400)
     */
    function mint(
        address to,
        string calldata uri,
        uint8 depth,
        uint16[] calldata profitSplitsBps
    ) external nonReentrant returns (uint256 tokenId) {
        // Validate depth (0-5 allowed)
        if (depth > MAX_DEPTH) {
            revert InvalidDepth(depth, MAX_DEPTH);
        }

        // Validate splits array length matches depth
        if (profitSplitsBps.length != depth) {
            revert InvalidProfitSplits();
        }

        // Calculate total splits
        uint256 totalSplits = 0;
        for (uint256 i = 0; i < profitSplitsBps.length; i++) {
            totalSplits += profitSplitsBps[i];
        }

        // Validate against tiered cap: max = depth * 4%
        uint256 maxAllowedSplits = uint256(depth) * SPLIT_CAP_PER_DEPTH_BPS;
        if (totalSplits > maxAllowedSplits) {
            revert SplitsExceedTieredCap(totalSplits, maxAllowedSplits);
        }

        // Validate total doesn't exceed 100% (platform fee + splits)
        if (totalSplits + PLATFORM_FEE_BPS > BASIS_POINTS) {
            revert TotalSplitsExceedLimit();
        }

        tokenId = ++_nextTokenId;

        _tokenConfigs[tokenId] = TokenConfig({
            depth: depth,
            profitSplitsBps: profitSplitsBps,
            isConfigured: true
        });

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Initialize owner history with minter
        _ownerHistory[tokenId].push(OwnerRecord({
            owner: to,
            purchasePrice: 0,
            timestamp: block.timestamp
        }));

        emit TokenMinted(tokenId, to, depth, profitSplitsBps);
    }

    /**
     * @notice Record a new owner after a sale (called by marketplace only)
     * @param tokenId The token that was sold
     * @param newOwner The new owner address
     * @param purchasePrice The price paid for the token
     */
    function recordSale(
        uint256 tokenId,
        address newOwner,
        uint256 purchasePrice
    ) external onlyMarketplace {
        if (!_tokenConfigs[tokenId].isConfigured) {
            revert TokenNotConfigured(tokenId);
        }

        TokenConfig storage config = _tokenConfigs[tokenId];
        OwnerRecord[] storage history = _ownerHistory[tokenId];

        // For depth 0, we still track current owner but no cascade history needed
        // For depth > 0, cap history at depth + 1
        uint256 maxHistoryLength = config.depth == 0 ? 1 : config.depth + 1;

        if (history.length >= maxHistoryLength) {
            // Shift array: remove oldest (index 0) and append new
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }

        // Add new owner record
        history.push(OwnerRecord({
            owner: newOwner,
            purchasePrice: purchasePrice,
            timestamp: block.timestamp
        }));

        emit OwnerHistoryUpdated(tokenId, newOwner, purchasePrice);
    }

    // ============ View Functions ============

    /**
     * @notice Get token configuration
     * @param tokenId The token ID to query
     */
    function getTokenConfig(uint256 tokenId) external view returns (
        uint8 depth,
        uint16[] memory profitSplitsBps,
        uint16 platformFeeBps,
        bool isConfigured
    ) {
        TokenConfig storage config = _tokenConfigs[tokenId];
        return (config.depth, config.profitSplitsBps, PLATFORM_FEE_BPS, config.isConfigured);
    }

    /**
     * @notice Get ownership history for a token
     * @param tokenId The token ID to query
     * @return history Array of OwnerRecord structs
     */
    function getOwnerHistory(uint256 tokenId) external view returns (OwnerRecord[] memory) {
        return _ownerHistory[tokenId];
    }

    /**
     * @notice Get the last purchase price for a token
     * @param tokenId The token ID to query
     * @return price The last recorded purchase price
     */
    function getLastPurchasePrice(uint256 tokenId) external view returns (uint256 price) {
        OwnerRecord[] storage history = _ownerHistory[tokenId];
        if (history.length == 0) return 0;
        return history[history.length - 1].purchasePrice;
    }

    /**
     * @notice Get previous owners eligible for profit sharing
     * @dev Returns owners excluding current owner, ordered from most recent to oldest
     * @param tokenId The token ID to query
     * @return owners Array of previous owner addresses
     * @return prices Array of purchase prices corresponding to each owner
     */
    function getPreviousOwnersForProfit(uint256 tokenId) external view returns (
        address[] memory owners,
        uint256[] memory prices
    ) {
        OwnerRecord[] storage history = _ownerHistory[tokenId];

        // If only 1 owner (minter) or depth 0, no previous owners for profit
        if (history.length <= 1) {
            return (new address[](0), new uint256[](0));
        }

        // Exclude the last entry (current owner)
        uint256 count = history.length - 1;
        owners = new address[](count);
        prices = new uint256[](count);

        // Fill in reverse order (most recent previous owner first)
        for (uint256 i = 0; i < count; i++) {
            uint256 historyIndex = history.length - 2 - i;
            owners[i] = history[historyIndex].owner;
            prices[i] = history[historyIndex].purchasePrice;
        }
    }

    /**
     * @notice Get the current token ID counter
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ Overrides ============

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
