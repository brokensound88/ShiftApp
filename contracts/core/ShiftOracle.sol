// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title ShiftOracle
 * @dev Implementation of the Shift Oracle system for price feeds and external data
 */
contract ShiftOracle is ReentrancyGuard, Ownable, Pausable {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    struct PriceFeed {
        address aggregator;
        string symbol;
        uint256 heartbeat;
        uint256 decimals;
        uint256 lastUpdate;
        bool isActive;
        FeedConfig config;
    }

    struct FeedConfig {
        uint256 deviationThreshold;
        uint256 minPrice;
        uint256 maxPrice;
        uint256 validityPeriod;
        bool requiresValidation;
    }

    struct OracleNode {
        bool isActive;
        uint256 stake;
        uint256 updateCount;
        uint256 accuracy;
        string[] supportedFeeds;
        NodeMetrics metrics;
    }

    struct NodeMetrics {
        uint256 totalUpdates;
        uint256 validUpdates;
        uint256 averageLatency;
        uint256 reputationScore;
        uint256 lastUpdateTime;
    }

    struct PriceUpdate {
        bytes32 updateId;
        string symbol;
        uint256 price;
        uint256 timestamp;
        address reporter;
        bool isValidated;
        bytes32 proofHash;
    }

    // State Variables
    mapping(string => PriceFeed) public priceFeeds;
    mapping(address => OracleNode) public nodes;
    mapping(bytes32 => PriceUpdate) public updates;
    mapping(string => uint256) public latestPrices;
    mapping(bytes32 => mapping(address => bool)) public validations;
    
    uint256 public constant MIN_NODE_STAKE = 50000e18;
    uint256 public constant MAX_PRICE_DEVIATION = 10; // 10%
    uint256 public constant VALIDATION_THRESHOLD = 3;
    uint256 public constant UPDATE_DELAY = 5 minutes;
    
    Counters.Counter private _updateIdCounter;
    
    // Events
    event PriceFeedRegistered(
        string indexed symbol,
        address aggregator,
        uint256 heartbeat
    );
    event PriceUpdated(
        string indexed symbol,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );
    event NodeRegistered(
        address indexed node,
        uint256 stake,
        string[] supportedFeeds
    );
    event UpdateValidated(
        bytes32 indexed updateId,
        address indexed validator,
        uint256 timestamp
    );
    event FeedConfigUpdated(
        string indexed symbol,
        uint256 deviationThreshold,
        uint256 validityPeriod
    );
    event NodeSlashed(
        address indexed node,
        uint256 amount,
        string reason
    );

    constructor() {
        // Initialize oracle system
    }

    // Price Feed Management

    function registerPriceFeed(
        string memory symbol,
        address aggregator,
        uint256 heartbeat,
        FeedConfig memory config
    ) external onlyOwner {
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(aggregator != address(0), "Invalid aggregator");
        require(heartbeat > 0, "Invalid heartbeat");
        
        priceFeeds[symbol] = PriceFeed({
            aggregator: aggregator,
            symbol: symbol,
            heartbeat: heartbeat,
            decimals: AggregatorV3Interface(aggregator).decimals(),
            lastUpdate: block.timestamp,
            isActive: true,
            config: config
        });
        
        emit PriceFeedRegistered(symbol, aggregator, heartbeat);
    }

    // Node Management

    function registerNode(
        string[] memory supportedFeeds
    ) external payable nonReentrant {
        require(msg.value >= MIN_NODE_STAKE, "Insufficient stake");
        require(supportedFeeds.length > 0, "No feeds supported");
        
        nodes[msg.sender] = OracleNode({
            isActive: true,
            stake: msg.value,
            updateCount: 0,
            accuracy: 0,
            supportedFeeds: supportedFeeds,
            metrics: NodeMetrics({
                totalUpdates: 0,
                validUpdates: 0,
                averageLatency: 0,
                reputationScore: 0,
                lastUpdateTime: block.timestamp
            })
        });
        
        emit NodeRegistered(msg.sender, msg.value, supportedFeeds);
    }

    // Price Updates

    function submitPriceUpdate(
        string memory symbol,
        uint256 price,
        bytes32 proofHash,
        bytes memory signature
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(nodes[msg.sender].isActive, "Not an active node");
        require(priceFeeds[symbol].isActive, "Feed not active");
        require(
            block.timestamp >= priceFeeds[symbol].lastUpdate + UPDATE_DELAY,
            "Too early for update"
        );
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            symbol,
            price,
            proofHash,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        // Check price deviation
        uint256 oldPrice = latestPrices[symbol];
        if (oldPrice > 0) {
            uint256 deviation = calculateDeviation(oldPrice, price);
            require(
                deviation <= priceFeeds[symbol].config.deviationThreshold,
                "Price deviation too high"
            );
        }
        
        bytes32 updateId = bytes32(_updateIdCounter.current());
        _updateIdCounter.increment();
        
        updates[updateId] = PriceUpdate({
            updateId: updateId,
            symbol: symbol,
            price: price,
            timestamp: block.timestamp,
            reporter: msg.sender,
            isValidated: false,
            proofHash: proofHash
        });
        
        if (!priceFeeds[symbol].config.requiresValidation) {
            _updatePrice(symbol, price);
        }
        
        return updateId;
    }

    function validatePriceUpdate(
        bytes32 updateId,
        bool isValid,
        bytes memory signature
    ) external nonReentrant {
        require(nodes[msg.sender].isActive, "Not an active node");
        require(!validations[updateId][msg.sender], "Already validated");
        
        PriceUpdate storage update = updates[updateId];
        require(!update.isValidated, "Already validated");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            updateId,
            isValid,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        validations[updateId][msg.sender] = true;
        
        // Update node metrics
        OracleNode storage node = nodes[msg.sender];
        node.metrics.totalUpdates++;
        if (isValid) {
            node.metrics.validUpdates++;
        }
        
        emit UpdateValidated(updateId, msg.sender, block.timestamp);
        
        // Check if enough validations
        uint256 validationCount = 0;
        for (uint256 i = 0; i < VALIDATION_THRESHOLD; i++) {
            if (validations[updateId][msg.sender]) {
                validationCount++;
            }
        }
        
        if (validationCount >= VALIDATION_THRESHOLD) {
            update.isValidated = true;
            _updatePrice(update.symbol, update.price);
        }
    }

    // Internal Functions

    function _updatePrice(string memory symbol, uint256 price) internal {
        uint256 oldPrice = latestPrices[symbol];
        latestPrices[symbol] = price;
        priceFeeds[symbol].lastUpdate = block.timestamp;
        
        emit PriceUpdated(symbol, oldPrice, price, block.timestamp);
    }

    function calculateDeviation(
        uint256 oldPrice,
        uint256 newPrice
    ) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        uint256 difference = oldPrice > newPrice ? 
            oldPrice - newPrice : newPrice - oldPrice;
        return (difference * 100) / oldPrice;
    }

    function verifySignature(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer != address(0);
    }

    // View Functions

    function getLatestPrice(string memory symbol)
        external
        view
        returns (
            uint256 price,
            uint256 timestamp,
            bool isValid
        )
    {
        PriceFeed storage feed = priceFeeds[symbol];
        bool valid = block.timestamp <= feed.lastUpdate + feed.config.validityPeriod;
        return (latestPrices[symbol], feed.lastUpdate, valid);
    }

    function getNodeInfo(address node)
        external
        view
        returns (
            bool isActive,
            uint256 stake,
            uint256 updateCount,
            uint256 accuracy,
            string[] memory supportedFeeds,
            NodeMetrics memory metrics
        )
    {
        OracleNode storage oracleNode = nodes[node];
        return (
            oracleNode.isActive,
            oracleNode.stake,
            oracleNode.updateCount,
            oracleNode.accuracy,
            oracleNode.supportedFeeds,
            oracleNode.metrics
        );
    }

    function getFeedInfo(string memory symbol)
        external
        view
        returns (
            address aggregator,
            uint256 heartbeat,
            uint256 lastUpdate,
            bool isActive,
            FeedConfig memory config
        )
    {
        PriceFeed storage feed = priceFeeds[symbol];
        return (
            feed.aggregator,
            feed.heartbeat,
            feed.lastUpdate,
            feed.isActive,
            feed.config
        );
    }

    // Admin Functions

    function updateFeedConfig(
        string memory symbol,
        FeedConfig memory newConfig
    ) external onlyOwner {
        require(priceFeeds[symbol].isActive, "Feed not active");
        
        priceFeeds[symbol].config = newConfig;
        emit FeedConfigUpdated(
            symbol,
            newConfig.deviationThreshold,
            newConfig.validityPeriod
        );
    }

    function slashNode(
        address node,
        uint256 amount,
        string memory reason
    ) external onlyOwner {
        require(nodes[node].stake >= amount, "Insufficient stake");
        
        nodes[node].stake -= amount;
        if (nodes[node].stake < MIN_NODE_STAKE) {
            nodes[node].isActive = false;
        }
        
        emit NodeSlashed(node, amount, reason);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 