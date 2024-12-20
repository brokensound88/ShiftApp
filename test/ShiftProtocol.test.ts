import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ShiftProtocol,
  ShiftNetwork,
  ShiftBridge,
  ShiftOracle,
  ShiftGovernance,
  ShiftToken,
  ShiftIdentity,
  ShiftAPI,
} from "../typechain-types";

describe("ShiftProtocol", () => {
  let protocol: ShiftProtocol;
  let network: ShiftNetwork;
  let bridge: ShiftBridge;
  let oracle: ShiftOracle;
  let governance: ShiftGovernance;
  let token: ShiftToken;
  let identity: ShiftIdentity;
  let api: ShiftAPI;
  let owner: SignerWithAddress;
  let validator: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;

  const networkFee = ethers.utils.parseEther("0.1");
  const bridgeFee = ethers.utils.parseEther("0.2");
  const oracleFee = ethers.utils.parseEther("0.1");
  const identityFee = ethers.utils.parseEther("0.3");
  const minStake = ethers.utils.parseEther("100000");
  const rewardRate = 500; // 5%

  beforeEach(async () => {
    [owner, validator, user, recipient] = await ethers.getSigners();

    // Deploy all components
    const NetworkFactory = await ethers.getContractFactory("ShiftNetwork");
    network = await NetworkFactory.deploy();
    await network.deployed();

    const BridgeFactory = await ethers.getContractFactory("ShiftBridge");
    bridge = await BridgeFactory.deploy();
    await bridge.deployed();

    const OracleFactory = await ethers.getContractFactory("ShiftOracle");
    oracle = await OracleFactory.deploy();
    await oracle.deployed();

    const GovernanceFactory = await ethers.getContractFactory("ShiftGovernance");
    governance = await GovernanceFactory.deploy();
    await governance.deployed();

    const TokenFactory = await ethers.getContractFactory("ShiftToken");
    token = await TokenFactory.deploy();
    await token.deployed();

    const IdentityFactory = await ethers.getContractFactory("ShiftIdentity");
    identity = await IdentityFactory.deploy();
    await identity.deployed();

    const APIFactory = await ethers.getContractFactory("ShiftAPI");
    api = await APIFactory.deploy();
    await api.deployed();

    // Deploy protocol
    const ProtocolFactory = await ethers.getContractFactory("ShiftProtocol");
    protocol = await ProtocolFactory.deploy(
      network.address,
      bridge.address,
      oracle.address,
      governance.address,
      token.address,
      identity.address,
      api.address
    );
    await protocol.deployed();
  });

  describe("Initialization", () => {
    it("should initialize with correct component addresses", async () => {
      expect(await protocol.network()).to.equal(network.address);
      expect(await protocol.bridge()).to.equal(bridge.address);
      expect(await protocol.oracle()).to.equal(oracle.address);
      expect(await protocol.governance()).to.equal(governance.address);
      expect(await protocol.token()).to.equal(token.address);
      expect(await protocol.identity()).to.equal(identity.address);
      expect(await protocol.api()).to.equal(api.address);
    });

    it("should initialize with correct protocol config", async () => {
      const config = await protocol.getProtocolConfig();
      expect(config.networkFee).to.equal(networkFee);
      expect(config.bridgeFee).to.equal(bridgeFee);
      expect(config.oracleFee).to.equal(oracleFee);
      expect(config.identityFee).to.equal(identityFee);
      expect(config.minStake).to.equal(minStake);
      expect(config.rewardRate).to.equal(rewardRate);
      expect(config.requiresIdentity).to.equal(true);
    });

    it("should initialize with correct protocol state", async () => {
      const state = await protocol.getProtocolState();
      expect(state.tvl).to.equal(0);
      expect(state.transactions).to.equal(0);
      expect(state.validators).to.equal(0);
      expect(state.nodes).to.equal(0);
      expect(state.emergency).to.equal(false);
    });
  });

  describe("Cross-Chain Operations", () => {
    const targetChain = 2;
    const amount = ethers.utils.parseEther("1");
    const tokenSymbol = "SHIFT";
    let signature: string;

    beforeEach(async () => {
      // Add target chain to supported chains
      await protocol.connect(owner).updateComponent(
        "BRIDGE",
        bridge.address
      );
      
      // Generate signature
      const message = ethers.utils.solidityKeccak256(
        ["uint256", "address", "uint256", "string"],
        [targetChain, recipient.address, amount, tokenSymbol]
      );
      signature = await owner.signMessage(ethers.utils.arrayify(message));
    });

    it("should process cross-chain operation successfully", async () => {
      const tx = await protocol.connect(user).processCrossChainOperation(
        targetChain,
        recipient.address,
        amount,
        tokenSymbol,
        signature,
        { value: amount.add(bridgeFee) }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "CrossChainOperationInitiated"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.sourceChain).to.equal(await network.provider.send("eth_chainId"));
      expect(event?.args?.targetChain).to.equal(targetChain);
    });

    it("should fail with insufficient payment", async () => {
      await expect(
        protocol.connect(user).processCrossChainOperation(
          targetChain,
          recipient.address,
          amount,
          tokenSymbol,
          signature,
          { value: amount }
        )
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Identity Verification", () => {
    const level = 2;
    const documentHash = ethers.utils.id("document");
    const ipfsHash = "QmHash";
    let signature: string;

    beforeEach(async () => {
      const message = ethers.utils.solidityKeccak256(
        ["uint256", "bytes32", "string"],
        [level, documentHash, ipfsHash]
      );
      signature = await user.signMessage(ethers.utils.arrayify(message));
    });

    it("should request identity verification successfully", async () => {
      const tx = await protocol.connect(user).requestIdentityVerification(
        level,
        documentHash,
        ipfsHash,
        signature,
        { value: identityFee }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "IdentityVerificationRequested"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.subject).to.equal(user.address);
      expect(event?.args?.level).to.equal(level);
      expect(event?.args?.documentHash).to.equal(documentHash);
    });

    it("should fail with insufficient fee", async () => {
      await expect(
        protocol.connect(user).requestIdentityVerification(
          level,
          documentHash,
          ipfsHash,
          signature,
          { value: identityFee.sub(1) }
        )
      ).to.be.revertedWith("Insufficient fee");
    });
  });

  describe("Validator Management", () => {
    const chains = ["ETH", "BSC", "MATIC"];
    let proof: string;

    beforeEach(async () => {
      const message = ethers.utils.solidityKeccak256(
        ["address", "string[]"],
        [validator.address, chains]
      );
      proof = await validator.signMessage(ethers.utils.arrayify(message));
    });

    it("should register validator successfully", async () => {
      const tx = await protocol.connect(validator).registerValidator(
        validator.address,
        chains,
        proof,
        { value: minStake }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "ValidatorStatusUpdated"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.validator).to.equal(validator.address);
      expect(event?.args?.status).to.equal(true);

      expect(await protocol.trustedValidators(validator.address)).to.equal(true);
    });

    it("should fail with insufficient stake", async () => {
      await expect(
        protocol.connect(validator).registerValidator(
          validator.address,
          chains,
          proof,
          { value: minStake.sub(1) }
        )
      ).to.be.revertedWith("Insufficient stake");
    });
  });

  describe("Emergency Controls", () => {
    it("should trigger emergency successfully", async () => {
      const tx = await protocol.connect(owner).triggerEmergency("Security breach");
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "EmergencyTriggered"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.triggeredBy).to.equal(owner.address);
      expect(event?.args?.reason).to.equal("Security breach");

      const state = await protocol.getProtocolState();
      expect(state.emergency).to.equal(true);
    });

    it("should resolve emergency successfully", async () => {
      await protocol.connect(owner).triggerEmergency("Security breach");
      await protocol.connect(owner).resolveEmergency();

      const state = await protocol.getProtocolState();
      expect(state.emergency).to.equal(false);
    });

    it("should prevent non-owner from triggering emergency", async () => {
      await expect(
        protocol.connect(user).triggerEmergency("Security breach")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Configuration Management", () => {
    const newNetworkFee = ethers.utils.parseEther("0.2");
    const newBridgeFee = ethers.utils.parseEther("0.3");
    const newOracleFee = ethers.utils.parseEther("0.2");
    const newIdentityFee = ethers.utils.parseEther("0.4");
    const newMinStake = ethers.utils.parseEther("200000");
    const newRewardRate = 1000; // 10%

    it("should update config successfully", async () => {
      await protocol.connect(owner).updateConfig(
        newNetworkFee,
        newBridgeFee,
        newOracleFee,
        newIdentityFee,
        newMinStake,
        newRewardRate,
        false
      );

      const config = await protocol.getProtocolConfig();
      expect(config.networkFee).to.equal(newNetworkFee);
      expect(config.bridgeFee).to.equal(newBridgeFee);
      expect(config.oracleFee).to.equal(newOracleFee);
      expect(config.identityFee).to.equal(newIdentityFee);
      expect(config.minStake).to.equal(newMinStake);
      expect(config.rewardRate).to.equal(newRewardRate);
      expect(config.requiresIdentity).to.equal(false);
    });

    it("should prevent non-owner from updating config", async () => {
      await expect(
        protocol.connect(user).updateConfig(
          newNetworkFee,
          newBridgeFee,
          newOracleFee,
          newIdentityFee,
          newMinStake,
          newRewardRate,
          false
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Component Updates", () => {
    let newNetwork: ShiftNetwork;

    beforeEach(async () => {
      const NetworkFactory = await ethers.getContractFactory("ShiftNetwork");
      newNetwork = await NetworkFactory.deploy();
      await newNetwork.deployed();
    });

    it("should update component successfully", async () => {
      const tx = await protocol.connect(owner).updateComponent(
        "NETWORK",
        newNetwork.address
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (e) => e.event === "ComponentUpdated"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.component).to.equal("NETWORK");
      expect(event?.args?.oldAddress).to.equal(network.address);
      expect(event?.args?.newAddress).to.equal(newNetwork.address);

      expect(await protocol.network()).to.equal(newNetwork.address);
    });

    it("should prevent non-owner from updating component", async () => {
      await expect(
        protocol.connect(user).updateComponent(
          "NETWORK",
          newNetwork.address
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should prevent updating with zero address", async () => {
      await expect(
        protocol.connect(owner).updateComponent(
          "NETWORK",
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Fee Management", () => {
    const fee = ethers.utils.parseEther("1");

    beforeEach(async () => {
      await user.sendTransaction({
        to: protocol.address,
        value: fee
      });
    });

    it("should withdraw fees successfully", async () => {
      const initialBalance = await owner.getBalance();
      
      const tx = await protocol.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await owner.getBalance();
      expect(finalBalance.sub(initialBalance)).to.equal(fee.sub(gasCost));
    });

    it("should prevent non-owner from withdrawing fees", async () => {
      await expect(
        protocol.connect(user).withdrawFees()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Pause/Unpause", () => {
    it("should pause successfully", async () => {
      await protocol.connect(owner).pause();
      expect(await protocol.paused()).to.equal(true);
    });

    it("should unpause successfully", async () => {
      await protocol.connect(owner).pause();
      await protocol.connect(owner).unpause();
      expect(await protocol.paused()).to.equal(false);
    });

    it("should prevent operations when paused", async () => {
      await protocol.connect(owner).pause();

      const level = 2;
      const documentHash = ethers.utils.id("document");
      const ipfsHash = "QmHash";
      const signature = await user.signMessage(
        ethers.utils.arrayify(
          ethers.utils.solidityKeccak256(
            ["uint256", "bytes32", "string"],
            [level, documentHash, ipfsHash]
          )
        )
      );

      await expect(
        protocol.connect(user).requestIdentityVerification(
          level,
          documentHash,
          ipfsHash,
          signature,
          { value: identityFee }
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });
}); 