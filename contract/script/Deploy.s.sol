// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ReLoopRWA} from "../src/ReLoopRWA.sol";
import {ReLoopMarketplace} from "../src/ReLoopMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address platformWallet = vm.envOr("PLATFORM_WALLET", deployer);

        address paymentToken = vm.envAddress("PAYMENT_TOKEN");

        console.log("Deploying with account:", deployer);
        console.log("Platform wallet:", platformWallet);
        console.log("Payment token:", paymentToken);

        vm.startBroadcast(deployerPrivateKey);

        ReLoopRWA rwa = new ReLoopRWA(deployer);
        console.log("ReLoopRWA deployed at:", address(rwa));

        ReLoopMarketplace marketplace = new ReLoopMarketplace(
            address(rwa),
            paymentToken,
            platformWallet,
            deployer
        );
        console.log("ReLoopMarketplace deployed at:", address(marketplace));

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
        address deployer = msg.sender;

        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        ReLoopRWA rwa = new ReLoopRWA(deployer);
        console.log("ReLoopRWA deployed at:", address(rwa));

        ReLoopMarketplace marketplace = new ReLoopMarketplace(
            address(rwa),
            address(usdc),
            deployer,
            deployer
        );
        console.log("ReLoopMarketplace deployed at:", address(marketplace));

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
