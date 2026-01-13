// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ReLoopRWA} from "../src/ReLoopRWA.sol";
import {ReLoopMarketplace} from "../src/ReLoopMarketplace.sol";

contract ReLoopTest is Test {
    ReLoopRWA public rwa;
    ReLoopMarketplace public marketplace;

    address public owner = makeAddr("owner");
    address public platformWallet = makeAddr("platform");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public dave = makeAddr("dave");

    uint16[] public defaultSplits;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy contracts
        rwa = new ReLoopRWA(owner);
        marketplace = new ReLoopMarketplace(address(rwa), platformWallet, owner);

        // Set marketplace in RWA contract
        rwa.setMarketplace(address(marketplace));

        vm.stopPrank();

        // Default profit splits: 10%, 5%, 3% for 3 generations
        defaultSplits = new uint16[](3);
        defaultSplits[0] = 1000; // 10% for gen1
        defaultSplits[1] = 500;  // 5% for gen2
        defaultSplits[2] = 300;  // 3% for gen3

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(dave, 100 ether);
    }

    // ============ Minting Tests ============

    function test_Mint() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(
            alice,
            "ipfs://metadata",
            3,
            defaultSplits
        );

        assertEq(rwa.ownerOf(tokenId), alice);
        assertEq(tokenId, 0);

        (uint8 depth, uint16[] memory splits, uint16 platformFee, bool isConfigured) =
            rwa.getTokenConfig(tokenId);

        assertEq(depth, 3);
        assertEq(splits.length, 3);
        assertEq(splits[0], 1000);
        assertEq(platformFee, 250);
        assertTrue(isConfigured);
    }

    function test_MintInvalidDepth() public {
        uint16[] memory splits = new uint16[](6);
        for (uint i = 0; i < 6; i++) {
            splits[i] = 100;
        }

        vm.prank(alice);
        vm.expectRevert();
        rwa.mint(alice, "ipfs://metadata", 6, splits);
    }

    function test_MintInvalidSplitsLength() public {
        uint16[] memory wrongSplits = new uint16[](2);
        wrongSplits[0] = 1000;
        wrongSplits[1] = 500;

        vm.prank(alice);
        vm.expectRevert();
        rwa.mint(alice, "ipfs://metadata", 3, wrongSplits);
    }

    function test_MintTotalSplitsExceed() public {
        uint16[] memory tooMuchSplits = new uint16[](3);
        tooMuchSplits[0] = 5000; // 50%
        tooMuchSplits[1] = 3000; // 30%
        tooMuchSplits[2] = 2500; // 25%
        // Total = 105% + platform fee > 100%

        vm.prank(alice);
        vm.expectRevert();
        rwa.mint(alice, "ipfs://metadata", 3, tooMuchSplits);
    }

    // ============ Listing Tests ============

    function test_List() public {
        // Mint token
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Approve marketplace
        vm.prank(alice);
        rwa.approve(address(marketplace), tokenId);

        // List token
        vm.prank(alice);
        marketplace.list(tokenId, 1 ether);

        (address seller, uint256 price, bool active) = marketplace.getListing(tokenId);
        assertEq(seller, alice);
        assertEq(price, 1 ether);
        assertTrue(active);
    }

    function test_ListNotOwner() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.prank(bob);
        vm.expectRevert();
        marketplace.list(tokenId, 1 ether);
    }

    function test_Delist() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.prank(alice);
        rwa.approve(address(marketplace), tokenId);

        vm.prank(alice);
        marketplace.list(tokenId, 1 ether);

        vm.prank(alice);
        marketplace.delist(tokenId);

        (, , bool active) = marketplace.getListing(tokenId);
        assertFalse(active);
    }

    // ============ Buy Tests ============

    function test_BuyFirstSale() public {
        // Alice mints
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Alice approves and lists
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();

        uint256 aliceBalanceBefore = alice.balance;
        uint256 platformBalanceBefore = platformWallet.balance;

        // Bob buys
        vm.prank(bob);
        marketplace.buy{value: 1 ether}(tokenId);

        // Verify ownership
        assertEq(rwa.ownerOf(tokenId), bob);

        // First sale: no previous owners to pay, only platform fee
        // Platform fee = 2.5% of 1 ether = 0.025 ether
        uint256 platformFee = 0.025 ether;

        // Alice should get 1 ether - platform fee (no previous owners)
        assertEq(alice.balance, aliceBalanceBefore + 1 ether - platformFee);
        assertEq(platformWallet.balance, platformBalanceBefore + platformFee);
    }

    function test_BuySecondSaleWithProfit() public {
        // Alice mints
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Alice approves and lists at 1 ether
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();

        // Bob buys at 1 ether
        vm.prank(bob);
        marketplace.buy{value: 1 ether}(tokenId);

        // Bob approves and lists at 2 ether (profit!)
        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 2 ether);
        vm.stopPrank();

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;
        uint256 platformBalanceBefore = platformWallet.balance;

        // Charlie buys at 2 ether
        vm.prank(charlie);
        marketplace.buy{value: 2 ether}(tokenId);

        // Verify ownership
        assertEq(rwa.ownerOf(tokenId), charlie);

        // Distribution from 2 ether sale:
        // Platform fee = 2.5% = 0.05 ether
        // Alice (gen1) = 10% = 0.2 ether
        // Bob (seller) = remainder = 2 - 0.05 - 0.2 = 1.75 ether

        uint256 platformFee = 0.05 ether;
        uint256 aliceShare = 0.2 ether;

        assertEq(platformWallet.balance, platformBalanceBefore + platformFee);
        assertEq(alice.balance, aliceBalanceBefore + aliceShare);
        assertEq(bob.balance, bobBalanceBefore + 2 ether - platformFee - aliceShare);
    }

    function test_BuySamePrice() public {
        // Alice mints
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Alice lists at 1 ether
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();

        // Bob buys at 1 ether
        vm.prank(bob);
        marketplace.buy{value: 1 ether}(tokenId);

        // Bob lists at SAME price (1 ether)
        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();

        uint256 aliceBalanceBefore = alice.balance;

        // Charlie buys at same price
        vm.prank(charlie);
        marketplace.buy{value: 1 ether}(tokenId);

        // Same price SHOULD distribute (per user requirement)
        // Alice should still get 10% of sale price
        uint256 aliceShare = 0.1 ether;
        assertEq(alice.balance, aliceBalanceBefore + aliceShare);
    }

    function test_BuyAtLoss() public {
        // Alice mints
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Alice lists at 2 ether
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 2 ether);
        vm.stopPrank();

        // Bob buys at 2 ether
        vm.prank(bob);
        marketplace.buy{value: 2 ether}(tokenId);

        // Bob lists at LOSS (1 ether)
        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;
        uint256 platformBalanceBefore = platformWallet.balance;

        // Charlie buys at 1 ether (Bob takes loss)
        vm.prank(charlie);
        marketplace.buy{value: 1 ether}(tokenId);

        // At loss: NO cascade distribution
        // Bob gets everything minus platform fee
        uint256 platformFee = 0.025 ether;

        assertEq(alice.balance, aliceBalanceBefore); // Alice gets nothing
        assertEq(bob.balance, bobBalanceBefore + 1 ether - platformFee);
        assertEq(platformWallet.balance, platformBalanceBefore + platformFee);
    }

    function test_ThreeGenerationsProfit() public {
        // Mint with 3 gen depth
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // Alice -> Bob (1 eth)
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();
        vm.prank(bob);
        marketplace.buy{value: 1 ether}(tokenId);

        // Bob -> Charlie (2 eth)
        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 2 ether);
        vm.stopPrank();
        vm.prank(charlie);
        marketplace.buy{value: 2 ether}(tokenId);

        // Charlie -> Dave (3 eth)
        vm.startPrank(charlie);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 3 ether);
        vm.stopPrank();

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;
        uint256 charlieBalanceBefore = charlie.balance;

        vm.prank(dave);
        marketplace.buy{value: 3 ether}(tokenId);

        // Distribution from 3 ether sale:
        // Platform = 2.5% = 0.075 eth
        // Bob (gen1, most recent prev owner) = 10% = 0.3 eth
        // Alice (gen2) = 5% = 0.15 eth
        // Charlie (seller) = 3 - 0.075 - 0.3 - 0.15 = 2.475 eth

        assertEq(bob.balance, bobBalanceBefore + 0.3 ether);
        assertEq(alice.balance, aliceBalanceBefore + 0.15 ether);
        assertEq(charlie.balance, charlieBalanceBefore + 2.475 ether);
    }

    // ============ Calculate Distribution Tests ============

    function test_CalculateDistribution() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        // First sale simulation
        (
            uint256 sellerAmount,
            uint256 platformFee,
            address[] memory recipients,
            ,
            bool willDistribute
        ) = marketplace.calculateDistribution(tokenId, 1 ether);

        assertTrue(willDistribute);
        assertEq(platformFee, 0.025 ether);
        assertEq(recipients.length, 0); // No previous owners yet
        assertEq(sellerAmount, 1 ether - 0.025 ether);
    }

    // ============ Owner History Tests ============

    function test_OwnerHistoryTracking() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        ReLoopRWA.OwnerRecord[] memory history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 1);
        assertEq(history[0].owner, alice);
        assertEq(history[0].purchasePrice, 0); // Minter has price 0

        // First sale
        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, 1 ether);
        vm.stopPrank();
        vm.prank(bob);
        marketplace.buy{value: 1 ether}(tokenId);

        history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 2);
        assertEq(history[1].owner, bob);
        assertEq(history[1].purchasePrice, 1 ether);
    }

    function test_OwnerHistoryCapped() public {
        // Mint with depth 2
        uint16[] memory splits = new uint16[](2);
        splits[0] = 1000;
        splits[1] = 500;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 2, splits);

        // Multiple sales to exceed depth
        address eve = makeAddr("eve");
        vm.deal(eve, 100 ether);
        address[4] memory buyers = [bob, charlie, dave, eve];

        address currentOwner = alice;
        for (uint i = 0; i < 4; i++) {
            vm.startPrank(currentOwner);
            rwa.approve(address(marketplace), tokenId);
            marketplace.list(tokenId, 1 ether);
            vm.stopPrank();

            vm.prank(buyers[i]);
            marketplace.buy{value: 1 ether}(tokenId);

            currentOwner = buyers[i];
        }

        // History should be capped at depth + 1 = 3
        ReLoopRWA.OwnerRecord[] memory history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 3);
    }
}
