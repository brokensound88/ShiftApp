import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ShiftGovernance, ShiftToken } from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ShiftGovernance", () => {
    let shiftGovernance: ShiftGovernance;
    let governanceToken: ShiftToken;
    let owner: SignerWithAddress;
    let proposer: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;
    let voter3: SignerWithAddress;
    let delegator: SignerWithAddress;
    let delegatee: SignerWithAddress;
    
    const PROPOSAL_THRESHOLD = ethers.utils.parseEther("100000");
    const MIN_VOTING_POWER = ethers.utils.parseEther("1000");
    const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
    const EXECUTION_DELAY = 2 * 24 * 60 * 60; // 2 days

    beforeEach(async () => {
        [owner, proposer, voter1, voter2, voter3, delegator, delegatee] = await ethers.getSigners();
        
        // Deploy governance token first
        const ShiftToken = await ethers.getContractFactory("ShiftToken");
        governanceToken = await ShiftToken.deploy();
        await governanceToken.deployed();
        
        // Mint tokens to participants
        await governanceToken.mint(proposer.address, PROPOSAL_THRESHOLD.mul(2));
        await governanceToken.mint(voter1.address, PROPOSAL_THRESHOLD);
        await governanceToken.mint(voter2.address, PROPOSAL_THRESHOLD);
        await governanceToken.mint(voter3.address, PROPOSAL_THRESHOLD);
        await governanceToken.mint(delegator.address, PROPOSAL_THRESHOLD);
        
        // Deploy governance contract
        const ShiftGovernance = await ethers.getContractFactory("ShiftGovernance");
        shiftGovernance = await ShiftGovernance.deploy(governanceToken.address);
        await shiftGovernance.deployed();
    });

    describe("Proposal Management", () => {
        const proposalMetadata = {
            category: "Protocol Upgrade",
            tags: ["security", "optimization"],
            documentationUrl: "https://docs.shift.com/proposals/1",
            requiredContracts: [ethers.constants.AddressZero],
            requiredValues: [ethers.utils.parseEther("1")],
            callData: ["0x"]
        };

        it("should create a proposal", async () => {
            const title = "Upgrade Protocol";
            const description = "Implement new security features";
            
            await expect(
                shiftGovernance.connect(proposer).createProposal(
                    title,
                    description,
                    0, // Generic proposal
                    proposalMetadata
                )
            ).to.emit(shiftGovernance, "ProposalCreated");

            const proposalId = ethers.constants.Zero; // First proposal
            const proposalInfo = await shiftGovernance.getProposalInfo(proposalId);
            
            expect(proposalInfo.proposer).to.equal(proposer.address);
            expect(proposalInfo.title).to.equal(title);
            expect(proposalInfo.executed).to.be.false;
        });

        it("should reject proposal from account with insufficient tokens", async () => {
            await expect(
                shiftGovernance.connect(delegatee).createProposal(
                    "Test Proposal",
                    "Test Description",
                    0,
                    proposalMetadata
                )
            ).to.be.revertedWith("Insufficient tokens to propose");
        });

        it("should handle emergency proposals", async () => {
            const title = "Emergency Security Fix";
            const description = "Critical vulnerability patch";
            
            await expect(
                shiftGovernance.connect(proposer).createProposal(
                    title,
                    description,
                    5, // Emergency proposal
                    proposalMetadata
                )
            ).to.emit(shiftGovernance, "ProposalCreated");

            const proposalId = ethers.constants.Zero;
            const proposalInfo = await shiftGovernance.getProposalInfo(proposalId);
            expect(proposalInfo.proposalType).to.equal(5);
        });
    });

    describe("Voting", () => {
        let proposalId: string;

        beforeEach(async () => {
            const tx = await shiftGovernance.connect(proposer).createProposal(
                "Test Proposal",
                "Test Description",
                0,
                {
                    category: "Test",
                    tags: ["test"],
                    documentationUrl: "https://test.com",
                    requiredContracts: [],
                    requiredValues: [],
                    callData: []
                }
            );
            const receipt = await tx.wait();
            proposalId = receipt.events?.[0].args?.proposalId;
            
            // Move time to voting period
            await time.increase(24 * 60 * 60 + 1);
        });

        it("should cast vote", async () => {
            await expect(
                shiftGovernance.connect(voter1).castVote(
                    proposalId,
                    true,
                    "Support the proposal"
                )
            ).to.emit(shiftGovernance, "VoteCast")
             .withArgs(proposalId, voter1.address, true, PROPOSAL_THRESHOLD);

            const voteInfo = await shiftGovernance.getVoteInfo(proposalId, voter1.address);
            expect(voteInfo.support).to.be.true;
            expect(voteInfo.weight).to.equal(PROPOSAL_THRESHOLD);
        });

        it("should reject double voting", async () => {
            await shiftGovernance.connect(voter1).castVote(
                proposalId,
                true,
                "Support"
            );

            await expect(
                shiftGovernance.connect(voter1).castVote(
                    proposalId,
                    true,
                    "Support again"
                )
            ).to.be.revertedWith("Already voted");
        });

        it("should reject votes with insufficient power", async () => {
            await expect(
                shiftGovernance.connect(delegatee).castVote(
                    proposalId,
                    true,
                    "Support"
                )
            ).to.be.revertedWith("Insufficient voting power");
        });
    });

    describe("Delegation", () => {
        const delegationAmount = ethers.utils.parseEther("50000");
        const duration = 30 * 24 * 60 * 60; // 30 days

        beforeEach(async () => {
            await governanceToken.connect(delegator).approve(
                shiftGovernance.address,
                delegationAmount
            );
        });

        it("should delegate voting power", async () => {
            await expect(
                shiftGovernance.connect(delegator).delegate(
                    delegatee.address,
                    delegationAmount,
                    duration
                )
            ).to.emit(shiftGovernance, "DelegateRegistered")
             .withArgs(delegator.address, delegatee.address, delegationAmount);

            const delegateInfo = await shiftGovernance.getDelegateInfo(delegator.address);
            expect(delegateInfo.delegatee).to.equal(delegatee.address);
            expect(delegateInfo.amount).to.equal(delegationAmount);
            expect(delegateInfo.active).to.be.true;
        });

        it("should calculate voting power correctly", async () => {
            await shiftGovernance.connect(delegator).delegate(
                delegatee.address,
                delegationAmount,
                duration
            );

            const delegatorPower = await shiftGovernance.calculateVotingPower(delegator.address);
            const delegateePower = await shiftGovernance.calculateVotingPower(delegatee.address);

            expect(delegatorPower).to.equal(PROPOSAL_THRESHOLD.sub(delegationAmount));
            expect(delegateePower).to.equal(delegationAmount);
        });
    });

    describe("Proposal Execution", () => {
        let proposalId: string;

        beforeEach(async () => {
            // Create proposal
            const tx = await shiftGovernance.connect(proposer).createProposal(
                "Parameter Update",
                "Update protocol parameters",
                2, // UpdateParameter
                {
                    category: "Parameters",
                    tags: ["update"],
                    documentationUrl: "https://docs.shift.com/params/1",
                    requiredContracts: [ethers.constants.AddressZero],
                    requiredValues: [ethers.utils.parseEther("2")],
                    callData: ["0x"]
                }
            );
            const receipt = await tx.wait();
            proposalId = receipt.events?.[0].args?.proposalId;

            // Move to voting period
            await time.increase(24 * 60 * 60 + 1);

            // Cast votes
            await shiftGovernance.connect(voter1).castVote(proposalId, true, "Support");
            await shiftGovernance.connect(voter2).castVote(proposalId, true, "Support");
            await shiftGovernance.connect(voter3).castVote(proposalId, true, "Support");

            // Move past voting period and execution delay
            await time.increase(VOTING_PERIOD + EXECUTION_DELAY + 1);
        });

        it("should execute passed proposal", async () => {
            await expect(
                shiftGovernance.executeProposal(proposalId)
            ).to.emit(shiftGovernance, "ProposalExecuted")
             .withArgs(proposalId, owner.address, await time.latest());

            const proposalInfo = await shiftGovernance.getProposalInfo(proposalId);
            expect(proposalInfo.executed).to.be.true;
        });

        it("should reject execution of already executed proposal", async () => {
            await shiftGovernance.executeProposal(proposalId);

            await expect(
                shiftGovernance.executeProposal(proposalId)
            ).to.be.revertedWith("Already executed");
        });

        it("should reject execution before delay period", async () => {
            // Create new proposal
            const tx = await shiftGovernance.connect(proposer).createProposal(
                "New Proposal",
                "Test",
                0,
                {
                    category: "Test",
                    tags: [],
                    documentationUrl: "",
                    requiredContracts: [],
                    requiredValues: [],
                    callData: []
                }
            );
            const receipt = await tx.wait();
            const newProposalId = receipt.events?.[0].args?.proposalId;

            // Move to voting period and cast votes
            await time.increase(24 * 60 * 60 + 1);
            await shiftGovernance.connect(voter1).castVote(newProposalId, true, "");
            await shiftGovernance.connect(voter2).castVote(newProposalId, true, "");
            await shiftGovernance.connect(voter3).castVote(newProposalId, true, "");

            // Move past voting period but not execution delay
            await time.increase(VOTING_PERIOD + 1);

            await expect(
                shiftGovernance.executeProposal(newProposalId)
            ).to.be.revertedWith("Execution delay not met");
        });
    });

    describe("Admin Functions", () => {
        it("should update proposal threshold", async () => {
            const newThreshold = ethers.utils.parseEther("200000");
            await shiftGovernance.updateProposalThreshold(newThreshold);
            expect(await shiftGovernance.PROPOSAL_THRESHOLD()).to.equal(newThreshold);
        });

        it("should update voting period", async () => {
            const newPeriod = 14 * 24 * 60 * 60; // 14 days
            await shiftGovernance.updateVotingPeriod(newPeriod);
            expect(await shiftGovernance.VOTING_PERIOD()).to.equal(newPeriod);
        });

        it("should pause and unpause", async () => {
            await shiftGovernance.pause();
            expect(await shiftGovernance.paused()).to.be.true;

            await shiftGovernance.unpause();
            expect(await shiftGovernance.paused()).to.be.false;
        });
    });
}); 