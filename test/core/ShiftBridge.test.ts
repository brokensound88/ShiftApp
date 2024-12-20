import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ShiftBridge, ShiftNetwork } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ShiftBridge", () => {
    let shiftBridge: ShiftBridge;
    let shiftNetwork: ShiftNetwork;
    let owner: SignerWithAddress;
    let validator1: SignerWithAddress;
    let validator2: SignerWithAddress;
    let validator3: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    
    const CHAIN_ID = 1;
    const TARGET_CHAIN_ID = 137; // Polygon
    const CHAIN_NAME = "Ethereum Mainnet";
    const CONFIRMATIONS = 12;
    const MIN_VALIDATOR_STAKE = ethers.utils.parseEther("100000");
    
    const bridgeSettings = {
        minTransferAmount: ethers.utils.parseEther("0.1"),
        maxTransferAmount: ethers.utils.parseEther("1000"),
        dailyLimit: ethers.utils.parseEther("10000"),
        processingTime: 3600, // 1 hour
        requiresKYC: true,
        supportedTokens: ["ETH", "USDC", "USDT"],
        fees: [
            ethers.utils.parseEther("0.001"),
            ethers.utils.parseEther("0.002"),
            ethers.utils.parseEther("0.003")
        ]
    };

    beforeEach(async () => {
        [owner, validator1, validator2, validator3, user1, user2] = await ethers.getSigners();
        
        // Deploy ShiftNetwork first
        const ShiftNetwork = await ethers.getContractFactory("ShiftNetwork");
        shiftNetwork = await ShiftNetwork.deploy();
        await shiftNetwork.deployed();
        
        // Deploy ShiftBridge
        const ShiftBridge = await ethers.getContractFactory("ShiftBridge");
        shiftBridge = await ShiftBridge.deploy(shiftNetwork.address);
        await shiftBridge.deployed();
        
        // Register chain
        await shiftBridge.registerChain(
            CHAIN_ID,
            CHAIN_NAME,
            ethers.constants.AddressZero, // Bridge contract on target chain
            CONFIRMATIONS,
            bridgeSettings
        );
        
        // Register validators
        await shiftBridge.connect(validator1).registerValidator(
            ["Ethereum", "Polygon"],
            { value: MIN_VALIDATOR_STAKE }
        );
        await shiftBridge.connect(validator2).registerValidator(
            ["Ethereum", "Polygon"],
            { value: MIN_VALIDATOR_STAKE }
        );
        await shiftBridge.connect(validator3).registerValidator(
            ["Ethereum", "Polygon"],
            { value: MIN_VALIDATOR_STAKE }
        );
    });

    describe("Chain Management", () => {
        it("should register a new chain", async () => {
            const newChainId = 56; // BSC
            const newChainName = "Binance Smart Chain";
            
            await expect(
                shiftBridge.registerChain(
                    newChainId,
                    newChainName,
                    ethers.constants.AddressZero,
                    CONFIRMATIONS,
                    bridgeSettings
                )
            ).to.emit(shiftBridge, "ChainRegistered")
             .withArgs(newChainId, newChainName, ethers.constants.AddressZero);

            const chainInfo = await shiftBridge.getChainInfo(newChainId);
            expect(chainInfo.name).to.equal(newChainName);
            expect(chainInfo.isActive).to.be.true;
            expect(chainInfo.confirmations).to.equal(CONFIRMATIONS);
        });

        it("should reject duplicate chain registration", async () => {
            await expect(
                shiftBridge.registerChain(
                    CHAIN_ID,
                    CHAIN_NAME,
                    ethers.constants.AddressZero,
                    CONFIRMATIONS,
                    bridgeSettings
                )
            ).to.be.revertedWith("Chain already registered");
        });
    });

    describe("Validator Management", () => {
        it("should register a new validator", async () => {
            const newValidator = await ethers.getSigner(6);
            const supportedChains = ["Ethereum", "Polygon", "BSC"];
            
            await expect(
                shiftBridge.connect(newValidator).registerValidator(
                    supportedChains,
                    { value: MIN_VALIDATOR_STAKE }
                )
            ).to.emit(shiftBridge, "ValidatorRegistered")
             .withArgs(newValidator.address, MIN_VALIDATOR_STAKE, supportedChains);

            const validatorInfo = await shiftBridge.getValidatorInfo(newValidator.address);
            expect(validatorInfo.isActive).to.be.true;
            expect(validatorInfo.stake).to.equal(MIN_VALIDATOR_STAKE);
            expect(validatorInfo.supportedChains).to.deep.equal(supportedChains);
        });

        it("should reject validator registration with insufficient stake", async () => {
            const newValidator = await ethers.getSigner(6);
            await expect(
                shiftBridge.connect(newValidator).registerValidator(
                    ["Ethereum"],
                    { value: ethers.utils.parseEther("1") }
                )
            ).to.be.revertedWith("Insufficient stake");
        });
    });

    describe("Cross-Chain Requests", () => {
        let requestId: string;
        const amount = ethers.utils.parseEther("1");
        const tokenSymbol = "ETH";

        beforeEach(async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256", "address", "uint256", "string", "uint256"],
                    [user1.address, TARGET_CHAIN_ID, user2.address, amount, tokenSymbol, await time.latest()]
                )
            );
            const signature = await user1.signMessage(ethers.utils.arrayify(messageHash));

            const tx = await shiftBridge.connect(user1).createCrossChainRequest(
                TARGET_CHAIN_ID,
                user2.address,
                amount,
                tokenSymbol,
                signature,
                { value: amount }
            );
            const receipt = await tx.wait();
            requestId = receipt.events?.[0].args?.requestId;
        });

        it("should create a cross-chain request", async () => {
            const requestInfo = await shiftBridge.getRequestInfo(requestId);
            expect(requestInfo.sourceChain).to.equal(CHAIN_ID);
            expect(requestInfo.targetChain).to.equal(TARGET_CHAIN_ID);
            expect(requestInfo.sender).to.equal(user1.address);
            expect(requestInfo.recipient).to.equal(user2.address);
            expect(requestInfo.amount).to.equal(amount);
            expect(requestInfo.tokenSymbol).to.equal(tokenSymbol);
            expect(requestInfo.status).to.equal(0); // Pending
        });

        it("should validate a cross-chain request", async () => {
            const validationProof = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "address", "uint256"],
                    [requestId, validator1.address, await time.latest()]
                )
            );

            await expect(
                shiftBridge.connect(validator1).validateRequest(
                    requestId,
                    validationProof
                )
            ).to.emit(shiftBridge, "RequestValidated")
             .withArgs(requestId, validator1.address, await time.latest());

            const validatorInfo = await shiftBridge.getValidatorInfo(validator1.address);
            expect(validatorInfo.validationCount).to.equal(1);
        });

        it("should complete request after sufficient validations", async () => {
            // First validator
            const proof1 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            await shiftBridge.connect(validator1).validateRequest(requestId, proof1);

            // Second validator
            const proof2 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            await shiftBridge.connect(validator2).validateRequest(requestId, proof2);

            // Third validator (should trigger completion)
            const proof3 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            await expect(
                shiftBridge.connect(validator3).validateRequest(requestId, proof3)
            ).to.emit(shiftBridge, "RequestCompleted");

            const requestInfo = await shiftBridge.getRequestInfo(requestId);
            expect(requestInfo.status).to.equal(2); // Completed
        });
    });

    describe("Proof Management", () => {
        it("should submit and verify proofs", async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256", "address", "uint256", "string", "uint256"],
                    [user1.address, TARGET_CHAIN_ID, user2.address, ethers.utils.parseEther("1"), "ETH", await time.latest()]
                )
            );
            const signature = await user1.signMessage(ethers.utils.arrayify(messageHash));

            const tx = await shiftBridge.connect(user1).createCrossChainRequest(
                TARGET_CHAIN_ID,
                user2.address,
                ethers.utils.parseEther("1"),
                "ETH",
                signature,
                { value: ethers.utils.parseEther("1") }
            );
            const receipt = await tx.wait();
            const requestId = receipt.events?.[0].args?.requestId;

            // Submit proof
            const proofHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const proofSignature = await validator1.signMessage(
                ethers.utils.arrayify(
                    ethers.utils.keccak256(
                        ethers.utils.defaultAbiCoder.encode(
                            ["bytes32", "bytes32", "uint256"],
                            [requestId, proofHash, await time.latest()]
                        )
                    )
                )
            );

            await expect(
                shiftBridge.connect(validator1).submitProof(
                    requestId,
                    proofHash,
                    proofSignature
                )
            ).to.emit(shiftBridge, "ProofSubmitted")
             .withArgs(requestId, proofHash, await time.latest());
        });
    });

    describe("Admin Functions", () => {
        it("should update chain configuration", async () => {
            const newConfirmations = 24;
            const newGasLimit = 3000000;
            const newValidatorThreshold = 4;
            
            await shiftBridge.updateChainConfig(
                CHAIN_ID,
                newConfirmations,
                newGasLimit,
                newValidatorThreshold,
                bridgeSettings
            );

            const chainInfo = await shiftBridge.getChainInfo(CHAIN_ID);
            expect(chainInfo.confirmations).to.equal(newConfirmations);
        });

        it("should slash validator", async () => {
            const slashAmount = ethers.utils.parseEther("50000");
            const reason = "malicious_behavior";

            await expect(
                shiftBridge.slashValidator(
                    validator1.address,
                    slashAmount,
                    reason
                )
            ).to.emit(shiftBridge, "ValidatorSlashed")
             .withArgs(validator1.address, slashAmount, reason);

            const validatorInfo = await shiftBridge.getValidatorInfo(validator1.address);
            expect(validatorInfo.stake).to.equal(MIN_VALIDATOR_STAKE.sub(slashAmount));
        });

        it("should pause and unpause the contract", async () => {
            await shiftBridge.pause();
            expect(await shiftBridge.paused()).to.be.true;

            await shiftBridge.unpause();
            expect(await shiftBridge.paused()).to.be.false;
        });
    });
}); 