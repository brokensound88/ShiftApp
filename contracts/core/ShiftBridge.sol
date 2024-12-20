// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ShiftNetwork.sol";

/**
 * @title ShiftBridge
 * @dev Implementation of the Shift cross-chain bridge and coordination system
 */
contract ShiftBridge is ReentrancyGuard, Ownable, Pausable {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    struct ChainConfig {
        uint256 chainId;
        string name;
        bool isActive;
        uint256 confirmations;
        uint256 gasLimit;
        uint256 validatorThreshold;
        address bridgeContract;
        BridgeSettings settings;
    }

    struct BridgeSettings {
        uint256 minTransferAmount;
        uint256 maxTransferAmount;
        uint256 dailyLimit;
        uint256 processingTime;
        bool requiresKYC;
        string[] supportedTokens;
        uint256[] fees;
    }

    struct CrossChainRequest {
        bytes32 requestId;
        uint256 sourceChain;
        uint256 targetChain;
        address sender;
        address recipient;
        uint256 amount;
        string tokenSymbol;
        uint256 timestamp;
        RequestStatus status;
        bytes32 proofHash;
    }

    struct Validator {
        bool isActive;
        uint256 stake;
        uint256 validationCount;
        uint256 successRate;
        string[] supportedChains;
        ValidatorMetrics metrics;
    }

    struct ValidatorMetrics {
        uint256 totalProcessed;
        uint256 totalSuccessful;
        uint256 averageResponseTime;
        uint256 reputationScore;
        uint256 lastUpdateTime;
    }

    enum RequestStatus {
        Pending,
        InProgress,
        Completed,
        Failed,
        Disputed
    }

    // State Variables
    mapping(uint256 => ChainConfig) public chains;
    mapping(bytes32 => CrossChainRequest) public requests;
    mapping(address => Validator) public validators;
    mapping(bytes32 => mapping(address => bool)) public validations;
    mapping(uint256 => uint256) public chainNonces;
    mapping(bytes32 => bytes32[]) public proofChain;
    
    ShiftNetwork public network;
    
    uint256 public constant MIN_VALIDATOR_STAKE = 100000e18;
    uint256 public constant MAX_PROCESSING_TIME = 1 hours;
    uint256 public constant VALIDATOR_THRESHOLD = 3;
    uint256 public constant REPUTATION_MULTIPLIER = 100;
    
    Counters.Counter private _requestIdCounter;
    
    // Events
    event ChainRegistered(
        uint256 indexed chainId,
        string name,
        address bridgeContract
    );
    event CrossChainRequestCreated(
        bytes32 indexed requestId,
        uint256 indexed sourceChain,
        uint256 indexed targetChain,
        address sender,
        uint256 amount
    );
    event RequestValidated(
        bytes32 indexed requestId,
        address indexed validator,
        uint256 timestamp
    );
    event RequestCompleted(
        bytes32 indexed requestId,
        uint256 timestamp,
        bytes32 proofHash
    );
    event ValidatorRegistered(
        address indexed validator,
        uint256 stake,
        string[] supportedChains
    );
    event ValidatorSlashed(
        address indexed validator,
        uint256 amount,
        string reason
    );
    event ProofSubmitted(
        bytes32 indexed requestId,
        bytes32 proofHash,
        uint256 timestamp
    );

    constructor(address _network) {
        require(_network != address(0), "Invalid network address");
        network = ShiftNetwork(_network);
    }

    // Chain Management

    function registerChain(
        uint256 chainId,
        string memory name,
        address bridgeContract,
        uint256 confirmations,
        BridgeSettings memory settings
    ) external onlyOwner {
        require(chains[chainId].chainId == 0, "Chain already registered");
        require(bridgeContract != address(0), "Invalid bridge contract");
        require(confirmations > 0, "Invalid confirmations");
        
        chains[chainId] = ChainConfig({
            chainId: chainId,
            name: name,
            isActive: true,
            confirmations: confirmations,
            gasLimit: 2000000,
            validatorThreshold: VALIDATOR_THRESHOLD,
            bridgeContract: bridgeContract,
            settings: settings
        });
        
        emit ChainRegistered(chainId, name, bridgeContract);
    }

    // Cross-Chain Request Management

    function createCrossChainRequest(
        uint256 targetChain,
        address recipient,
        uint256 amount,
        string memory tokenSymbol,
        bytes memory signature
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        ChainConfig storage targetConfig = chains[targetChain];
        require(targetConfig.isActive, "Target chain not active");
        require(amount >= targetConfig.settings.minTransferAmount, "Amount too low");
        require(amount <= targetConfig.settings.maxTransferAmount, "Amount too high");
        
        bytes32 requestId = bytes32(_requestIdCounter.current());
        _requestIdCounter.increment();
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            targetChain,
            recipient,
            amount,
            tokenSymbol,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        requests[requestId] = CrossChainRequest({
            requestId: requestId,
            sourceChain: block.chainid,
            targetChain: targetChain,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            tokenSymbol: tokenSymbol,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            proofHash: bytes32(0)
        });
        
        emit CrossChainRequestCreated(
            requestId,
            block.chainid,
            targetChain,
            msg.sender,
            amount
        );
        
        return requestId;
    }

    // Validator Management

    function registerValidator(
        string[] memory supportedChains
    ) external payable nonReentrant {
        require(msg.value >= MIN_VALIDATOR_STAKE, "Insufficient stake");
        require(supportedChains.length > 0, "No chains supported");
        
        validators[msg.sender] = Validator({
            isActive: true,
            stake: msg.value,
            validationCount: 0,
            successRate: 0,
            supportedChains: supportedChains,
            metrics: ValidatorMetrics({
                totalProcessed: 0,
                totalSuccessful: 0,
                averageResponseTime: 0,
                reputationScore: 0,
                lastUpdateTime: block.timestamp
            })
        });
        
        emit ValidatorRegistered(msg.sender, msg.value, supportedChains);
    }

    function validateRequest(
        bytes32 requestId,
        bytes32 validationProof
    ) external nonReentrant {
        require(validators[msg.sender].isActive, "Not an active validator");
        require(!validations[requestId][msg.sender], "Already validated");
        
        CrossChainRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Pending, "Invalid request status");
        
        validations[requestId][msg.sender] = true;
        proofChain[requestId].push(validationProof);
        
        // Update validator metrics
        Validator storage validator = validators[msg.sender];
        validator.validationCount++;
        validator.metrics.totalProcessed++;
        
        emit RequestValidated(requestId, msg.sender, block.timestamp);
        
        // Check if enough validations
        if (proofChain[requestId].length >= chains[request.targetChain].validatorThreshold) {
            completeRequest(requestId);
        }
    }

    // Request Processing

    function completeRequest(bytes32 requestId) internal {
        CrossChainRequest storage request = requests[requestId];
        request.status = RequestStatus.Completed;
        request.proofHash = generateProofHash(requestId);
        
        // Update validator metrics
        for (uint256 i = 0; i < proofChain[requestId].length; i++) {
            address validator = getValidatorFromProof(proofChain[requestId][i]);
            if (validator != address(0)) {
                validators[validator].metrics.totalSuccessful++;
                updateValidatorReputation(validator, true);
            }
        }
        
        emit RequestCompleted(requestId, block.timestamp, request.proofHash);
    }

    // Proof Management

    function submitProof(
        bytes32 requestId,
        bytes32 proofHash,
        bytes memory signature
    ) external nonReentrant {
        require(validators[msg.sender].isActive, "Not an active validator");
        CrossChainRequest storage request = requests[requestId];
        require(request.status == RequestStatus.InProgress, "Invalid request status");
        
        // Verify proof signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            requestId,
            proofHash,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        proofChain[requestId].push(proofHash);
        emit ProofSubmitted(requestId, proofHash, block.timestamp);
    }

    // Helper Functions

    function verifySignature(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer != address(0);
    }

    function generateProofHash(bytes32 requestId) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            requestId,
            proofChain[requestId],
            block.timestamp
        ));
    }

    function getValidatorFromProof(bytes32 proofHash) internal pure returns (address) {
        // Implementation for extracting validator address from proof
        return address(uint160(uint256(proofHash)));
    }

    function updateValidatorReputation(address validator, bool success) internal {
        ValidatorMetrics storage metrics = validators[validator].metrics;
        uint256 oldScore = metrics.reputationScore;
        
        if (success) {
            metrics.reputationScore = oldScore + REPUTATION_MULTIPLIER;
        } else {
            metrics.reputationScore = oldScore > REPUTATION_MULTIPLIER ? 
                oldScore - REPUTATION_MULTIPLIER : 0;
        }
        
        metrics.lastUpdateTime = block.timestamp;
    }

    // View Functions

    function getChainInfo(uint256 chainId)
        external
        view
        returns (
            string memory name,
            bool isActive,
            uint256 confirmations,
            address bridgeContract,
            BridgeSettings memory settings
        )
    {
        ChainConfig storage config = chains[chainId];
        return (
            config.name,
            config.isActive,
            config.confirmations,
            config.bridgeContract,
            config.settings
        );
    }

    function getRequestInfo(bytes32 requestId)
        external
        view
        returns (
            uint256 sourceChain,
            uint256 targetChain,
            address sender,
            address recipient,
            uint256 amount,
            string memory tokenSymbol,
            RequestStatus status,
            bytes32 proofHash
        )
    {
        CrossChainRequest storage request = requests[requestId];
        return (
            request.sourceChain,
            request.targetChain,
            request.sender,
            request.recipient,
            request.amount,
            request.tokenSymbol,
            request.status,
            request.proofHash
        );
    }

    function getValidatorInfo(address validator)
        external
        view
        returns (
            bool isActive,
            uint256 stake,
            uint256 validationCount,
            uint256 successRate,
            string[] memory supportedChains,
            ValidatorMetrics memory metrics
        )
    {
        Validator storage v = validators[validator];
        return (
            v.isActive,
            v.stake,
            v.validationCount,
            v.successRate,
            v.supportedChains,
            v.metrics
        );
    }

    // Admin Functions

    function updateChainConfig(
        uint256 chainId,
        uint256 confirmations,
        uint256 gasLimit,
        uint256 validatorThreshold,
        BridgeSettings memory settings
    ) external onlyOwner {
        require(chains[chainId].chainId != 0, "Chain not registered");
        
        ChainConfig storage config = chains[chainId];
        config.confirmations = confirmations;
        config.gasLimit = gasLimit;
        config.validatorThreshold = validatorThreshold;
        config.settings = settings;
    }

    function slashValidator(
        address validator,
        uint256 amount,
        string memory reason
    ) external onlyOwner {
        require(validators[validator].stake >= amount, "Insufficient stake");
        
        validators[validator].stake -= amount;
        if (validators[validator].stake < MIN_VALIDATOR_STAKE) {
            validators[validator].isActive = false;
        }
        
        emit ValidatorSlashed(validator, amount, reason);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 