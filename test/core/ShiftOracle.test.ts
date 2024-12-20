import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ShiftOracle } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ShiftOracle", () => {
    let shiftOracle: ShiftOracle;
    let owner: SignerWithAddress;
    let node1: SignerWithAddress;
    let node2: SignerWithAddress;
    let node3: SignerWithAddress;
    let user: SignerWithAddress;
    
    const SYMBOL = "ETH/USD";
    const MIN_NODE_STAKE = ethers.utils.parseEther("50000");
    const HEARTBEAT = 3600; // 1 hour
    
    const feedConfig = {
        deviationThreshold: 100, // 1%
        minPrice: ethers.utils.parseEther("100"),
        maxPrice: ethers.utils.parseEther("10000"),
        validityPeriod: 3600,
        requiresValidation: true
    };

    beforeEach(async () => {
        [owner, node1, node2, node3, user] = await ethers.getSigners();
        
        const ShiftOracle = await ethers.getContractFactory("ShiftOracle");
        shiftOracle = await ShiftOracle.deploy();
        await shiftOracle.deployed();
        
        // Register price feed
        await shiftOracle.registerPriceFeed(
            SYMBOL,
            ethers.constants.AddressZero, // Mock aggregator
            HEARTBEAT,
            feedConfig
        );
        
        // Register oracle nodes
        await shiftOracle.connect(node1).registerNode(
            [SYMBOL],
            { value: MIN_NODE_STAKE }
        );
        await shiftOracle.connect(node2).registerNode(
            [SYMBOL],
            { value: MIN_NODE_STAKE }
        );
        await shiftOracle.connect(node3).registerNode(
            [SYMBOL],
            { value: MIN_NODE_STAKE }
        );
    });

    describe("Price Feed Management", () => {
        it("should register a new price feed", async () => {
            const newSymbol = "BTC/USD";
            
            await expect(
                shiftOracle.registerPriceFeed(
                    newSymbol,
                    ethers.constants.AddressZero,
                    HEARTBEAT,
                    feedConfig
                )
            ).to.emit(shiftOracle, "PriceFeedRegistered")
             .withArgs(newSymbol, ethers.constants.AddressZero, HEARTBEAT);

            const feedInfo = await shiftOracle.getFeedInfo(newSymbol);
            expect(feedInfo.isActive).to.be.true;
            expect(feedInfo.heartbeat).to.equal(HEARTBEAT);
        });

        it("should update feed configuration", async () => {
            const newConfig = {
                deviationThreshold: 50, // 0.5%
                minPrice: ethers.utils.parseEther("200"),
                maxPrice: ethers.utils.parseEther("20000"),
                validityPeriod: 7200,
                requiresValidation: true
            };

            await expect(
                shiftOracle.updateFeedConfig(SYMBOL, newConfig)
            ).to.emit(shiftOracle, "FeedConfigUpdated")
             .withArgs(SYMBOL, newConfig.deviationThreshold, newConfig.validityPeriod);

            const feedInfo = await shiftOracle.getFeedInfo(SYMBOL);
            expect(feedInfo.config.deviationThreshold).to.equal(newConfig.deviationThreshold);
            expect(feedInfo.config.validityPeriod).to.equal(newConfig.validityPeriod);
        });
    });

    describe("Node Management", () => {
        it("should register a new oracle node", async () => {
            const newNode = await ethers.getSigner(6);
            const supportedFeeds = [SYMBOL, "BTC/USD"];
            
            await expect(
                shiftOracle.connect(newNode).registerNode(
                    supportedFeeds,
                    { value: MIN_NODE_STAKE }
                )
            ).to.emit(shiftOracle, "NodeRegistered")
             .withArgs(newNode.address, MIN_NODE_STAKE, supportedFeeds);

            const nodeInfo = await shiftOracle.getNodeInfo(newNode.address);
            expect(nodeInfo.isActive).to.be.true;
            expect(nodeInfo.stake).to.equal(MIN_NODE_STAKE);
            expect(nodeInfo.supportedFeeds).to.deep.equal(supportedFeeds);
        });

        it("should reject node registration with insufficient stake", async () => {
            const newNode = await ethers.getSigner(6);
            await expect(
                shiftOracle.connect(newNode).registerNode(
                    [SYMBOL],
                    { value: ethers.utils.parseEther("1") }
                )
            ).to.be.revertedWith("Insufficient stake");
        });
    });

    describe("Price Updates", () => {
        const price = ethers.utils.parseEther("1500"); // $1,500
        let updateId: string;

        beforeEach(async () => {
            const proofHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["string", "uint256", "bytes32", "uint256"],
                    [SYMBOL, price, proofHash, await time.latest()]
                )
            );
            const signature = await node1.signMessage(ethers.utils.arrayify(messageHash));

            const tx = await shiftOracle.connect(node1).submitPriceUpdate(
                SYMBOL,
                price,
                proofHash,
                signature
            );
            const receipt = await tx.wait();
            updateId = receipt.events?.[0].args?.updateId;
        });

        it("should submit a price update", async () => {
            const update = await shiftOracle.updates(updateId);
            expect(update.symbol).to.equal(SYMBOL);
            expect(update.price).to.equal(price);
            expect(update.reporter).to.equal(node1.address);
            expect(update.isValidated).to.be.false;
        });

        it("should validate a price update", async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "bool", "uint256"],
                    [updateId, true, await time.latest()]
                )
            );
            const signature = await node2.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftOracle.connect(node2).validatePriceUpdate(
                    updateId,
                    true,
                    signature
                )
            ).to.emit(shiftOracle, "UpdateValidated")
             .withArgs(updateId, node2.address, await time.latest());

            const nodeInfo = await shiftOracle.getNodeInfo(node2.address);
            expect(nodeInfo.metrics.totalUpdates).to.equal(1);
            expect(nodeInfo.metrics.validUpdates).to.equal(1);
        });

        it("should update price after sufficient validations", async () => {
            // First validation
            const messageHash1 = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "bool", "uint256"],
                    [updateId, true, await time.latest()]
                )
            );
            const signature1 = await node2.signMessage(ethers.utils.arrayify(messageHash1));
            await shiftOracle.connect(node2).validatePriceUpdate(updateId, true, signature1);

            // Second validation
            const messageHash2 = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "bool", "uint256"],
                    [updateId, true, await time.latest()]
                )
            );
            const signature2 = await node3.signMessage(ethers.utils.arrayify(messageHash2));
            
            await expect(
                shiftOracle.connect(node3).validatePriceUpdate(updateId, true, signature2)
            ).to.emit(shiftOracle, "PriceUpdated")
             .withArgs(SYMBOL, 0, price, await time.latest());

            const latestPrice = await shiftOracle.getLatestPrice(SYMBOL);
            expect(latestPrice.price).to.equal(price);
            expect(latestPrice.isValid).to.be.true;
        });

        it("should reject updates with high deviation", async () => {
            const highPrice = ethers.utils.parseEther("3000"); // 100% increase
            const proofHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["string", "uint256", "bytes32", "uint256"],
                    [SYMBOL, highPrice, proofHash, await time.latest()]
                )
            );
            const signature = await node1.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftOracle.connect(node1).submitPriceUpdate(
                    SYMBOL,
                    highPrice,
                    proofHash,
                    signature
                )
            ).to.be.revertedWith("Price deviation too high");
        });
    });

    describe("Admin Functions", () => {
        it("should slash misbehaving node", async () => {
            const slashAmount = ethers.utils.parseEther("25000");
            const reason = "invalid_updates";

            await expect(
                shiftOracle.slashNode(
                    node1.address,
                    slashAmount,
                    reason
                )
            ).to.emit(shiftOracle, "NodeSlashed")
             .withArgs(node1.address, slashAmount, reason);

            const nodeInfo = await shiftOracle.getNodeInfo(node1.address);
            expect(nodeInfo.stake).to.equal(MIN_NODE_STAKE.sub(slashAmount));
            expect(nodeInfo.isActive).to.be.true; // Still above minimum
        });

        it("should deactivate node when slashed below minimum", async () => {
            const slashAmount = ethers.utils.parseEther("49000");
            await shiftOracle.slashNode(node1.address, slashAmount, "severe_violation");

            const nodeInfo = await shiftOracle.getNodeInfo(node1.address);
            expect(nodeInfo.isActive).to.be.false;
        });

        it("should pause and unpause the contract", async () => {
            await shiftOracle.pause();
            expect(await shiftOracle.paused()).to.be.true;

            await shiftOracle.unpause();
            expect(await shiftOracle.paused()).to.be.false;
        });
    });
}); 