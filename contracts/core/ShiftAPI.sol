// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ShiftAPI
 * @dev Implementation of the Shift API integration and management system
 */
contract ShiftAPI is ReentrancyGuard, Ownable, Pausable {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    struct APIClient {
        bytes32 apiKeyHash;
        uint256 nonce;
        bool isActive;
        uint256 rateLimit;
        uint256 lastRequest;
        uint256 requestCount;
        string clientName;
        string[] permissions;
        uint256 tier;
    }

    struct APIRequest {
        bytes32 requestId;
        address client;
        uint256 timestamp;
        string endpoint;
        bytes32 responseHash;
        bool completed;
    }

    struct WebhookConfig {
        string url;
        string[] events;
        bool active;
        bytes32 secretHash;
    }

    // State Variables
    mapping(address => APIClient) public clients;
    mapping(bytes32 => APIRequest) public requests;
    mapping(address => WebhookConfig) public webhooks;
    mapping(bytes32 => bool) public usedNonces;
    
    Counters.Counter private _requestIdCounter;
    
    uint256 public constant API_RATE_LIMIT_WINDOW = 1 minutes;
    uint256 public constant MAX_TIER = 3;
    uint256 public constant MAX_BATCH_SIZE = 100;

    // Events
    event ClientRegistered(
        address indexed client,
        string clientName,
        uint256 tier,
        uint256 timestamp
    );
    event APIRequestReceived(
        bytes32 indexed requestId,
        address indexed client,
        string endpoint,
        uint256 timestamp
    );
    event APIResponseSent(
        bytes32 indexed requestId,
        bytes32 responseHash,
        uint256 timestamp
    );
    event WebhookConfigured(
        address indexed client,
        string url,
        string[] events
    );
    event RateLimitUpdated(
        address indexed client,
        uint256 oldLimit,
        uint256 newLimit
    );

    constructor() {
        // Initialize contract
    }

    // Client Management

    function registerClient(
        address client,
        string memory clientName,
        bytes32 apiKeyHash,
        uint256 tier,
        uint256 rateLimit,
        string[] memory permissions
    ) external onlyOwner {
        require(tier <= MAX_TIER, "Invalid tier");
        require(rateLimit > 0, "Invalid rate limit");
        require(bytes(clientName).length > 0, "Invalid client name");
        
        clients[client] = APIClient({
            apiKeyHash: apiKeyHash,
            nonce: 0,
            isActive: true,
            rateLimit: rateLimit,
            lastRequest: 0,
            requestCount: 0,
            clientName: clientName,
            permissions: permissions,
            tier: tier
        });
        
        emit ClientRegistered(client, clientName, tier, block.timestamp);
    }

    function updateClientTier(
        address client,
        uint256 newTier,
        uint256 newRateLimit
    ) external onlyOwner {
        require(newTier <= MAX_TIER, "Invalid tier");
        require(clients[client].isActive, "Client not active");
        
        uint256 oldLimit = clients[client].rateLimit;
        clients[client].tier = newTier;
        clients[client].rateLimit = newRateLimit;
        
        emit RateLimitUpdated(client, oldLimit, newRateLimit);
    }

    // API Request Processing

    function processRequest(
        string memory endpoint,
        bytes memory data,
        bytes memory signature
    ) external nonReentrant whenNotPaused returns (bytes32) {
        APIClient storage client = clients[msg.sender];
        require(client.isActive, "Client not active");
        
        // Rate limiting
        if (block.timestamp >= client.lastRequest + API_RATE_LIMIT_WINDOW) {
            client.requestCount = 0;
            client.lastRequest = block.timestamp;
        }
        require(client.requestCount < client.rateLimit, "Rate limit exceeded");
        
        // Verify request signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            endpoint,
            data,
            client.nonce,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        // Create request record
        bytes32 requestId = bytes32(_requestIdCounter.current());
        _requestIdCounter.increment();
        
        requests[requestId] = APIRequest({
            requestId: requestId,
            client: msg.sender,
            timestamp: block.timestamp,
            endpoint: endpoint,
            responseHash: bytes32(0),
            completed: false
        });
        
        // Update state
        client.nonce++;
        client.requestCount++;
        client.lastRequest = block.timestamp;
        
        emit APIRequestReceived(requestId, msg.sender, endpoint, block.timestamp);
        return requestId;
    }

    function processBatchRequest(
        string[] memory endpoints,
        bytes[] memory dataArray,
        bytes[] memory signatures
    ) external nonReentrant whenNotPaused returns (bytes32[] memory) {
        require(
            endpoints.length == dataArray.length && 
            dataArray.length == signatures.length,
            "Array length mismatch"
        );
        require(endpoints.length <= MAX_BATCH_SIZE, "Batch too large");
        
        bytes32[] memory requestIds = new bytes32[](endpoints.length);
        for (uint256 i = 0; i < endpoints.length; i++) {
            requestIds[i] = processRequest(endpoints[i], dataArray[i], signatures[i]);
        }
        
        return requestIds;
    }

    // Webhook Configuration

    function configureWebhook(
        string memory url,
        string[] memory events,
        bytes32 secretHash
    ) external {
        require(clients[msg.sender].isActive, "Client not active");
        require(bytes(url).length > 0, "Invalid URL");
        require(events.length > 0, "No events specified");
        
        webhooks[msg.sender] = WebhookConfig({
            url: url,
            events: events,
            active: true,
            secretHash: secretHash
        });
        
        emit WebhookConfigured(msg.sender, url, events);
    }

    // Response Management

    function submitResponse(
        bytes32 requestId,
        bytes32 responseHash
    ) external onlyOwner {
        APIRequest storage request = requests[requestId];
        require(!request.completed, "Request already completed");
        
        request.responseHash = responseHash;
        request.completed = true;
        
        emit APIResponseSent(requestId, responseHash, block.timestamp);
        
        // Trigger webhook if configured
        WebhookConfig storage webhook = webhooks[request.client];
        if (webhook.active) {
            // Webhook logic would be handled off-chain
            // Event emission triggers the webhook service
        }
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

    // View Functions

    function getClientInfo(address client)
        external
        view
        returns (
            bool isActive,
            uint256 tier,
            uint256 rateLimit,
            uint256 remainingRequests,
            string memory clientName,
            string[] memory permissions
        )
    {
        APIClient storage clientInfo = clients[client];
        uint256 remaining = clientInfo.rateLimit;
        
        if (block.timestamp < clientInfo.lastRequest + API_RATE_LIMIT_WINDOW) {
            remaining = clientInfo.rateLimit - clientInfo.requestCount;
        }
        
        return (
            clientInfo.isActive,
            clientInfo.tier,
            clientInfo.rateLimit,
            remaining,
            clientInfo.clientName,
            clientInfo.permissions
        );
    }

    function getRequestInfo(bytes32 requestId)
        external
        view
        returns (
            address client,
            uint256 timestamp,
            string memory endpoint,
            bytes32 responseHash,
            bool completed
        )
    {
        APIRequest storage request = requests[requestId];
        return (
            request.client,
            request.timestamp,
            request.endpoint,
            request.responseHash,
            request.completed
        );
    }

    // Admin Functions

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 