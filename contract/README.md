# ReLoop RWA Marketplace - Smart Contracts

Solidity smart contracts for the ReLoop Real-World Asset (RWA) marketplace with automated profit cascade distribution.

## Overview

ReLoop is a marketplace where tokenized real-world assets can be traded with a unique profit-sharing mechanism. When a token is resold at a profit, previous owners automatically receive a percentage of the sale price, creating sustainable value for early supporters.

### Key Features

- **Profit Cascade**: Up to 5 generations of previous owners earn from future sales
- **Tiered Cap System**: Maximum profit split is determined by depth (depth × 4%)
- **USDC Payments**: All transactions use USDC stablecoin for predictable pricing
- **Hardcoded Platform Fee**: 1.5% fee on every transaction
- **Loss Protection**: No cascade distribution when sold at a loss (seller keeps proceeds minus platform fee)
- **On-chain History**: Full ownership history tracked for transparent distributions

### Tiered Cap System

The profit split is capped based on the chosen depth level to ensure sellers always retain a fair share:

| Depth | Max Split | Example Splits | Min Seller Receives |
|-------|-----------|----------------|---------------------|
| 0 | 0% | N/A (simple sale) | 98.5% |
| 1 | 4% | [4%] | 94.5% |
| 2 | 8% | [5%, 3%] | 90.5% |
| 3 | 12% | [6%, 4%, 2%] | 86.5% |
| 4 | 16% | [6%, 4%, 3%, 3%] | 82.5% |
| 5 | 20% | [6%, 5%, 4%, 3%, 2%] | 78.5% |

**Formula:** `Max Split = Depth × 4%` (400 basis points per depth level)

## Contracts

| Contract | Description |
|----------|-------------|
| `ReLoopRWA.sol` | ERC721 token with profit split configuration and ownership history |
| `ReLoopMarketplace.sol` | P2P marketplace with automated profit distribution |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Actions                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│     Mint        │      List       │         Buy             │
└────────┬────────┴────────┬────────┴────────────┬────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│  ReLoopRWA      │  │          ReLoopMarketplace              │
│  (ERC721)       │◄─┤                                         │
│                 │  │  • Manages listings                     │
│  • Mint tokens  │  │  • Processes purchases                  │
│  • Store config │  │  • Distributes profits automatically    │
│  • Track owners │  │  • Collects platform fees               │
└─────────────────┘  └─────────────────────────────────────────┘
```

## Profit Distribution Example

```
Token Config: Depth 3 with splits [6%, 4%, 2%] = 12% total (max allowed)
Platform Fee: 1.5%

Ownership Chain:
  Alice (minter) → Bob (100 USDC) → Charlie (200 USDC) → Dave (300 USDC)

When Dave buys for 300 USDC:
┌────────────────────────────────────────┐
│ Platform Fee:  4.50 USDC   (1.5%)      │
│ Bob (Gen 1):   18.00 USDC  (6%)        │
│ Alice (Gen 2): 12.00 USDC  (4%)        │
│ Charlie:       265.50 USDC (seller)    │
└────────────────────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone https://github.com/louissarvin/reloop.git
cd reloop/contract

# Install dependencies
forge install

# Build contracts
forge build
```

## Usage

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_BuySecondSaleWithProfit -vvv
```

### Format

```bash
forge fmt
```

### Gas Report

```bash
forge test --gas-report
```

## Contract Interface

### ReLoopRWA

#### Mint a Token

```solidity
function mint(
    address to,
    string calldata uri,
    uint8 depth,                       // 0-5 generations (0 = simple sale)
    uint16[] calldata profitSplitsBps  // Basis points for each gen (max = depth × 4%)
) external returns (uint256 tokenId)
```

**Example (Depth 3 with tiered cap):**
```solidity
// Max allowed for depth 3 = 3 × 4% = 12% (1200 bps)
uint16[] memory splits = new uint16[](3);
splits[0] = 600;  // 6% to most recent previous owner
splits[1] = 400;  // 4% to second previous owner
splits[2] = 200;  // 2% to third previous owner
// Total: 12% (within cap)

rwa.mint(msg.sender, "ipfs://metadata.json", 3, splits);
```

