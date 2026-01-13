// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ReLoopRWA.sol";

contract ReLoopMarketplace is Ownable, ReentrancyGuard {
    uint16 public constant BASIS_POINTS = 10000;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    ReLoopRWA public immutable rwaContract;
    address public platformWallet;

    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Delisted(uint256 indexed tokenId, address indexed seller);
    event Sale(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 profit
    );
    event ProfitDistributed(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount,
        uint8 generation
    );
    event PlatformFeeCollected(uint256 indexed tokenId, uint256 amount);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    error NotTokenOwner();
    error NotApproved();
    error ListingNotActive();
    error InvalidPrice();
    error InsufficientPayment();
    error CannotBuyOwnToken();
    error TransferFailed();
    error InvalidPlatformWallet();

    constructor(
        address _rwaContract,
        address _platformWallet,
        address _owner
    ) Ownable(_owner) {
        rwaContract = ReLoopRWA(_rwaContract);
        platformWallet = _platformWallet;
    }

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        if (_platformWallet == address(0)) revert InvalidPlatformWallet();
        address old = platformWallet;
        platformWallet = _platformWallet;
        emit PlatformWalletUpdated(old, _platformWallet);
    }

    function list(uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        if (rwaContract.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!rwaContract.isApprovedForAll(msg.sender, address(this)) &&
            rwaContract.getApproved(tokenId) != address(this)) {
            revert NotApproved();
        }

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit Listed(tokenId, msg.sender, price);
    }

    function delist(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotTokenOwner();

        listing.active = false;

        emit Delisted(tokenId, msg.sender);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];

        if (!listing.active) revert ListingNotActive();
        if (msg.value < listing.price) revert InsufficientPayment();
        if (msg.sender == listing.seller) revert CannotBuyOwnToken();

        address seller = listing.seller;
        uint256 salePrice = listing.price;

        listing.active = false;

        (
            ,
            uint16[] memory profitSplitsBps,
            uint16 platformFeeBps,
            bool isConfigured
        ) = rwaContract.getTokenConfig(tokenId);

        require(isConfigured, "Token not configured");

        uint256 lastPurchasePrice = rwaContract.getLastPurchasePrice(tokenId);

        bool shouldDistribute = salePrice >= lastPurchasePrice;
        uint256 profit = shouldDistribute ? salePrice - lastPurchasePrice : 0;

        uint256 platformFee = (salePrice * platformFeeBps) / BASIS_POINTS;
        uint256 sellerAmount;

        if (shouldDistribute) {
            sellerAmount = _distributeWithProfit(
                tokenId,
                salePrice,
                profitSplitsBps,
                platformFee
            );
        } else {
            sellerAmount = salePrice - platformFee;
        }

        rwaContract.safeTransferFrom(seller, msg.sender, tokenId);

        rwaContract.recordSale(tokenId, msg.sender, salePrice);

        if (platformFee > 0) {
            _safeTransfer(platformWallet, platformFee);
            emit PlatformFeeCollected(tokenId, platformFee);
        }

        if (sellerAmount > 0) {
            _safeTransfer(seller, sellerAmount);
        }

        if (msg.value > salePrice) {
            _safeTransfer(msg.sender, msg.value - salePrice);
        }

        emit Sale(tokenId, seller, msg.sender, salePrice, profit);
    }

    function _distributeWithProfit(
        uint256 tokenId,
        uint256 salePrice,
        uint16[] memory profitSplitsBps,
        uint256 platformFee
    ) internal returns (uint256 sellerAmount) {
        (address[] memory prevOwners, ) = rwaContract.getPreviousOwnersForProfit(tokenId);

        uint256 totalDistributed = platformFee;

        uint256 numToPay = prevOwners.length < profitSplitsBps.length
            ? prevOwners.length
            : profitSplitsBps.length;

        for (uint256 i = 0; i < numToPay; i++) {
            uint256 share = (salePrice * profitSplitsBps[i]) / BASIS_POINTS;

            if (share > 0 && prevOwners[i] != address(0)) {
                _safeTransfer(prevOwners[i], share);
                totalDistributed += share;

                emit ProfitDistributed(
                    tokenId,
                    prevOwners[i],
                    share,
                    uint8(i + 1)
                );
            }
        }

        sellerAmount = salePrice - totalDistributed;
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    function getListing(uint256 tokenId) external view returns (
        address seller,
        uint256 price,
        bool active
    ) {
        Listing storage listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    function calculateDistribution(uint256 tokenId, uint256 salePrice) external view returns (
        uint256 sellerAmount,
        uint256 platformFeeAmount,
        address[] memory profitRecipients,
        uint256[] memory profitAmounts,
        bool willDistribute
    ) {
        (
            ,
            uint16[] memory profitSplitsBps,
            uint16 platformFeeBps,
            bool isConfigured
        ) = rwaContract.getTokenConfig(tokenId);

        require(isConfigured, "Token not configured");

        uint256 lastPurchasePrice = rwaContract.getLastPurchasePrice(tokenId);
        willDistribute = salePrice >= lastPurchasePrice;

        platformFeeAmount = (salePrice * platformFeeBps) / BASIS_POINTS;

        if (!willDistribute) {
            sellerAmount = salePrice - platformFeeAmount;
            profitRecipients = new address[](0);
            profitAmounts = new uint256[](0);
            return (sellerAmount, platformFeeAmount, profitRecipients, profitAmounts, willDistribute);
        }

        (address[] memory prevOwners, ) = rwaContract.getPreviousOwnersForProfit(tokenId);

        uint256 numToPay = prevOwners.length < profitSplitsBps.length
            ? prevOwners.length
            : profitSplitsBps.length;

        profitRecipients = new address[](numToPay);
        profitAmounts = new uint256[](numToPay);

        uint256 totalDistributed = platformFeeAmount;

        for (uint256 i = 0; i < numToPay; i++) {
            profitRecipients[i] = prevOwners[i];
            profitAmounts[i] = (salePrice * profitSplitsBps[i]) / BASIS_POINTS;
            totalDistributed += profitAmounts[i];
        }

        sellerAmount = salePrice - totalDistributed;
    }

    receive() external payable {}
}
