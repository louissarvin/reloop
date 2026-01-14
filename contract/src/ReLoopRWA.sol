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
    uint16 public constant SPLIT_CAP_PER_DEPTH_BPS = 400; 

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

    function getMaxSplitForDepth(uint8 depth) public pure returns (uint16 maxSplitBps) {
        return depth * SPLIT_CAP_PER_DEPTH_BPS;
    }

    function mint(
        address to,
        string calldata uri,
        uint8 depth,
        uint16[] calldata profitSplitsBps
    ) external nonReentrant returns (uint256 tokenId) {
        if (depth > MAX_DEPTH) {
            revert InvalidDepth(depth, MAX_DEPTH);
        }

        if (profitSplitsBps.length != depth) {
            revert InvalidProfitSplits();
        }

        uint256 totalSplits = 0;
        for (uint256 i = 0; i < profitSplitsBps.length; i++) {
            totalSplits += profitSplitsBps[i];
        }

        uint256 maxAllowedSplits = uint256(depth) * SPLIT_CAP_PER_DEPTH_BPS;
        if (totalSplits > maxAllowedSplits) {
            revert SplitsExceedTieredCap(totalSplits, maxAllowedSplits);
        }

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

        _ownerHistory[tokenId].push(OwnerRecord({
            owner: to,
            purchasePrice: 0,
            timestamp: block.timestamp
        }));

        emit TokenMinted(tokenId, to, depth, profitSplitsBps);
    }

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

        uint256 maxHistoryLength = config.depth == 0 ? 1 : config.depth + 1;

        if (history.length >= maxHistoryLength) {
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }

        history.push(OwnerRecord({
            owner: newOwner,
            purchasePrice: purchasePrice,
            timestamp: block.timestamp
        }));

        emit OwnerHistoryUpdated(tokenId, newOwner, purchasePrice);
    }

    function getTokenConfig(uint256 tokenId) external view returns (
        uint8 depth,
        uint16[] memory profitSplitsBps,
        uint16 platformFeeBps,
        bool isConfigured
    ) {
        TokenConfig storage config = _tokenConfigs[tokenId];
        return (config.depth, config.profitSplitsBps, PLATFORM_FEE_BPS, config.isConfigured);
    }

    function getOwnerHistory(uint256 tokenId) external view returns (OwnerRecord[] memory) {
        return _ownerHistory[tokenId];
    }

    function getLastPurchasePrice(uint256 tokenId) external view returns (uint256 price) {
        OwnerRecord[] storage history = _ownerHistory[tokenId];
        if (history.length == 0) return 0;
        return history[history.length - 1].purchasePrice;
    }

    function getPreviousOwnersForProfit(uint256 tokenId) external view returns (
        address[] memory owners,
        uint256[] memory prices
    ) {
        OwnerRecord[] storage history = _ownerHistory[tokenId];

        if (history.length <= 1) {
            return (new address[](0), new uint256[](0));
        }

        uint256 count = history.length - 1;
        owners = new address[](count);
        prices = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 historyIndex = history.length - 2 - i;
            owners[i] = history[historyIndex].owner;
            prices[i] = history[historyIndex].purchasePrice;
        }
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
