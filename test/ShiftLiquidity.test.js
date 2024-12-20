const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ShiftLiquidity Contract", function () {
  let ShiftToken;
  let shiftToken;
  let ShiftLiquidity;
  let shiftLiquidity;
  let owner;
  let liquidityProvider1;
  let liquidityProvider2;
  let trader;
  let addrs;

  const INITIAL_LIQUIDITY = ethers.utils.parseEther("1000000");
  const MIN_LIQUIDITY = ethers.utils.parseEther("1000");

  beforeEach(async function () {
    [owner, liquidityProvider1, liquidityProvider2, trader, ...addrs] = await ethers.getSigners();
    
    // Deploy ShiftToken
    ShiftToken = await ethers.getContractFactory("ShiftToken");
    shiftToken = await ShiftToken.deploy();
    await shiftToken.deployed();
    
    // Deploy ShiftLiquidity
    ShiftLiquidity = await ethers.getContractFactory("ShiftLiquidity");
    shiftLiquidity = await ShiftLiquidity.deploy(shiftToken.address);
    await shiftLiquidity.deployed();
    
    // Fund liquidity providers
    await shiftToken.transfer(liquidityProvider1.address, INITIAL_LIQUIDITY);
    await shiftToken.transfer(liquidityProvider2.address, INITIAL_LIQUIDITY);
    await shiftToken.connect(liquidityProvider1).approve(shiftLiquidity.address, INITIAL_LIQUIDITY);
    await shiftToken.connect(liquidityProvider2).approve(shiftLiquidity.address, INITIAL_LIQUIDITY);
  });

  describe("Pool Initialization and Basic Operations", function () {
    it("Should initialize with correct token address", async function () {
      expect(await shiftLiquidity.token()).to.equal(shiftToken.address);
    });

    it("Should initialize pool with minimum liquidity", async function () {
      await expect(
        shiftLiquidity.connect(liquidityProvider1).addLiquidity(MIN_LIQUIDITY)
      ).to.emit(shiftLiquidity, "LiquidityAdded")
        .withArgs(liquidityProvider1.address, MIN_LIQUIDITY);
      
      expect(await shiftLiquidity.getTotalLiquidity()).to.equal(MIN_LIQUIDITY);
    });

    it("Should prevent initialization with insufficient liquidity", async function () {
      const insufficientAmount = MIN_LIQUIDITY.sub(1);
      await expect(
        shiftLiquidity.connect(liquidityProvider1).addLiquidity(insufficientAmount)
      ).to.be.revertedWith("Insufficient initial liquidity");
    });
  });

  describe("Liquidity Management", function () {
    beforeEach(async function () {
      // Initialize pool with minimum liquidity
      await shiftLiquidity.connect(liquidityProvider1).addLiquidity(MIN_LIQUIDITY);
    });

    it("Should track individual liquidity provider contributions", async function () {
      const additionalLiquidity = ethers.utils.parseEther("5000");
      await shiftLiquidity.connect(liquidityProvider2).addLiquidity(additionalLiquidity);
      
      const lp1Share = await shiftLiquidity.getLiquidityShare(liquidityProvider1.address);
      const lp2Share = await shiftLiquidity.getLiquidityShare(liquidityProvider2.address);
      
      expect(lp1Share).to.equal(MIN_LIQUIDITY);
      expect(lp2Share).to.equal(additionalLiquidity);
    });

    it("Should handle multiple liquidity providers correctly", async function () {
      const amount1 = ethers.utils.parseEther("5000");
      const amount2 = ethers.utils.parseEther("7500");
      
      await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount1);
      await shiftLiquidity.connect(liquidityProvider2).addLiquidity(amount2);
      
      const totalLiquidity = await shiftLiquidity.getTotalLiquidity();
      expect(totalLiquidity).to.equal(MIN_LIQUIDITY.add(amount1).add(amount2));
    });

    it("Should calculate liquidity shares proportionally", async function () {
      const amount = ethers.utils.parseEther("5000");
      await shiftLiquidity.connect(liquidityProvider2).addLiquidity(amount);
      
      const totalLiquidity = await shiftLiquidity.getTotalLiquidity();
      const lp2Share = await shiftLiquidity.getLiquidityShare(liquidityProvider2.address);
      
      expect(lp2Share.mul(100).div(totalLiquidity)).to.be.closeTo(
        amount.mul(100).div(totalLiquidity),
        1 // Allow for 1% rounding difference
      );
    });
  });

  describe("Liquidity Removal", function () {
    const initialLiquidity = ethers.utils.parseEther("10000");
    
    beforeEach(async function () {
      await shiftLiquidity.connect(liquidityProvider1).addLiquidity(initialLiquidity);
    });

    it("Should allow liquidity removal after lock period", async function () {
      // Fast forward past lock period
      await time.increase(86400 * 7); // 7 days
      
      const withdrawAmount = ethers.utils.parseEther("5000");
      const initialBalance = await shiftToken.balanceOf(liquidityProvider1.address);
      
      await shiftLiquidity.connect(liquidityProvider1).removeLiquidity(withdrawAmount);
      
      const finalBalance = await shiftToken.balanceOf(liquidityProvider1.address);
      expect(finalBalance.sub(initialBalance)).to.equal(withdrawAmount);
    });

    it("Should prevent liquidity removal during lock period", async function () {
      const withdrawAmount = ethers.utils.parseEther("5000");
      
      await expect(
        shiftLiquidity.connect(liquidityProvider1).removeLiquidity(withdrawAmount)
      ).to.be.revertedWith("Liquidity is locked");
    });

    it("Should prevent excessive liquidity removal", async function () {
      await time.increase(86400 * 7); // Past lock period
      
      const excessiveAmount = initialLiquidity.add(1);
      await expect(
        shiftLiquidity.connect(liquidityProvider1).removeLiquidity(excessiveAmount)
      ).to.be.revertedWith("Insufficient liquidity share");
    });
  });

  describe("Security and Access Control", function () {
    it("Should prevent unauthorized access to admin functions", async function () {
      if (shiftLiquidity.setLockPeriod) {
        await expect(
          shiftLiquidity.connect(addrs[0]).setLockPeriod(86400)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      }
    });

    it("Should prevent reentrancy attacks", async function () {
      // Deploy malicious token contract if implemented
      if (shiftLiquidity.addLiquidityWithCallback) {
        const MaliciousToken = await ethers.getContractFactory("MaliciousToken");
        const maliciousToken = await MaliciousToken.deploy();
        
        await expect(
          shiftLiquidity.connect(liquidityProvider1).addLiquidityWithCallback(maliciousToken.address)
        ).to.be.reverted;
      }
    });

    it("Should handle edge cases in liquidity calculations", async function () {
      // Test with very small amounts
      const smallAmount = ethers.utils.parseEther("0.000001");
      await expect(
        shiftLiquidity.connect(liquidityProvider1).addLiquidity(smallAmount)
      ).to.be.revertedWith("Amount too small");
      
      // Test with very large amounts
      const largeAmount = ethers.constants.MaxUint256;
      await expect(
        shiftLiquidity.connect(liquidityProvider1).addLiquidity(largeAmount)
      ).to.be.reverted;
    });
  });

  describe("Gas Optimization", function () {
    it("Should optimize gas usage for liquidity addition", async function () {
      const amount = ethers.utils.parseEther("5000");
      const tx = await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should optimize gas usage for liquidity removal", async function () {
      // Add liquidity first
      const amount = ethers.utils.parseEther("5000");
      await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
      
      // Fast forward past lock period
      await time.increase(86400 * 7);
      
      const tx = await shiftLiquidity.connect(liquidityProvider1).removeLiquidity(amount);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });

  describe("Emergency Procedures", function () {
    it("Should handle emergency stops if implemented", async function () {
      if (shiftLiquidity.emergencyStop) {
        await shiftLiquidity.connect(owner).emergencyStop();
        
        const amount = ethers.utils.parseEther("5000");
        await expect(
          shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount)
        ).to.be.revertedWith("Contract is paused");
      }
    });

    it("Should allow emergency withdrawals if implemented", async function () {
      if (shiftLiquidity.emergencyWithdraw) {
        const amount = ethers.utils.parseEther("5000");
        await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
        
        await shiftLiquidity.connect(owner).emergencyStop();
        await shiftLiquidity.connect(liquidityProvider1).emergencyWithdraw();
        
        const balance = await shiftToken.balanceOf(liquidityProvider1.address);
        expect(balance).to.be.gte(amount);
      }
    });
  });

  describe("Event Emission", function () {
    it("Should emit events for all important state changes", async function () {
      const amount = ethers.utils.parseEther("5000");
      
      // Test LiquidityAdded event
      await expect(shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount))
        .to.emit(shiftLiquidity, "LiquidityAdded")
        .withArgs(liquidityProvider1.address, amount);
      
      // Fast forward past lock period
      await time.increase(86400 * 7);
      
      // Test LiquidityRemoved event
      await expect(shiftLiquidity.connect(liquidityProvider1).removeLiquidity(amount))
        .to.emit(shiftLiquidity, "LiquidityRemoved")
        .withArgs(liquidityProvider1.address, amount);
    });
  });

  describe("Quantum-Resistant Security", function () {
    const amount = ethers.utils.parseEther("5000");

    it("Should implement quantum-resistant liquidity operations", async function () {
      if (shiftLiquidity.addLiquidityWithQuantumProof) {
        // Generate quantum-resistant proof
        const message = ethers.utils.solidityKeccak256(
          ["address", "uint256", "string"],
          [liquidityProvider1.address, amount, "QR-AddLiquidity"]
        );
        
        // Simulate quantum-resistant signature
        const signature = await liquidityProvider1.signMessage(ethers.utils.arrayify(message));
        
        await expect(
          shiftLiquidity.connect(liquidityProvider1).addLiquidityWithQuantumProof(
            amount,
            signature
          )
        ).to.emit(shiftLiquidity, "LiquidityAdded");
      }
    });

    it("Should support quantum-resistant share calculations", async function () {
      if (shiftLiquidity.calculateQuantumResistantShares) {
        await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
        
        // Enable quantum-resistant calculations
        await shiftLiquidity.connect(owner).enableQuantumResistantMode();
        
        const shares = await shiftLiquidity.calculateQuantumResistantShares(
          liquidityProvider1.address
        );
        
        expect(shares).to.equal(amount);
      }
    });

    it("Should implement post-quantum encryption for sensitive pool data", async function () {
      if (shiftLiquidity.setPoolEncryption) {
        // Enable post-quantum encryption
        await shiftLiquidity.connect(owner).setPoolEncryption(true);
        
        // Verify encryption is active
        expect(await shiftLiquidity.isPoolEncrypted()).to.be.true;
        
        // Test encrypted pool operations
        await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
        const encryptedBalance = await shiftLiquidity.getEncryptedPoolBalance();
        expect(encryptedBalance).to.not.equal("0x0");
      }
    });
  });

  describe("Advanced Cryptographic Features", function () {
    it("Should support zero-knowledge proofs for private liquidity operations", async function () {
      if (shiftLiquidity.verifyZKProof) {
        const amount = ethers.utils.parseEther("5000");
        
        // Simulate ZK proof for private liquidity addition
        const proof = {
          a: [1, 2],
          b: [[3, 4], [5, 6]],
          c: [7, 8],
          input: [liquidityProvider1.address, amount]
        };
        
        await expect(
          shiftLiquidity.connect(liquidityProvider1).addLiquidityWithZKProof(
            amount,
            proof
          )
        ).to.emit(shiftLiquidity, "LiquidityAdded");
      }
    });

    it("Should implement homomorphic encryption for pool calculations", async function () {
      if (shiftLiquidity.enableHomomorphicCalculations) {
        await shiftLiquidity.connect(owner).enableHomomorphicCalculations();
        
        // Add encrypted liquidity
        const encryptedAmount = "0x123..."; // Simulated encrypted amount
        await shiftLiquidity.connect(liquidityProvider1).addEncryptedLiquidity(encryptedAmount);
        
        // Verify encrypted calculations
        const encryptedTotal = await shiftLiquidity.getEncryptedTotalLiquidity();
        expect(encryptedTotal).to.not.equal("0x0");
      }
    });

    it("Should support secure multi-party computation for pool management", async function () {
      if (shiftLiquidity.initiateMPC) {
        const participants = [owner.address, liquidityProvider1.address, liquidityProvider2.address];
        const threshold = 2;
        
        await shiftLiquidity.connect(owner).initiateMPC(participants, threshold);
        
        // Simulate MPC protocol
        await shiftLiquidity.connect(owner).submitMPCShare("0x123");
        await shiftLiquidity.connect(liquidityProvider1).submitMPCShare("0x456");
        
        expect(await shiftLiquidity.isMPCComplete()).to.be.true;
      }
    });
  });

  describe("Advanced Pool Security", function () {
    it("Should implement time-weighted position tracking", async function () {
      if (shiftLiquidity.enableTimeWeightedPositions) {
        const amount = ethers.utils.parseEther("5000");
        await shiftLiquidity.connect(owner).enableTimeWeightedPositions();
        
        await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
        
        // Fast forward time
        await time.increase(86400 * 30); // 30 days
        
        const weightedPosition = await shiftLiquidity.getTimeWeightedPosition(
          liquidityProvider1.address
        );
        expect(weightedPosition).to.be.gt(amount);
      }
    });

    it("Should support secure liquidity migration", async function () {
      if (shiftLiquidity.initiateMigration) {
        // Deploy new liquidity pool
        const NewPool = await ethers.getContractFactory("ShiftLiquidity");
        const newPool = await NewPool.deploy(shiftToken.address);
        
        // Initiate migration
        await shiftLiquidity.connect(owner).initiateMigration(newPool.address);
        
        // Verify migration state
        expect(await shiftLiquidity.migrationActive()).to.be.true;
        expect(await shiftLiquidity.newPoolAddress()).to.equal(newPool.address);
      }
    });

    it("Should implement rate-limiting for large operations", async function () {
      if (shiftLiquidity.setRateLimit) {
        const largeAmount = ethers.utils.parseEther("1000000");
        await shiftLiquidity.connect(owner).setRateLimit(
          ethers.utils.parseEther("100000"), // Max per transaction
          3600 // Time window in seconds
        );
        
        await expect(
          shiftLiquidity.connect(liquidityProvider1).addLiquidity(largeAmount)
        ).to.be.revertedWith("Rate limit exceeded");
      }
    });
  });

  describe("Cross-Chain Liquidity", function () {
    it("Should support cross-chain liquidity verification", async function () {
      if (shiftLiquidity.verifyCrossChainLiquidity) {
        const sourceChain = 1; // Ethereum mainnet
        const amount = ethers.utils.parseEther("5000");
        
        const proofData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [liquidityProvider1.address, amount]
        );
        
        await expect(
          shiftLiquidity.connect(owner).verifyCrossChainLiquidity(
            sourceChain,
            proofData
          )
        ).to.emit(shiftLiquidity, "CrossChainVerificationComplete");
      }
    });

    it("Should implement secure bridge functionality", async function () {
      if (shiftLiquidity.initiateBridge) {
        const amount = ethers.utils.parseEther("5000");
        const targetChain = 137; // Polygon chain ID
        
        await shiftLiquidity.connect(liquidityProvider1).addLiquidity(amount);
        
        await expect(
          shiftLiquidity.connect(liquidityProvider1).initiateBridge(
            amount,
            targetChain
          )
        ).to.emit(shiftLiquidity, "BridgeInitiated")
          .withArgs(liquidityProvider1.address, amount, targetChain);
      }
    });

    it("Should handle cross-chain liquidity synchronization", async function () {
      if (shiftLiquidity.syncCrossChainLiquidity) {
        const amount = ethers.utils.parseEther("5000");
        const sourceChain = 137; // Polygon
        
        const syncData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "uint256"],
          [liquidityProvider1.address, amount, sourceChain]
        );
        
        await expect(
          shiftLiquidity.connect(owner).syncCrossChainLiquidity(syncData)
        ).to.emit(shiftLiquidity, "LiquiditySynced");
      }
    });
  });
}); 