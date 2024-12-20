import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ShiftNetwork } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ShiftNetwork", () => {
    let shiftNetwork: ShiftNetwork;
    let owner: SignerWithAddress;
    let nodeOperator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    
    const ENCRYPTION_LEVEL = 1024;
    const REGION = "US-EAST";
    const CERTIFICATIONS = ["ISO27001", "SOC2"];
    const PROTOCOLS = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("HTTP/2")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("QUIC"))
    ];

    beforeEach(async () => {
        [owner, nodeOperator, user1, user2] = await ethers.getSigners();
        
        const ShiftNetwork = await ethers.getContractFactory("ShiftNetwork");
        shiftNetwork = await ShiftNetwork.deploy();
        await shiftNetwork.deployed();
    });

    describe("Node Management", () => {
        let nodeId: string;
        const publicKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("node_public_key"));

        beforeEach(async () => {
            const tx = await shiftNetwork.connect(nodeOperator).registerNode(
                publicKey,
                REGION,
                ENCRYPTION_LEVEL,
                CERTIFICATIONS,
                PROTOCOLS
            );
            const receipt = await tx.wait();
            nodeId = receipt.events?.[0].args?.nodeId;
        });

        it("should register a new node", async () => {
            const nodeInfo = await shiftNetwork.getNodeInfo(nodeId);
            
            expect(nodeInfo.operator).to.equal(nodeOperator.address);
            expect(nodeInfo.isActive).to.be.true;
            expect(nodeInfo.encryptionLevel).to.equal(ENCRYPTION_LEVEL);
            expect(nodeInfo.region).to.equal(REGION);
            expect(nodeInfo.certifications).to.deep.equal(CERTIFICATIONS);
        });

        it("should reject node registration with insufficient encryption", async () => {
            await expect(
                shiftNetwork.connect(nodeOperator).registerNode(
                    publicKey,
                    REGION,
                    512, // Below minimum
                    CERTIFICATIONS,
                    PROTOCOLS
                )
            ).to.be.revertedWith("Insufficient encryption");
        });

        it("should update node metrics", async () => {
            const bandwidth = 1000;
            const latency = 50;
            const uptime = 99;

            await expect(
                shiftNetwork.connect(nodeOperator).updateNodeMetrics(
                    nodeId,
                    bandwidth,
                    latency,
                    uptime
                )
            ).to.emit(shiftNetwork, "NodeHeartbeat")
             .withArgs(nodeId, await time.latest(), uptime);
        });
    });

    describe("Channel Management", () => {
        const encryptionLevel = 2048;
        const sharedSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("shared_secret"));
        const operations = ["SEND", "RECEIVE"];
        let channelId: string;

        beforeEach(async () => {
            const tx = await shiftNetwork.connect(user1).createSecureChannel(
                user2.address,
                encryptionLevel,
                sharedSecret,
                operations
            );
            const receipt = await tx.wait();
            channelId = receipt.events?.[0].args?.channelId;
        });

        it("should create a secure channel", async () => {
            const channelInfo = await shiftNetwork.getChannelInfo(channelId);
            
            expect(channelInfo.initiator).to.equal(user1.address);
            expect(channelInfo.recipient).to.equal(user2.address);
            expect(channelInfo.isActive).to.be.true;
            expect(channelInfo.encryptionLevel).to.equal(encryptionLevel);
            expect(channelInfo.operations).to.deep.equal(operations);
        });

        it("should close a channel", async () => {
            const reason = "test_completion";
            
            await expect(
                shiftNetwork.connect(user1).closeChannel(channelId, reason)
            ).to.emit(shiftNetwork, "ChannelClosed")
             .withArgs(channelId, await time.latest(), reason);

            const channelInfo = await shiftNetwork.getChannelInfo(channelId);
            expect(channelInfo.isActive).to.be.false;
        });

        it("should reject channel creation with insufficient encryption", async () => {
            await expect(
                shiftNetwork.connect(user1).createSecureChannel(
                    user2.address,
                    512, // Below minimum
                    sharedSecret,
                    operations
                )
            ).to.be.revertedWith("Insufficient encryption");
        });
    });

    describe("Message Processing", () => {
        let channelId: string;
        const encryptionLevel = 2048;
        const sharedSecret = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("shared_secret"));
        const operations = ["SEND", "RECEIVE"];

        beforeEach(async () => {
            const tx = await shiftNetwork.connect(user1).createSecureChannel(
                user2.address,
                encryptionLevel,
                sharedSecret,
                operations
            );
            const receipt = await tx.wait();
            channelId = receipt.events?.[0].args?.channelId;
        });

        it("should send and process a secure message", async () => {
            const encryptedData = ethers.utils.toUtf8Bytes("encrypted_message");
            const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce"));
            const protocol = "HTTPS";
            const signature = ethers.utils.toUtf8Bytes("signature");

            const sendTx = await shiftNetwork.connect(user1).sendSecureMessage(
                channelId,
                encryptedData,
                nonce,
                protocol,
                signature
            );
            const receipt = await sendTx.wait();
            const messageId = receipt.events?.[0].args?.messageId;

            const messageInfo = await shiftNetwork.getMessageInfo(messageId);
            expect(messageInfo.sender).to.equal(user1.address);
            expect(messageInfo.recipient).to.equal(user2.address);
            expect(messageInfo.isProcessed).to.be.false;
            expect(messageInfo.protocol).to.equal(protocol);

            await expect(
                shiftNetwork.connect(user2).processMessage(messageId, channelId)
            ).to.emit(shiftNetwork, "MessageProcessed")
             .withArgs(messageId, channelId, user2.address);

            const updatedMessageInfo = await shiftNetwork.getMessageInfo(messageId);
            expect(updatedMessageInfo.isProcessed).to.be.true;
        });

        it("should reject message with used nonce", async () => {
            const encryptedData = ethers.utils.toUtf8Bytes("encrypted_message");
            const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce"));
            const protocol = "HTTPS";
            const signature = ethers.utils.toUtf8Bytes("signature");

            await shiftNetwork.connect(user1).sendSecureMessage(
                channelId,
                encryptedData,
                nonce,
                protocol,
                signature
            );

            await expect(
                shiftNetwork.connect(user1).sendSecureMessage(
                    channelId,
                    encryptedData,
                    nonce,
                    protocol,
                    signature
                )
            ).to.be.revertedWith("Nonce already used");
        });

        it("should reject message processing by non-recipient", async () => {
            const encryptedData = ethers.utils.toUtf8Bytes("encrypted_message");
            const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce"));
            const protocol = "HTTPS";
            const signature = ethers.utils.toUtf8Bytes("signature");

            const sendTx = await shiftNetwork.connect(user1).sendSecureMessage(
                channelId,
                encryptedData,
                nonce,
                protocol,
                signature
            );
            const receipt = await sendTx.wait();
            const messageId = receipt.events?.[0].args?.messageId;

            await expect(
                shiftNetwork.connect(user1).processMessage(messageId, channelId)
            ).to.be.revertedWith("Not message recipient");
        });
    });

    describe("Admin Functions", () => {
        it("should allow owner to pause and unpause", async () => {
            await shiftNetwork.connect(owner).pause();
            expect(await shiftNetwork.paused()).to.be.true;

            await shiftNetwork.connect(owner).unpause();
            expect(await shiftNetwork.paused()).to.be.false;
        });

        it("should reject operations when paused", async () => {
            await shiftNetwork.connect(owner).pause();

            const publicKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("node_public_key"));
            await expect(
                shiftNetwork.connect(nodeOperator).registerNode(
                    publicKey,
                    REGION,
                    ENCRYPTION_LEVEL,
                    CERTIFICATIONS,
                    PROTOCOLS
                )
            ).to.be.revertedWith("Paused");
        });
    });
}); 