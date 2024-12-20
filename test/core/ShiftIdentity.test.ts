import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ShiftIdentity } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ShiftIdentity", () => {
    let shiftIdentity: ShiftIdentity;
    let owner: SignerWithAddress;
    let verifier: SignerWithAddress;
    let user: SignerWithAddress;
    let otherUser: SignerWithAddress;
    
    const VERIFICATION_FEE = ethers.utils.parseEther("0.1");
    const DOCUMENT_HASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("document"));
    const IPFS_HASH = "QmTest123";
    const JURISDICTION = "US";
    const DOCUMENT_TYPES = ["passport", "driverLicense"];
    const ONE_YEAR = 365 * 24 * 60 * 60;

    beforeEach(async () => {
        [owner, verifier, user, otherUser] = await ethers.getSigners();
        
        const ShiftIdentity = await ethers.getContractFactory("ShiftIdentity");
        shiftIdentity = await ShiftIdentity.deploy(VERIFICATION_FEE);
        await shiftIdentity.deployed();
        
        // Register verifier
        await shiftIdentity.registerVerifier(
            verifier.address,
            3, // trustLevel
            JURISDICTION,
            ["ISO27001", "SOC2"]
        );
    });

    describe("Identity Submission", () => {
        it("should allow users to submit identity for verification", async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftIdentity.connect(user).submitIdentity(
                    DOCUMENT_HASH,
                    IPFS_HASH,
                    JURISDICTION,
                    DOCUMENT_TYPES,
                    signature,
                    { value: VERIFICATION_FEE }
                )
            ).to.emit(shiftIdentity, "IdentitySubmitted")
             .withArgs(user.address, ethers.constants.Zero, await time.latest());
        });

        it("should reject submission with insufficient fee", async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftIdentity.connect(user).submitIdentity(
                    DOCUMENT_HASH,
                    IPFS_HASH,
                    JURISDICTION,
                    DOCUMENT_TYPES,
                    signature,
                    { value: ethers.utils.parseEther("0.05") }
                )
            ).to.be.revertedWith("Insufficient fee");
        });
    });

    describe("Verifier Management", () => {
        it("should allow owner to register verifiers", async () => {
            await expect(
                shiftIdentity.registerVerifier(
                    otherUser.address,
                    4,
                    "EU",
                    ["ISO27001"]
                )
            ).to.emit(shiftIdentity, "VerifierRegistered")
             .withArgs(otherUser.address, 4, "EU");

            const verifierInfo = await shiftIdentity.getVerifierInfo(otherUser.address);
            expect(verifierInfo.isActive).to.be.true;
            expect(verifierInfo.trustLevel).to.equal(4);
            expect(verifierInfo.jurisdiction).to.equal("EU");
            expect(verifierInfo.certifications).to.deep.equal(["ISO27001"]);
        });

        it("should reject verifier registration with invalid trust level", async () => {
            await expect(
                shiftIdentity.registerVerifier(
                    otherUser.address,
                    6,
                    "EU",
                    ["ISO27001"]
                )
            ).to.be.revertedWith("Invalid trust level");
        });
    });

    describe("Identity Verification", () => {
        let requestId: string;

        beforeEach(async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            requestId = await shiftIdentity.connect(user).callStatic.submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            await shiftIdentity.connect(user).submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );
        });

        it("should allow verifiers to verify identity", async () => {
            const verificationLevel = 2;
            const trustScore = 80;
            const resultHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("result"));
            
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "uint256", "uint256", "bytes32", "uint256"],
                    [requestId, verificationLevel, trustScore, resultHash, await time.latest()]
                )
            );
            const signature = await verifier.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftIdentity.connect(verifier).verifyIdentity(
                    requestId,
                    verificationLevel,
                    trustScore,
                    resultHash,
                    signature
                )
            ).to.emit(shiftIdentity, "IdentityVerified")
             .withArgs(user.address, verificationLevel, trustScore, await time.latest());

            const identityInfo = await shiftIdentity.getIdentityInfo(user.address);
            expect(identityInfo.verificationLevel).to.equal(verificationLevel);
            expect(identityInfo.trustScore).to.equal(trustScore);
            expect(identityInfo.isValid).to.be.true;
            expect(identityInfo.kycCompleted).to.be.true;
        });

        it("should reject verification from non-verifiers", async () => {
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "uint256", "uint256", "bytes32", "uint256"],
                    [requestId, 2, 80, ethers.utils.randomBytes(32), await time.latest()]
                )
            );
            const signature = await otherUser.signMessage(ethers.utils.arrayify(messageHash));

            await expect(
                shiftIdentity.connect(otherUser).verifyIdentity(
                    requestId,
                    2,
                    80,
                    ethers.utils.randomBytes(32),
                    signature
                )
            ).to.be.revertedWith("Not an active verifier");
        });
    });

    describe("Trust Score Management", () => {
        beforeEach(async () => {
            // Setup verified identity
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            const requestId = await shiftIdentity.connect(user).callStatic.submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            await shiftIdentity.connect(user).submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            const verificationMessageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "uint256", "uint256", "bytes32", "uint256"],
                    [requestId, 2, 80, ethers.utils.randomBytes(32), await time.latest()]
                )
            );
            const verificationSignature = await verifier.signMessage(ethers.utils.arrayify(verificationMessageHash));

            await shiftIdentity.connect(verifier).verifyIdentity(
                requestId,
                2,
                80,
                ethers.utils.randomBytes(32),
                verificationSignature
            );
        });

        it("should allow verifiers to update trust score", async () => {
            const newScore = 90;
            const reason = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("improved_score"));

            await expect(
                shiftIdentity.connect(verifier).updateTrustScore(
                    user.address,
                    newScore,
                    reason
                )
            ).to.emit(shiftIdentity, "TrustScoreUpdated")
             .withArgs(user.address, 80, newScore);

            const identityInfo = await shiftIdentity.getIdentityInfo(user.address);
            expect(identityInfo.trustScore).to.equal(newScore);
        });

        it("should reject trust score updates from non-verifiers", async () => {
            await expect(
                shiftIdentity.connect(otherUser).updateTrustScore(
                    user.address,
                    90,
                    ethers.utils.randomBytes(32)
                )
            ).to.be.revertedWith("Not an active verifier");
        });
    });

    describe("Document Management", () => {
        beforeEach(async () => {
            // Setup verified identity
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            const requestId = await shiftIdentity.connect(user).callStatic.submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            await shiftIdentity.connect(user).submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            const verificationMessageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["bytes32", "uint256", "uint256", "bytes32", "uint256"],
                    [requestId, 2, 80, ethers.utils.randomBytes(32), await time.latest()]
                )
            );
            const verificationSignature = await verifier.signMessage(ethers.utils.arrayify(verificationMessageHash));

            await shiftIdentity.connect(verifier).verifyIdentity(
                requestId,
                2,
                80,
                ethers.utils.randomBytes(32),
                verificationSignature
            );
        });

        it("should handle document expiry correctly", async () => {
            // Fast forward time past expiry
            await time.increase(ONE_YEAR + 1);

            await expect(
                shiftIdentity.connect(user).checkDocumentExpiry()
            ).to.emit(shiftIdentity, "DocumentExpired")
             .withArgs(user.address, DOCUMENT_TYPES, await time.latest());

            const identityInfo = await shiftIdentity.getIdentityInfo(user.address);
            expect(identityInfo.isValid).to.be.false;
        });

        it("should allow verifiers to revoke verification", async () => {
            const reason = "compliance_violation";
            const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("evidence"));

            await expect(
                shiftIdentity.connect(verifier).revokeVerification(
                    user.address,
                    reason,
                    evidenceHash
                )
            ).to.emit(shiftIdentity, "VerificationRevoked")
             .withArgs(user.address, reason, await time.latest());

            const identityInfo = await shiftIdentity.getIdentityInfo(user.address);
            expect(identityInfo.isValid).to.be.false;
        });
    });

    describe("Admin Functions", () => {
        it("should allow owner to update verification fee", async () => {
            const newFee = ethers.utils.parseEther("0.2");
            await shiftIdentity.setVerificationFee(newFee);
            expect(await shiftIdentity.verificationFee()).to.equal(newFee);
        });

        it("should allow owner to update document expiry period", async () => {
            const newPeriod = 180 * 24 * 60 * 60; // 180 days
            await shiftIdentity.setDocumentExpiryPeriod(newPeriod);
            expect(await shiftIdentity.documentExpiryPeriod()).to.equal(newPeriod);
        });

        it("should allow owner to withdraw fees", async () => {
            // Submit an identity to generate fees
            const messageHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "bytes32", "string", "string", "uint256"],
                    [user.address, DOCUMENT_HASH, IPFS_HASH, JURISDICTION, await time.latest()]
                )
            );
            const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

            await shiftIdentity.connect(user).submitIdentity(
                DOCUMENT_HASH,
                IPFS_HASH,
                JURISDICTION,
                DOCUMENT_TYPES,
                signature,
                { value: VERIFICATION_FEE }
            );

            const initialBalance = await owner.getBalance();
            await shiftIdentity.withdrawFees();
            const finalBalance = await owner.getBalance();

            expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                VERIFICATION_FEE,
                ethers.utils.parseEther("0.01") // Account for gas costs
            );
        });

        it("should allow owner to pause and unpause the contract", async () => {
            await shiftIdentity.pause();
            expect(await shiftIdentity.paused()).to.be.true;

            await shiftIdentity.unpause();
            expect(await shiftIdentity.paused()).to.be.false;
        });
    });
}); 