// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ReLoopRWA} from "../src/ReLoopRWA.sol";
import {ReLoopMarketplace} from "../src/ReLoopMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract ReLoopTest is Test {
    ReLoopRWA public rwa;
    ReLoopMarketplace public marketplace;
    MockUSDC public usdc;

    address public owner = makeAddr("owner");
    address public platformWallet = makeAddr("platform");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public dave = makeAddr("dave");

    uint16[] public defaultSplits;

    uint256 constant USDC_DECIMALS = 6;
    uint256 constant ONE_USDC = 10 ** USDC_DECIMALS;
    uint256 constant INITIAL_BALANCE = 100_000 * ONE_USDC; 

    function setUp() public {
        vm.startPrank(owner);

        usdc = new MockUSDC();

        rwa = new ReLoopRWA(owner);
        marketplace = new ReLoopMarketplace(address(rwa), address(usdc), platformWallet, owner);

        rwa.setMarketplace(address(marketplace));

        usdc.mint(alice, INITIAL_BALANCE);
        usdc.mint(bob, INITIAL_BALANCE);
        usdc.mint(charlie, INITIAL_BALANCE);
        usdc.mint(dave, INITIAL_BALANCE);

        vm.stopPrank();

        defaultSplits = new uint16[](3);
        defaultSplits[0] = 1000; 
        defaultSplits[1] = 500; 
        defaultSplits[2] = 300;
    }

    function test_Mint() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(
            alice,
            "ipfs://metadata",
            3,
            defaultSplits
        );

        assertEq(rwa.ownerOf(tokenId), alice);
        assertEq(tokenId, 1);

        (uint8 depth, uint16[] memory splits, uint16 platformFee, bool isConfigured) =
            rwa.getTokenConfig(tokenId);

        assertEq(depth, 3);
        assertEq(splits.length, 3);
        assertEq(splits[0], 1000);
        assertEq(platformFee, 150);
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
        tooMuchSplits[0] = 5000; 
        tooMuchSplits[1] = 3000; 
        tooMuchSplits[2] = 2500; 

        vm.prank(alice);
        vm.expectRevert();
        rwa.mint(alice, "ipfs://metadata", 3, tooMuchSplits);
    }


    function test_List() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.prank(alice);
        rwa.approve(address(marketplace), tokenId);

        vm.prank(alice);
        marketplace.list(tokenId, 1000 * ONE_USDC);

        (address seller, uint256 price, bool active) = marketplace.getListing(tokenId);
        assertEq(seller, alice);
        assertEq(price, 1000 * ONE_USDC);
        assertTrue(active);
    }

    function test_ListNotOwner() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.prank(bob);
        vm.expectRevert();
        marketplace.list(tokenId, 1000 * ONE_USDC);
    }

    function test_Delist() public {
        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.prank(alice);
        rwa.approve(address(marketplace), tokenId);

        vm.prank(alice);
        marketplace.list(tokenId, 1000 * ONE_USDC);

        vm.prank(alice);
        marketplace.delist(tokenId);

        (, , bool active) = marketplace.getListing(tokenId);
        assertFalse(active);
    }

    function test_BuyFirstSale() public {
        uint256 salePrice = 1000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, salePrice);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);

        vm.startPrank(bob);
        usdc.approve(address(marketplace), salePrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        assertEq(rwa.ownerOf(tokenId), bob);

        uint256 platformFee = 15 * ONE_USDC;

        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + salePrice - platformFee);
        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
    }

    function test_BuySecondSaleWithProfit() public {
        uint256 firstPrice = 1000 * ONE_USDC;
        uint256 secondPrice = 2000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, firstPrice);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(marketplace), firstPrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, secondPrice);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 bobBalanceBefore = usdc.balanceOf(bob);
        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);

        vm.startPrank(charlie);
        usdc.approve(address(marketplace), secondPrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        assertEq(rwa.ownerOf(tokenId), charlie);

        uint256 platformFee = 30 * ONE_USDC;
        uint256 aliceShare = 200 * ONE_USDC;

        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + aliceShare);
        assertEq(usdc.balanceOf(bob), bobBalanceBefore + secondPrice - platformFee - aliceShare);
    }

    function test_BuySamePrice() public {
        uint256 salePrice = 1000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, salePrice);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(marketplace), salePrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, salePrice);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);

        vm.startPrank(charlie);
        usdc.approve(address(marketplace), salePrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        uint256 aliceShare = 100 * ONE_USDC;
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + aliceShare);
    }

    function test_BuyAtLoss() public {
        uint256 firstPrice = 2000 * ONE_USDC;
        uint256 secondPrice = 1000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, firstPrice);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(marketplace), firstPrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, secondPrice);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 bobBalanceBefore = usdc.balanceOf(bob);
        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);

        vm.startPrank(charlie);
        usdc.approve(address(marketplace), secondPrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        uint256 platformFee = 15 * ONE_USDC;

        assertEq(usdc.balanceOf(alice), aliceBalanceBefore); 
        assertEq(usdc.balanceOf(bob), bobBalanceBefore + secondPrice - platformFee);
        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
    }

    function test_ThreeGenerationsProfit() public {
        uint256 price1 = 1000 * ONE_USDC;
        uint256 price2 = 2000 * ONE_USDC;
        uint256 price3 = 3000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, price1);
        vm.stopPrank();
        vm.startPrank(bob);
        usdc.approve(address(marketplace), price1);
        marketplace.buy(tokenId);
        vm.stopPrank();

        vm.startPrank(bob);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, price2);
        vm.stopPrank();
        vm.startPrank(charlie);
        usdc.approve(address(marketplace), price2);
        marketplace.buy(tokenId);
        vm.stopPrank();

        vm.startPrank(charlie);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, price3);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 bobBalanceBefore = usdc.balanceOf(bob);
        uint256 charlieBalanceBefore = usdc.balanceOf(charlie);

        vm.startPrank(dave);
        usdc.approve(address(marketplace), price3);
        marketplace.buy(tokenId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(bob), bobBalanceBefore + 300 * ONE_USDC);
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + 150 * ONE_USDC);
        assertEq(usdc.balanceOf(charlie), charlieBalanceBefore + 2505 * ONE_USDC);
    }


    function test_CalculateDistribution() public {
        uint256 salePrice = 1000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        (
            uint256 sellerAmount,
            uint256 platformFee,
            address[] memory recipients,
            ,
            bool willDistribute
        ) = marketplace.calculateDistribution(tokenId, salePrice);

        assertTrue(willDistribute);
        assertEq(platformFee, 15 * ONE_USDC);
        assertEq(recipients.length, 0); 
        assertEq(sellerAmount, salePrice - 15 * ONE_USDC);
    }


    function test_OwnerHistoryTracking() public {
        uint256 salePrice = 1000 * ONE_USDC;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 3, defaultSplits);

        ReLoopRWA.OwnerRecord[] memory history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 1);
        assertEq(history[0].owner, alice);
        assertEq(history[0].purchasePrice, 0); 

        vm.startPrank(alice);
        rwa.approve(address(marketplace), tokenId);
        marketplace.list(tokenId, salePrice);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(marketplace), salePrice);
        marketplace.buy(tokenId);
        vm.stopPrank();

        history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 2);
        assertEq(history[1].owner, bob);
        assertEq(history[1].purchasePrice, salePrice);
    }

    function test_OwnerHistoryCapped() public {
        uint256 salePrice = 1000 * ONE_USDC;

        uint16[] memory splits = new uint16[](2);
        splits[0] = 1000;
        splits[1] = 500;

        vm.prank(alice);
        uint256 tokenId = rwa.mint(alice, "ipfs://metadata", 2, splits);

        address eve = makeAddr("eve");
        vm.prank(owner);
        usdc.mint(eve, INITIAL_BALANCE);

        address[4] memory buyers = [bob, charlie, dave, eve];

        address currentOwner = alice;
        for (uint i = 0; i < 4; i++) {
            vm.startPrank(currentOwner);
            rwa.approve(address(marketplace), tokenId);
            marketplace.list(tokenId, salePrice);
            vm.stopPrank();

            vm.startPrank(buyers[i]);
            usdc.approve(address(marketplace), salePrice);
            marketplace.buy(tokenId);
            vm.stopPrank();

            currentOwner = buyers[i];
        }

        ReLoopRWA.OwnerRecord[] memory history = rwa.getOwnerHistory(tokenId);
        assertEq(history.length, 3);
    }
}
