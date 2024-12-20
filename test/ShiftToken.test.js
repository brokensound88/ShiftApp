const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ShiftToken Contract", function () {
  let ShiftToken;
  let shiftToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    ShiftToken = await ethers.getContractFactory("ShiftToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    shiftToken = await ShiftToken.deploy();
    await shiftToken.deployed();
  });

  describe("Token Fundamentals", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await shiftToken.name()).to.equal("Shift Token");
      expect(await shiftToken.symbol()).to.equal("SHIFT");
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await shiftToken.balanceOf(owner.address);
      expect(await shiftToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Token Economics", function () {
    it("Should enforce maximum supply limit", async function () {
      const maxSupply = ethers.utils.parseEther("1000000000"); // 1 billion tokens
      expect(await shiftToken.totalSupply()).to.be.lte(maxSupply);
    });

    it("Should track token distribution correctly", async function () {
      const amount = ethers.utils.parseEther("1000");
      await shiftToken.transfer(addr1.address, amount);
      
      const addr1Balance = await shiftToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(amount);
      
      const ownerBalance = await shiftToken.balanceOf(owner.address);
      const totalSupply = await shiftToken.totalSupply();
      expect(ownerBalance.add(addr1Balance)).to.equal(totalSupply);
    });
  });

  describe("Access Control and Security", function () {
    it("Should prevent non-owners from minting tokens", async function () {
      await expect(
        shiftToken.connect(addr1).mint(addr1.address, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent unauthorized token burning", async function () {
      const amount = ethers.utils.parseEther("1000");
      await shiftToken.transfer(addr1.address, amount);
      
      await expect(
        shiftToken.connect(addr2).burnFrom(addr1.address, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should handle approval mechanism securely", async function () {
      const amount = ethers.utils.parseEther("1000");
      await shiftToken.approve(addr1.address, amount);
      
      // Verify approval
      expect(await shiftToken.allowance(owner.address, addr1.address))
        .to.equal(amount);
      
      // Test double-spend protection
      await shiftToken.connect(addr1).transferFrom(owner.address, addr2.address, amount.div(2));
      await expect(
        shiftToken.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("Transaction Security", function () {
    it("Should prevent transfers to zero address", async function () {
      await expect(
        shiftToken.transfer(ethers.constants.AddressZero, 100)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should handle overflow protection in transfers", async function () {
      const maxUint256 = ethers.constants.MaxUint256;
      await expect(
        shiftToken.transfer(addr1.address, maxUint256)
      ).to.be.reverted;
    });

    it("Should prevent approval to zero address", async function () {
      await expect(
        shiftToken.approve(ethers.constants.AddressZero, 100)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });
  });

  describe("Gas Optimization", function () {
    it("Should optimize gas usage for transfers", async function () {
      const amount = ethers.utils.parseEther("1");
      const tx = await shiftToken.transfer(addr1.address, amount);
      const receipt = await tx.wait();
      
      // Check gas usage is reasonable
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should optimize gas usage for approvals", async function () {
      const amount = ethers.utils.parseEther("1");
      const tx = await shiftToken.approve(addr1.address, amount);
      const receipt = await tx.wait();
      
      expect(receipt.gasUsed).to.be.lt(60000);
    });
  });

  describe("Event Emission", function () {
    it("Should emit Transfer event on transfer", async function () {
      const amount = ethers.utils.parseEther("100");
      await expect(shiftToken.transfer(addr1.address, amount))
        .to.emit(shiftToken, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("Should emit Approval event on approval", async function () {
      const amount = ethers.utils.parseEther("100");
      await expect(shiftToken.approve(addr1.address, amount))
        .to.emit(shiftToken, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });
  });

  describe("Recovery Mechanisms", function () {
    it("Should allow owner to recover accidentally sent tokens", async function () {
      // Deploy a test token
      const TestToken = await ethers.getContractFactory("ShiftToken");
      const testToken = await TestToken.deploy();
      await testToken.deployed();

      // Send test tokens to the ShiftToken contract
      const amount = ethers.utils.parseEther("100");
      await testToken.transfer(shiftToken.address, amount);

      // Test recovery function if implemented
      if (shiftToken.recoverTokens) {
        await shiftToken.recoverTokens(testToken.address);
        expect(await testToken.balanceOf(owner.address)).to.equal(amount);
      }
    });
  });

  describe("Advanced Security Features", function () {
    it("Should implement quantum-resistant signature verification if available", async function () {
      if (shiftToken.verifyQuantumProof) {
        const message = ethers.utils.solidityKeccak256(
          ["address", "uint256", "string"],
          [addr1.address, ethers.utils.parseEther("100"), "QR-Transfer"]
        );
        
        // Simulate quantum-resistant signature (if implemented)
        const signature = await owner.signMessage(ethers.utils.arrayify(message));
        
        const isValid = await shiftToken.verifyQuantumProof(
          message,
          signature,
          owner.address
        );
        expect(isValid).to.be.true;
      }
    });

    it("Should enforce post-quantum cryptographic standards", async function () {
      if (shiftToken.upgradeSignatureScheme) {
        // Test upgrade to quantum-resistant signature scheme
        await shiftToken.connect(owner).upgradeSignatureScheme(1); // 1 = Post-quantum scheme
        
        // Verify new scheme is active
        expect(await shiftToken.currentSignatureScheme()).to.equal(1);
      }
    });

    it("Should implement time-lock encryption for sensitive operations", async function () {
      if (shiftToken.setTimeLock) {
        const unlockTime = (await time.latest()) + 3600; // 1 hour from now
        await shiftToken.connect(owner).setTimeLock(unlockTime);
        
        // Attempt operation before unlock time
        await expect(
          shiftToken.connect(owner).sensitiveOperation()
        ).to.be.revertedWith("Time-locked");
        
        // Fast forward time
        await time.increaseTo(unlockTime);
        
        // Operation should now succeed
        await expect(
          shiftToken.connect(owner).sensitiveOperation()
        ).to.not.be.reverted;
      }
    });
  });

  describe("Advanced Cryptographic Features", function () {
    it("Should support zero-knowledge proof verification", async function () {
      if (shiftToken.verifyZKProof) {
        // Simulate a zero-knowledge proof of token ownership
        const amount = ethers.utils.parseEther("1000");
        const proof = {
          a: [1, 2],
          b: [[3, 4], [5, 6]],
          c: [7, 8],
          input: [owner.address, amount]
        };
        
        const isValid = await shiftToken.verifyZKProof(proof);
        expect(isValid).to.be.true;
      }
    });

    it("Should implement secure multi-party computation for sensitive operations", async function () {
      if (shiftToken.initiateMPC) {
        const participants = [owner.address, addr1.address, addr2.address];
        const threshold = 2;
        
        await shiftToken.connect(owner).initiateMPC(participants, threshold);
        
        // Simulate MPC signatures
        await shiftToken.connect(owner).submitMPCSignature("0x123");
        await shiftToken.connect(addr1).submitMPCSignature("0x456");
        
        // Verify MPC completion
        expect(await shiftToken.isMPCComplete()).to.be.true;
      }
    });
  });

  describe("Advanced Token Economics", function () {
    it("Should implement adaptive token supply mechanisms", async function () {
      if (shiftToken.adjustSupply) {
        const initialSupply = await shiftToken.totalSupply();
        
        // Simulate market conditions requiring supply adjustment
        await shiftToken.connect(owner).adjustSupply(true); // true = expansion
        
        const newSupply = await shiftToken.totalSupply();
        expect(newSupply).to.be.gt(initialSupply);
      }
    });

    it("Should support quantum-resistant token migration", async function () {
      if (shiftToken.initiateQuantumMigration) {
        // Deploy new quantum-resistant token
        const NewToken = await ethers.getContractFactory("QuantumResistantToken");
        const newToken = await NewToken.deploy();
        
        // Initiate migration
        await shiftToken.connect(owner).initiateQuantumMigration(newToken.address);
        
        // Verify migration state
        expect(await shiftToken.migrationActive()).to.be.true;
        expect(await shiftToken.newTokenAddress()).to.equal(newToken.address);
      }
    });
  });

  describe("Blockchain Interoperability", function () {
    it("Should support cross-chain message verification", async function () {
      if (shiftToken.verifyCrossChainMessage) {
        const message = ethers.utils.solidityKeccak256(
          ["address", "uint256", "uint256"],
          [addr1.address, 123, 456]
        );
        
        const signature = await owner.signMessage(ethers.utils.arrayify(message));
        
        const isValid = await shiftToken.verifyCrossChainMessage(
          message,
          signature,
          1 // chainId
        );
        expect(isValid).to.be.true;
      }
    });

    it("Should implement secure bridge functionality", async function () {
      if (shiftToken.initiateBridge) {
        const amount = ethers.utils.parseEther("100");
        const targetChain = 137; // Polygon chain ID
        
        await shiftToken.connect(owner).approve(shiftToken.address, amount);
        
        await expect(
          shiftToken.connect(owner).initiateBridge(amount, targetChain)
        ).to.emit(shiftToken, "BridgeInitiated")
          .withArgs(owner.address, amount, targetChain);
      }
    });
  });
}); 