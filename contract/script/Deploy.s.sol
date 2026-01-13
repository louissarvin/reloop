// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ReLoopRWA} from "../src/ReLoopRWA.sol";
import {ReLoopMarketplace} from "../src/ReLoopMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployScript is Script {
    function run() public {
        // Get deployer from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Platform wallet (can be same as deployer for testing)
        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer);

        // Payment token address (USDC)
        address paymentToken = vm.envAddress("PAYMENT_TOKEN");

        console.log("Deploying with account:", deployer);
        console.log("Platform wallet:", platformWallet);
        console.log("Payment token:", paymentToken);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RWA Contract
        ReLoopRWA rwa = new ReLoopRWA(deployer);
        console.log("ReLoopRWA deployed at:", address(rwa));

        // 2. Deploy Marketplace
        ReLoopMarketplace marketplace = new ReLoopMarketplace(
            address(rwa),
            paymentToken,
            platformWallet,
            deployer
        );
        console.log("ReLoopMarketplace deployed at:", address(marketplace));

        // 3. Set marketplace in RWA contract
        rwa.setMarketplace(address(marketplace));
        console.log("Marketplace set in RWA contract");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("RWA Contract:", address(rwa));
        console.log("Marketplace:", address(marketplace));
    }
}

contract DeployTestnet is Script {
    function run() public {
        // For testnet deployment with MockUSDC
        address deployer = msg.sender;

        vm.startBroadcast();

        // 1. Deploy MockUSDC for testing
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // 2. Deploy RWA Contract
        ReLoopRWA rwa = new ReLoopRWA(deployer);
        console.log("ReLoopRWA deployed at:", address(rwa));

        // 3. Deploy Marketplace (platform wallet = deployer for testing)
        ReLoopMarketplace marketplace = new ReLoopMarketplace(
            address(rwa),
            address(usdc),
            deployer,
            deployer
        );
        console.log("ReLoopMarketplace deployed at:", address(marketplace));

        // 4. Set marketplace in RWA contract
        rwa.setMarketplace(address(marketplace));
        console.log("Marketplace set in RWA contract");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Testnet Deployment Complete ===");
        console.log("MockUSDC:", address(usdc));
        console.log("RWA Contract:", address(rwa));
        console.log("Marketplace:", address(marketplace));
    }
}
