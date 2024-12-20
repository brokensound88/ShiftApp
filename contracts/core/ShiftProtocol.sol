// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./ShiftNetwork.sol";
import "./ShiftBridge.sol";
import "./ShiftOracle.sol";
import "./ShiftGovernance.sol";
import "./ShiftToken.sol";
import "./ShiftIdentity.sol";
import "./ShiftAPI.sol";

/**
 * @title ShiftProtocol
 * @dev Main protocol contract that integrates all Shift components
 */
contract ShiftProtocol is ReentrancyGuard, Ownable, Pausable {
    // Core Components
    ShiftNetwork public network;
    ShiftBridge public bridge;
    ShiftOracle public oracle;
    ShiftGovernance public governance;
    ShiftToken public token;
    ShiftIdentity public identity;
    ShiftAPI public api;

    // Protocol Settings
    struct ProtocolConfig {
        uint256 networkFee;
        uint256 bridgeFee;
        uint256 oracleFee;
        uint256 identityFee;
        uint256 minStake;
        uint256 rewardRate;
        bool requiresIdentity;
    }

    // Protocol State
    struct ProtocolState {
        uint256 totalValueLocked;
        uint256 totalTransactions;
        uint256 activeValidators;
        uint256 totalNodes;
        uint256 lastUpdateTime;
        bytes32 stateRoot;
        bool emergency;
    }

    // Component Registry
    mapping(bytes32 => address) public components;
    mapping(address => bool) public authorizedUpgraders;
    mapping(bytes32 => bool) public supportedChains;
    mapping(address => bool) public trustedValidators;
    
    ProtocolConfig public config;
    ProtocolState public state;
    
    // Events
    event ComponentUpdated(
        string indexed component,
        address indexed oldAddress,
        address indexed newAddress
    );
    event ConfigUpdated(
        uint256 networkFee,
        uint256 bridgeFee,
        uint256 oracleFee,
        uint256 identityFee
    );
    event StateUpdated(
        uint256 totalValueLocked,
        uint256 totalTransactions,
        bytes32 stateRoot
    );
    event EmergencyTriggered(
        address indexed triggeredBy,
        string reason,
        uint256 timestamp
    );
    event ValidatorStatusUpdated(
        address indexed validator,
        bool status,
        uint256 timestamp
    );
    event CrossChainOperationInitiated(
        bytes32 indexed operationId,
        uint256 sourceChain,
        uint256 targetChain,
        bytes32 proofHash
    );
    event IdentityVerificationRequested(
        address indexed subject,
        uint256 level,
        bytes32 documentHash
    );

    constructor(
        address _network,
        address _bridge,
        address _oracle,
        address _governance,
        address _token,
        address _identity,
        address _api
    ) {
        require(_network != address(0), "Invalid network address");
        require(_bridge != address(0), "Invalid bridge address");
        require(_oracle != address(0), "Invalid oracle address");
        require(_governance != address(0), "Invalid governance address");
        require(_token != address(0), "Invalid token address");
        require(_identity != address(0), "Invalid identity address");
        require(_api != address(0), "Invalid API address");
        
        network = ShiftNetwork(_network);
        bridge = ShiftBridge(_bridge);
        oracle = ShiftOracle(_oracle);
        governance = ShiftGovernance(_governance);
        token = ShiftToken(_token);
        identity = ShiftIdentity(_identity);
        api = ShiftAPI(_api);
        
        // Initialize protocol config
        config = ProtocolConfig({
            networkFee: 0.1 ether,
            bridgeFee: 0.2 ether,
            oracleFee: 0.1 ether,
            identityFee: 0.3 ether,
            minStake: 100000 ether,
            rewardRate: 500, // 5%
            requiresIdentity: true
        });
        
        // Initialize protocol state
        state = ProtocolState({
            totalValueLocked: 0,
            totalTransactions: 0,
            activeValidators: 0,
            totalNodes: 0,
            lastUpdateTime: block.timestamp,
            stateRoot: bytes32(0),
            emergency: false
        });
    }

    // Integration Functions

    function processCrossChainOperation(
        uint256 targetChain,
        address recipient,
        uint256 amount,
        string memory tokenSymbol,
        bytes memory signature
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(!state.emergency, "Protocol in emergency state");
        require(supportedChains[bytes32(targetChain)], "Unsupported chain");
        require(msg.value >= amount + config.bridgeFee, "Insufficient payment");
        
        // Verify identity if required
        if (config.requiresIdentity) {
            require(
                identity.getIdentityInfo(msg.sender).isValid,
                "Identity verification required"
            );
        }
        
        // Create secure channel
        bytes32 channelId = network.createSecureChannel(
            recipient,
            1024, // Min encryption level
            keccak256(abi.encodePacked(block.timestamp, msg.sender)),
            ["TRANSFER"]
        );
        
        // Initiate bridge request
        bytes32 requestId = bridge.createCrossChainRequest(
            targetChain,
            recipient,
            amount,
            tokenSymbol,
            signature
        );
        
        // Update protocol state
        state.totalTransactions++;
        state.totalValueLocked += amount;
        state.lastUpdateTime = block.timestamp;
        
        emit CrossChainOperationInitiated(
            requestId,
            block.chainid,
            targetChain,
            keccak256(abi.encodePacked(channelId, requestId))
        );
        
        return requestId;
    }

    function requestIdentityVerification(
        uint256 level,
        bytes32 documentHash,
        string memory ipfsHash,
        bytes memory signature
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(msg.value >= config.identityFee, "Insufficient fee");
        require(level <= identity.MAX_VERIFICATION_LEVEL(), "Invalid level");
        
        // Submit verification request
        bytes32 requestId = identity.submitIdentityVerification(
            documentHash,
            ipfsHash,
            "GLOBAL",
            ["KYC", "AML"],
            signature
        );
        
        emit IdentityVerificationRequested(
            msg.sender,
            level,
            documentHash
        );
        
        return requestId;
    }

    // Validator Management

    function registerValidator(
        address validator,
        string[] memory chains,
        bytes memory proof
    ) external payable nonReentrant {
        require(msg.value >= config.minStake, "Insufficient stake");
        
        // Register with bridge
        bridge.registerValidator(chains);
        
        // Register with oracle
        oracle.registerNode(chains);
        
        // Update protocol state
        state.activeValidators++;
        trustedValidators[validator] = true;
        
        emit ValidatorStatusUpdated(
            validator,
            true,
            block.timestamp
        );
    }

    // Configuration Management

    function updateComponent(
        string memory component,
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        bytes32 componentHash = keccak256(abi.encodePacked(component));
        address oldAddress = components[componentHash];
        
        if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("NETWORK"))) {
            network = ShiftNetwork(newAddress);
        } else if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("BRIDGE"))) {
            bridge = ShiftBridge(newAddress);
        } else if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("ORACLE"))) {
            oracle = ShiftOracle(newAddress);
        } else if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("GOVERNANCE"))) {
            governance = ShiftGovernance(newAddress);
        } else if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("IDENTITY"))) {
            identity = ShiftIdentity(newAddress);
        } else if (keccak256(abi.encodePacked(component)) == keccak256(abi.encodePacked("API"))) {
            api = ShiftAPI(newAddress);
        }
        
        components[componentHash] = newAddress;
        emit ComponentUpdated(component, oldAddress, newAddress);
    }

    function updateConfig(
        uint256 _networkFee,
        uint256 _bridgeFee,
        uint256 _oracleFee,
        uint256 _identityFee,
        uint256 _minStake,
        uint256 _rewardRate,
        bool _requiresIdentity
    ) external onlyOwner {
        config.networkFee = _networkFee;
        config.bridgeFee = _bridgeFee;
        config.oracleFee = _oracleFee;
        config.identityFee = _identityFee;
        config.minStake = _minStake;
        config.rewardRate = _rewardRate;
        config.requiresIdentity = _requiresIdentity;
        
        emit ConfigUpdated(
            _networkFee,
            _bridgeFee,
            _oracleFee,
            _identityFee
        );
    }

    // Emergency Functions

    function triggerEmergency(string memory reason) external onlyOwner {
        state.emergency = true;
        
        // Pause all components
        network.pause();
        bridge.pause();
        oracle.pause();
        governance.pause();
        identity.pause();
        api.pause();
        
        emit EmergencyTriggered(msg.sender, reason, block.timestamp);
    }

    function resolveEmergency() external onlyOwner {
        state.emergency = false;
        
        // Unpause all components
        network.unpause();
        bridge.unpause();
        oracle.unpause();
        governance.unpause();
        identity.unpause();
        api.unpause();
    }

    // View Functions

    function getProtocolState() external view returns (
        uint256 tvl,
        uint256 transactions,
        uint256 validators,
        uint256 nodes,
        uint256 lastUpdate,
        bytes32 root,
        bool emergency
    ) {
        return (
            state.totalValueLocked,
            state.totalTransactions,
            state.activeValidators,
            state.totalNodes,
            state.lastUpdateTime,
            state.stateRoot,
            state.emergency
        );
    }

    function getProtocolConfig() external view returns (
        uint256 networkFee,
        uint256 bridgeFee,
        uint256 oracleFee,
        uint256 identityFee,
        uint256 minStake,
        uint256 rewardRate,
        bool requiresIdentity
    ) {
        return (
            config.networkFee,
            config.bridgeFee,
            config.oracleFee,
            config.identityFee,
            config.minStake,
            config.rewardRate,
            config.requiresIdentity
        );
    }

    // Admin Functions

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 