**Example (Depth 0 - Simple Sale):**
```solidity
// No profit cascade, just platform fee
uint16[] memory emptySplits = new uint16[](0);
rwa.mint(msg.sender, "ipfs://metadata.json", 0, emptySplits);
```

#### View Functions

```solidity
// Get token configuration
function getTokenConfig(uint256 tokenId) external view returns (
    uint8 depth,
    uint16[] memory profitSplitsBps,
    uint16 platformFeeBps,
    bool isConfigured
)

// Get ownership history
function getOwnerHistory(uint256 tokenId) external view returns (OwnerRecord[] memory)

// Get last purchase price
function getLastPurchasePrice(uint256 tokenId) external view returns (uint256)
```

### ReLoopMarketplace

#### List a Token

```solidity
// First approve the marketplace
rwa.approve(address(marketplace), tokenId);

// Then list (price in USDC - 6 decimals)
marketplace.list(tokenId, 100 * 10**6);  // 100 USDC
```

#### Buy a Token

```solidity
// First approve USDC spending
usdc.approve(address(marketplace), 100 * 10**6);

// Then buy
marketplace.buy(tokenId);
```

#### Preview Distribution

```solidity
function calculateDistribution(uint256 tokenId, uint256 salePrice) external view returns (
    uint256 sellerAmount,
    uint256 platformFeeAmount,
    address[] memory profitRecipients,
    uint256[] memory profitAmounts,
    bool willDistribute
)
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_DEPTH` | 5 | Maximum profit cascade generations |
| `BASIS_POINTS` | 10000 | Denominator for percentage calculations |
| `PLATFORM_FEE_BPS` | 150 | Platform fee (1.5%) |
| `SPLIT_CAP_PER_DEPTH_BPS` | 400 | 4% cap per depth level |

### Helper Functions

```solidity
// Get max allowed split for a given depth
function getMaxSplitForDepth(uint8 depth) public pure returns (uint16 maxSplitBps)
// Returns: depth * 400 (e.g., depth 3 → 1200 bps = 12%)
```

## Events

### ReLoopRWA

```solidity
event TokenMinted(uint256 indexed tokenId, address indexed minter, uint8 depth, uint16[] profitSplitsBps)
event MarketplaceUpdated(address indexed oldMarketplace, address indexed newMarketplace)
event OwnerHistoryUpdated(uint256 indexed tokenId, address indexed newOwner, uint256 purchasePrice)
```

### ReLoopMarketplace

```solidity
event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)
event Delisted(uint256 indexed tokenId, address indexed seller)
event Sale(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 profit)
event ProfitDistributed(uint256 indexed tokenId, address indexed recipient, uint256 amount, uint8 generation)
event PlatformFeeCollected(uint256 indexed tokenId, uint256 amount)
```

## Deployment

### Local (Anvil)

```bash
# Start local node
anvil

# Deploy (in another terminal)
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet (Mantle Sepolia)

```bash
# Copy and configure .env
cp .env.example .env

# Deploy to Mantle Sepolia
source .env && forge script script/Deploy.s.sol:DeployTestnet \
    --rpc-url mantle_sepolia \
    --broadcast \
    --private-key $PRIVATE_KEY
```

**Deployed Contracts (Mantle Sepolia):**
| Contract | Address |
|----------|---------|
| MockUSDC | `0x72698EF7eDB40709520C92F84024E6556481EA15` |
| ReLoopRWA | `0xaA4886d00e3A22aB6f4b5105CC782B1C29c3d910` |
| ReLoopMarketplace | `0x003f586c9Dc9de4FeE29c49E437230258cb4cA9E` |

## Security Considerations

- **ReentrancyGuard**: All state-changing functions are protected
- **Access Control**: Only marketplace can record sales; only owner can update settings
- **Input Validation**: Depth (0-5), splits must match depth, total splits ≤ tiered cap (depth × 4%)
- **SafeERC20**: Uses OpenZeppelin's SafeERC20 for all USDC transfers

## License

MIT

## Links

- [Frontend Assignment](./docs/FRONTEND_ASSIGNMENT.md)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Foundry Book](https://book.getfoundry.sh/)
