# ReLoop RWA Marketplace - Smart Contracts

Solidity smart contracts for the ReLoop Real-World Asset (RWA) marketplace with automated profit cascade distribution.

## Overview

ReLoop is a marketplace where tokenized real-world assets can be traded with a unique profit-sharing mechanism. When a token is resold at a profit, previous owners automatically receive a percentage of the sale price, creating sustainable value for early supporters.

### Key Features

- **Profit Cascade**: Up to 5 generations of previous owners earn from future sales
- **Configurable Splits**: Token creators define profit percentages for each generation
- **Hardcoded Platform Fee**: 1.5% fee on every transaction
- **Loss Protection**: No cascade distribution when sold at a loss (seller keeps proceeds minus platform fee)
- **On-chain History**: Full ownership history tracked for transparent distributions

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
Token Config: 3 generations with splits [10%, 5%, 3%]
Platform Fee: 1.5%

Ownership Chain:
  Alice (minter) → Bob (1 ETH) → Charlie (2 ETH) → Dave (3 ETH)

When Dave buys for 3 ETH:
┌──────────────────────────────────────┐
│ Platform Fee:  0.045 ETH  (1.5%)     │
│ Bob (Gen 1):   0.30 ETH   (10%)      │
│ Alice (Gen 2): 0.15 ETH   (5%)       │
│ Charlie:       2.505 ETH  (seller)   │
└──────────────────────────────────────┘
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
    uint8 depth,                    // 1-5 generations
    uint16[] calldata profitSplitsBps  // Basis points for each gen
) external returns (uint256 tokenId)
```

**Example:**
```solidity
uint16[] memory splits = new uint16[](3);
splits[0] = 1000; // 10% to most recent previous owner
splits[1] = 500;  // 5% to second previous owner
splits[2] = 300;  // 3% to third previous owner

rwa.mint(msg.sender, "ipfs://metadata.json", 3, splits);
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

// Then list
marketplace.list(tokenId, 1 ether);
```

#### Buy a Token

```solidity
marketplace.buy{value: 1 ether}(tokenId);
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

### Testnet

```bash
forge script script/Deploy.s.sol \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify
```

## Security Considerations

- **ReentrancyGuard**: All state-changing functions are protected
- **Access Control**: Only marketplace can record sales; only owner can update settings
- **Input Validation**: Depth (1-5), splits must match depth, total splits ≤ 100%
- **Safe Transfers**: Uses low-level call with proper error handling

## License

MIT

## Links

- [Frontend Assignment](./docs/FRONTEND_ASSIGNMENT.md)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Foundry Book](https://book.getfoundry.sh/)
