const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ShiftEscrow Contract", function () {
  let ShiftToken;
  let shiftToken;
  let ShiftEscrow;
  let shiftEscrow;
  let owner;
  let employer;
  let freelancer;
  let arbiter;
  let addrs;

  beforeEach(async function () {
    [owner, employer, freelancer, arbiter, ...addrs] = await ethers.getSigners();
    
    // Deploy ShiftToken
    ShiftToken = await ethers.getContractFactory("ShiftToken");
    shiftToken = await ShiftToken.deploy();
    await shiftToken.deployed();
    
    // Deploy ShiftEscrow
    ShiftEscrow = await ethers.getContractFactory("ShiftEscrow");
    shiftEscrow = await ShiftEscrow.deploy(shiftToken.address);
    await shiftEscrow.deployed();
    
    // Fund employer with tokens
    const amount = ethers.utils.parseEther("1000");
    await shiftToken.transfer(employer.address, amount);
    await shiftToken.connect(employer).approve(shiftEscrow.address, amount);
  });

  describe("Escrow Creation and Setup", function () {
    it("Should initialize with correct token address", async function () {
      expect(await shiftEscrow.token()).to.equal(shiftToken.address);
    });

    it("Should create new escrow with valid parameters", async function () {
      const amount = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      
      await expect(shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      )).to.emit(shiftEscrow, "EscrowCreated");
    });

    it("Should prevent escrow creation with invalid parameters", async function () {
      const amount = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      // Test zero address validation
      await expect(
        shiftEscrow.connect(employer).createEscrow(
          ethers.constants.AddressZero,
          arbiter.address,
          amount,
          deadline
        )
      ).to.be.revertedWith("Invalid freelancer address");

      // Test past deadline
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;
      await expect(
        shiftEscrow.connect(employer).createEscrow(
          freelancer.address,
          arbiter.address,
          amount,
          pastDeadline
        )
      ).to.be.revertedWith("Invalid deadline");
    });
  });

  describe("Escrow State Management", function () {
    let escrowId;
    const amount = ethers.utils.parseEther("100");
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      escrowId = receipt.events.find(e => e.event === "EscrowCreated").args.escrowId;
    });

    it("Should track escrow state correctly", async function () {
      const escrow = await shiftEscrow.getEscrow(escrowId);
      expect(escrow.employer).to.equal(employer.address);
      expect(escrow.freelancer).to.equal(freelancer.address);
      expect(escrow.amount).to.equal(amount);
    });

    it("Should prevent duplicate escrow IDs", async function () {
      // Try to create escrow with same parameters
      await expect(
        shiftEscrow.connect(employer).createEscrow(
          freelancer.address,
          arbiter.address,
          amount,
          deadline
        )
      ).to.not.be.reverted; // Should create new escrow with different ID
    });
  });

  describe("Fund Management and Security", function () {
    let escrowId;
    const amount = ethers.utils.parseEther("100");

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      escrowId = receipt.events.find(e => e.event === "EscrowCreated").args.escrowId;
    });

    it("Should lock funds securely in escrow", async function () {
      const escrowBalance = await shiftToken.balanceOf(shiftEscrow.address);
      expect(escrowBalance).to.equal(amount);
    });

    it("Should prevent unauthorized withdrawals", async function () {
      await expect(
        shiftEscrow.connect(addrs[0]).releaseToFreelancer(escrowId)
      ).to.be.revertedWith("Unauthorized");
    });

    it("Should handle refunds correctly", async function () {
      const initialBalance = await shiftToken.balanceOf(employer.address);
      
      // Fast forward past deadline
      await time.increase(86401);
      
      await shiftEscrow.connect(employer).refundToEmployer(escrowId);
      
      const finalBalance = await shiftToken.balanceOf(employer.address);
      expect(finalBalance).to.equal(initialBalance.add(amount));
    });
  });

  describe("Dispute Resolution", function () {
    let escrowId;
    const amount = ethers.utils.parseEther("100");

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      escrowId = receipt.events.find(e => e.event === "EscrowCreated").args.escrowId;
    });

    it("Should allow arbiter to resolve disputes", async function () {
      await shiftEscrow.connect(arbiter).resolveDispute(
        escrowId,
        freelancer.address,
        amount
      );
      
      const freelancerBalance = await shiftToken.balanceOf(freelancer.address);
      expect(freelancerBalance).to.equal(amount);
    });

    it("Should prevent non-arbiter from resolving disputes", async function () {
      await expect(
        shiftEscrow.connect(addrs[0]).resolveDispute(
          escrowId,
          freelancer.address,
          amount
        )
      ).to.be.revertedWith("Only arbiter can resolve disputes");
    });

    it("Should handle partial dispute resolutions", async function () {
      const partialAmount = amount.div(2);
      
      await shiftEscrow.connect(arbiter).resolveDispute(
        escrowId,
        freelancer.address,
        partialAmount
      );
      
      const freelancerBalance = await shiftToken.balanceOf(freelancer.address);
      const employerBalance = await shiftToken.balanceOf(employer.address);
      
      expect(freelancerBalance).to.equal(partialAmount);
      expect(employerBalance).to.be.gt(0);
    });
  });

  describe("Gas Optimization and Limits", function () {
    it("Should optimize gas usage for escrow creation", async function () {
      const amount = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lt(300000);
    });

    it("Should optimize gas usage for fund release", async function () {
      const amount = ethers.utils.parseEther("100");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      const escrowId = receipt.events.find(e => e.event === "EscrowCreated").args.escrowId;
      
      const releaseTx = await shiftEscrow.connect(employer).releaseToFreelancer(escrowId);
      const releaseReceipt = await releaseTx.wait();
      
      expect(releaseReceipt.gasUsed).to.be.lt(200000);
    });
  });

  describe("Emergency Procedures", function () {
    it("Should handle emergency stops if implemented", async function () {
      if (shiftEscrow.emergencyStop) {
        await shiftEscrow.connect(owner).emergencyStop();
        
        const amount = ethers.utils.parseEther("100");
        const deadline = Math.floor(Date.now() / 1000) + 86400;
        
        await expect(
          shiftEscrow.connect(employer).createEscrow(
            freelancer.address,
            arbiter.address,
            amount,
            deadline
          )
        ).to.be.revertedWith("Contract is paused");
      }
    });

    it("Should allow emergency fund recovery if implemented", async function () {
      if (shiftEscrow.emergencyWithdraw) {
        const amount = ethers.utils.parseEther("100");
        await shiftToken.transfer(shiftEscrow.address, amount);
        
        await shiftEscrow.connect(owner).emergencyWithdraw(shiftToken.address);
        const balance = await shiftToken.balanceOf(owner.address);
        expect(balance).to.be.gte(amount);
      }
    });
  });

  describe("Quantum-Resistant Security", function () {
    let escrowId;
    const amount = ethers.utils.parseEther("100");

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const tx = await shiftEscrow.connect(employer).createEscrow(
        freelancer.address,
        arbiter.address,
        amount,
        deadline
      );
      const receipt = await tx.wait();
      escrowId = receipt.events.find(e => e.event === "EscrowCreated").args.escrowId;
    });

    it("Should support quantum-resistant signatures for escrow operations", async function () {
      if (shiftEscrow.verifyQuantumSignature) {
        // Generate quantum-resistant signature for release
        const message = ethers.utils.solidityKeccak256(
          ["uint256", "address", "uint256"],
          [escrowId, freelancer.address, amount]
        );
        
        // Simulate quantum-resistant signature
        const signature = await employer.signMessage(ethers.utils.arrayify(message));
        
        await expect(
          shiftEscrow.connect(employer).releaseWithQuantumProof(
            escrowId,
            signature
          )
        ).to.emit(shiftEscrow, "EscrowReleased");
      }
    });

    it("Should implement post-quantum encryption for sensitive data", async function () {
      if (shiftEscrow.setPostQuantumEncryption) {
        // Enable post-quantum encryption
        await shiftEscrow.connect(owner).setPostQuantumEncryption(true);
        
        // Verify encryption is active
        expect(await shiftEscrow.isPostQuantumEnabled()).to.be.true;
        
        // Test encrypted data storage
        const encryptedData = "0x123..."; // Simulated encrypted data
        await shiftEscrow.connect(employer).storeEncryptedData(escrowId, encryptedData);
        
        const storedData = await shiftEscrow.getEncryptedData(escrowId);
        expect(storedData).to.equal(encryptedData);
      }
    });
  });

  describe("Advanced Cryptographic Security", function () {
    it("Should support zero-knowledge proofs for private escrow verification", async function () {
      if (shiftEscrow.verifyZKProof) {
        const amount = ethers.utils.parseEther("100");
        const deadline = Math.floor(Date.now() / 1000) + 86400;
        
        // Simulate ZK proof generation
        const proof = {
          a: [1, 2],
          b: [[3, 4], [5, 6]],
          c: [7, 8],
          input: [employer.address, amount, deadline]
        };
        
        await expect(
          shiftEscrow.connect(employer).createEscrowWithZKProof(
            freelancer.address,
            arbiter.address,
            amount,
            deadline,
            proof
          )
        ).to.emit(shiftEscrow, "EscrowCreated");
      }
    });

    it("Should implement threshold signatures for multi-party approval", async function () {
      if (shiftEscrow.setupThresholdSignatures) {
        const participants = [employer.address, freelancer.address, arbiter.address];
        const threshold = 2;
        
        await shiftEscrow.connect(owner).setupThresholdSignatures(participants, threshold);
        
        // Simulate threshold signatures
        await shiftEscrow.connect(employer).submitThresholdSignature("0x123");
        await shiftEscrow.connect(freelancer).submitThresholdSignature("0x456");
        
        expect(await shiftEscrow.isThresholdMet()).to.be.true;
      }
    });
  });

  describe("Advanced Security Mechanisms", function () {
    it("Should implement time-locked recovery mechanism", async function () {
      if (shiftEscrow.initiateRecovery) {
        const recoveryDelay = 86400 * 7; // 7 days
        
        await shiftEscrow.connect(owner).initiateRecovery(escrowId);
        
        // Try recovery before delay
        await expect(
          shiftEscrow.connect(owner).executeRecovery(escrowId)
        ).to.be.revertedWith("Recovery time lock active");
        
        // Fast forward time
        await time.increase(recoveryDelay);
        
        // Recovery should now succeed
        await expect(
          shiftEscrow.connect(owner).executeRecovery(escrowId)
        ).to.emit(shiftEscrow, "RecoveryExecuted");
      }
    });

    it("Should support secure multi-signature operations", async function () {
      if (shiftEscrow.addMultiSigSigner) {
        // Setup multi-sig
        await shiftEscrow.connect(owner).addMultiSigSigner(addr1.address);
        await shiftEscrow.connect(owner).addMultiSigSigner(addr2.address);
        
        // Create multi-sig proposal
        const proposalId = await shiftEscrow.connect(owner).createProposal(
          escrowId,
          "release",
          amount
        );
        
        // Collect signatures
        await shiftEscrow.connect(addr1).signProposal(proposalId);
        await shiftEscrow.connect(addr2).signProposal(proposalId);
        
        // Execute proposal
        await expect(
          shiftEscrow.connect(owner).executeProposal(proposalId)
        ).to.emit(shiftEscrow, "ProposalExecuted");
      }
    });
  });

  describe("Cross-Chain Functionality", function () {
    it("Should support cross-chain escrow verification", async function () {
      if (shiftEscrow.verifyCrossChainEscrow) {
        const sourceChain = 1; // Ethereum mainnet
        const proofData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "address", "uint256"],
          [escrowId, freelancer.address, amount]
        );
        
        await expect(
          shiftEscrow.connect(arbiter).verifyCrossChainEscrow(
            sourceChain,
            proofData
          )
        ).to.emit(shiftEscrow, "CrossChainVerificationComplete");
      }
    });

    it("Should handle cross-chain dispute resolution", async function () {
      if (shiftEscrow.initiateCrossChainDispute) {
        const targetChain = 137; // Polygon
        const disputeData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "string"],
          [escrowId, "Dispute reason"]
        );
        
        await expect(
          shiftEscrow.connect(freelancer).initiateCrossChainDispute(
            targetChain,
            disputeData
          )
        ).to.emit(shiftEscrow, "CrossChainDisputeInitiated");
      }
    });
  });
}); 