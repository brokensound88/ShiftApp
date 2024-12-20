// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ShiftEscrow.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ShiftPaymentProcessor
 * @dev Implementation of the Shift Payment Processor with advanced features and security
 */
contract ShiftPaymentProcessor is ReentrancyGuard, Ownable, Pausable {
    using SafeMath for uint256;
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    IERC20 public shiftToken;
    ShiftEscrow public escrow;
    
    struct Merchant {
        bool registered;
        uint256 standardFeeRate;    // Standard fee in basis points
        uint256 volumeDiscountRate; // Discounted fee for high volume in basis points
        uint256 volumeThreshold;    // Monthly volume threshold for discount
        uint256 monthlyVolume;      // Current monthly volume
        uint256 lastResetTime;      // Last volume reset timestamp
        bool verified;              // KYC/verification status
        PaymentSettings settings;   // Merchant-specific settings
    }
    
    struct PaymentSettings {
        uint256 minAmount;         // Minimum payment amount
        uint256 maxAmount;         // Maximum payment amount
        uint256 dailyLimit;        // Daily transaction limit
        uint256 processingDelay;   // Optional processing delay
        bool requiresApproval;     // Whether payments need manual approval
        bool allowsRefunds;        // Whether merchant allows refunds
        bool allowsRecurring;      // Whether merchant accepts recurring payments
    }
    
    struct RecurringPayment {
        address payer;
        address merchant;
        uint256 amount;
        uint256 frequency;
        uint256 lastProcessed;
        uint256 nextProcessing;
        bool active;
        string description;
    }
    
    struct PaymentDispute {
        address disputer;
        uint256 amount;
        uint256 timestamp;
        string reason;
        bool resolved;
        DisputeResolution resolution;
    }
    
    enum DisputeResolution {
        None,
        RefundIssued,
        DisputeDenied,
        PartialRefund
    }
    
    struct IdentityVerification {
        bytes32 identityHash;      // Hash of KYC/identity documents
        uint256 verificationLevel; // Level of verification (1-3)
        uint256 timestamp;        // When verification was performed
        address verifier;         // Address that performed verification
        bool isValid;            // Current validity status
        string ipfsHash;         // IPFS hash of encrypted identity documents
        VerificationMetadata metadata;
    }
    
    struct VerificationMetadata {
        string jurisdiction;     // Legal jurisdiction
        uint256 expiryDate;     // Verification expiry date
        string[] documentTypes;  // Types of documents verified
        bytes32 auditTrail;     // Hash of verification audit trail
    }
    
    struct APICredentials {
        bytes32 apiKeyHash;     // Hash of API key
        uint256 nonce;         // Nonce for request signing
        bool isActive;         // Whether credentials are active
        uint256 rateLimit;     // Requests per minute
        uint256 lastRequest;   // Timestamp of last request
        uint256 requestCount;  // Number of requests in current window
    }
    
    // State Variables
    mapping(address => Merchant) public merchants;
    mapping(address => uint256) public dailyTransactionVolume;
    mapping(address => uint256) public lastTransactionTime;
    mapping(bytes32 => RecurringPayment) public recurringPayments;
    mapping(bytes32 => PaymentDispute) public disputes;
    mapping(address => bool) public blacklistedAddresses;
    mapping(address => IdentityVerification) public identityVerifications;
    mapping(address => APICredentials) public apiCredentials;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(string => bool) public usedDocumentHashes;
    
    Counters.Counter private _verificationIdCounter;
    
    uint256 public constant MAX_FEE_RATE = 1000;        // 10% max fee
    uint256 public constant DAILY_LIMIT = 1000000e18;   // Default daily limit
    uint256 public constant VOLUME_RESET_PERIOD = 30 days;
    uint256 public disputeWindow = 7 days;
    address public feeCollector;
    uint256 public constant MAX_VERIFICATION_LEVEL = 3;
    uint256 public constant API_RATE_LIMIT_WINDOW = 1 minutes;
    uint256 public constant DEFAULT_RATE_LIMIT = 100;
    
    // Events
    event MerchantRegistered(address indexed merchant, uint256 standardFeeRate, uint256 volumeDiscountRate);
    event MerchantVerified(address indexed merchant);
    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        bytes32 indexed paymentId
    );
    event RecurringPaymentCreated(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        uint256 frequency
    );
    event PaymentDisputed(
        bytes32 indexed paymentId,
        address indexed disputer,
        uint256 amount,
        string reason
    );
    event DisputeResolved(
        bytes32 indexed paymentId,
        DisputeResolution resolution,
        uint256 refundAmount
    );
    event RefundProcessed(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed customer,
        uint256 amount
    );
    event MerchantSettingsUpdated(address indexed merchant);
    event AddressBlacklisted(address indexed target, bool blacklisted);
    event IdentityVerified(
        address indexed subject,
        uint256 verificationLevel,
        uint256 timestamp,
        string jurisdiction
    );
    event VerificationRevoked(
        address indexed subject,
        string reason,
        uint256 timestamp
    );
    event APICredentialsIssued(
        address indexed client,
        uint256 rateLimit,
        uint256 timestamp
    );
    event APIRequestProcessed(
        address indexed client,
        bytes32 requestId,
        uint256 timestamp
    );
    
    constructor(
        address _shiftToken,
        address _escrow,
        address _feeCollector
    ) {
        require(_shiftToken != address(0), "Invalid token address");
        require(_escrow != address(0), "Invalid escrow address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        
        shiftToken = IERC20(_shiftToken);
        escrow = ShiftEscrow(_escrow);
        feeCollector = _feeCollector;
    }
    
    // Merchant Management
    
    function registerMerchant(
        address merchant,
        uint256 standardFeeRate,
        uint256 volumeDiscountRate,
        uint256 volumeThreshold,
        PaymentSettings memory settings
    ) external onlyOwner {
        require(standardFeeRate <= MAX_FEE_RATE, "Standard fee too high");
        require(volumeDiscountRate <= standardFeeRate, "Volume discount fee too high");
        require(settings.minAmount > 0, "Invalid minimum amount");
        require(settings.maxAmount >= settings.minAmount, "Invalid maximum amount");
        require(settings.dailyLimit <= DAILY_LIMIT, "Daily limit too high");
        
        merchants[merchant] = Merchant({
            registered: true,
            standardFeeRate: standardFeeRate,
            volumeDiscountRate: volumeDiscountRate,
            volumeThreshold: volumeThreshold,
            monthlyVolume: 0,
            lastResetTime: block.timestamp,
            verified: false,
            settings: settings
        });
        
        emit MerchantRegistered(merchant, standardFeeRate, volumeDiscountRate);
    }
    
    function verifyMerchant(address merchant) external onlyOwner {
        require(merchants[merchant].registered, "Merchant not registered");
        merchants[merchant].verified = true;
        emit MerchantVerified(merchant);
    }
    
    function updateMerchantSettings(
        address merchant,
        PaymentSettings memory newSettings
    ) external {
        require(msg.sender == merchant || msg.sender == owner(), "Unauthorized");
        require(merchants[merchant].registered, "Merchant not registered");
        
        merchants[merchant].settings = newSettings;
        emit MerchantSettingsUpdated(merchant);
    }
    
    // Payment Processing
    
    function processPayment(
        address merchant,
        uint256 amount,
        string memory description
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(!blacklistedAddresses[msg.sender], "Sender blacklisted");
        require(!blacklistedAddresses[merchant], "Merchant blacklisted");
        require(merchants[merchant].registered && merchants[merchant].verified, "Merchant not verified");
        require(amount >= merchants[merchant].settings.minAmount, "Amount below minimum");
        require(amount <= merchants[merchant].settings.maxAmount, "Amount above maximum");
        
        // Check daily limits
        require(
            dailyTransactionVolume[merchant].add(amount) <= merchants[merchant].settings.dailyLimit,
            "Daily limit exceeded"
        );
        
        // Reset daily volume if new day
        if (block.timestamp >= lastTransactionTime[merchant] + 1 days) {
            dailyTransactionVolume[merchant] = 0;
        }
        
        // Calculate fee
        uint256 feeRate = calculateFeeRate(merchant);
        uint256 fee = amount.mul(feeRate).div(10000);
        uint256 merchantAmount = amount.sub(fee);
        
        // Process transfers
        require(shiftToken.transferFrom(msg.sender, merchant, merchantAmount), "Payment transfer failed");
        require(shiftToken.transferFrom(msg.sender, feeCollector, fee), "Fee transfer failed");
        
        // Update merchant volume
        updateMerchantVolume(merchant, amount);
        
        // Generate payment ID
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                merchant,
                amount,
                block.timestamp,
                description
            )
        );
        
        emit PaymentProcessed(msg.sender, merchant, amount, fee, paymentId);
        return paymentId;
    }
    
    function setupRecurringPayment(
        address merchant,
        uint256 amount,
        uint256 frequency,
        string memory description
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(merchants[merchant].settings.allowsRecurring, "Recurring not allowed");
        require(frequency >= 1 days, "Frequency too short");
        
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                merchant,
                amount,
                frequency,
                block.timestamp,
                description
            )
        );
        
        recurringPayments[paymentId] = RecurringPayment({
            payer: msg.sender,
            merchant: merchant,
            amount: amount,
            frequency: frequency,
            lastProcessed: 0,
            nextProcessing: block.timestamp + frequency,
            active: true,
            description: description
        });
        
        emit RecurringPaymentCreated(
            paymentId,
            msg.sender,
            merchant,
            amount,
            frequency
        );
        
        return paymentId;
    }
    
    function processRecurringPayment(bytes32 paymentId) external nonReentrant whenNotPaused {
        RecurringPayment storage payment = recurringPayments[paymentId];
        require(payment.active, "Payment not active");
        require(block.timestamp >= payment.nextProcessing, "Too early");
        
        // Process the payment
        bytes32 processedPaymentId = processPayment(
            payment.merchant,
            payment.amount,
            payment.description
        );
        
        // Update recurring payment info
        payment.lastProcessed = block.timestamp;
        payment.nextProcessing = block.timestamp + payment.frequency;
        
        emit PaymentProcessed(
            payment.payer,
            payment.merchant,
            payment.amount,
            0,
            processedPaymentId
        );
    }
    
    function cancelRecurringPayment(bytes32 paymentId) external {
        RecurringPayment storage payment = recurringPayments[paymentId];
        require(msg.sender == payment.payer || msg.sender == payment.merchant, "Unauthorized");
        payment.active = false;
    }
    
    // Dispute Resolution
    
    function initiateDispute(
        bytes32 paymentId,
        string memory reason
    ) external nonReentrant {
        require(!disputes[paymentId].resolved, "Dispute already resolved");
        require(
            block.timestamp <= lastTransactionTime[msg.sender] + disputeWindow,
            "Dispute window closed"
        );
        
        disputes[paymentId] = PaymentDispute({
            disputer: msg.sender,
            amount: 0, // Will be set during resolution
            timestamp: block.timestamp,
            reason: reason,
            resolved: false,
            resolution: DisputeResolution.None
        });
        
        emit PaymentDisputed(paymentId, msg.sender, 0, reason);
    }
    
    function resolveDispute(
        bytes32 paymentId,
        DisputeResolution resolution,
        uint256 refundAmount
    ) external onlyOwner {
        PaymentDispute storage dispute = disputes[paymentId];
        require(!dispute.resolved, "Already resolved");
        
        dispute.resolved = true;
        dispute.resolution = resolution;
        
        if (resolution == DisputeResolution.RefundIssued || resolution == DisputeResolution.PartialRefund) {
            processRefund(paymentId, dispute.disputer, refundAmount);
        }
        
        emit DisputeResolved(paymentId, resolution, refundAmount);
    }
    
    // Internal Functions
    
    function calculateFeeRate(address merchant) internal view returns (uint256) {
        Merchant storage merchantInfo = merchants[merchant];
        if (merchantInfo.monthlyVolume >= merchantInfo.volumeThreshold) {
            return merchantInfo.volumeDiscountRate;
        }
        return merchantInfo.standardFeeRate;
    }
    
    function updateMerchantVolume(address merchant, uint256 amount) internal {
        Merchant storage merchantInfo = merchants[merchant];
        
        // Reset monthly volume if needed
        if (block.timestamp >= merchantInfo.lastResetTime + VOLUME_RESET_PERIOD) {
            merchantInfo.monthlyVolume = 0;
            merchantInfo.lastResetTime = block.timestamp;
        }
        
        merchantInfo.monthlyVolume = merchantInfo.monthlyVolume.add(amount);
        dailyTransactionVolume[merchant] = dailyTransactionVolume[merchant].add(amount);
        lastTransactionTime[merchant] = block.timestamp;
    }
    
    function processRefund(
        bytes32 paymentId,
        address customer,
        uint256 amount
    ) internal {
        require(shiftToken.transfer(customer, amount), "Refund transfer failed");
        emit RefundProcessed(paymentId, msg.sender, customer, amount);
    }
    
    // Admin Functions
    
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }
    
    function setDisputeWindow(uint256 newWindow) external onlyOwner {
        require(newWindow >= 1 days && newWindow <= 30 days, "Invalid window");
        disputeWindow = newWindow;
    }
    
    function blacklistAddress(address target, bool blacklisted) external onlyOwner {
        blacklistedAddresses[target] = blacklisted;
        emit AddressBlacklisted(target, blacklisted);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View Functions
    
    function getMerchantInfo(address merchant)
        external
        view
        returns (
            bool registered,
            bool verified,
            uint256 standardFeeRate,
            uint256 volumeDiscountRate,
            uint256 monthlyVolume,
            PaymentSettings memory settings
        )
    {
        Merchant storage merchantInfo = merchants[merchant];
        return (
            merchantInfo.registered,
            merchantInfo.verified,
            merchantInfo.standardFeeRate,
            merchantInfo.volumeDiscountRate,
            merchantInfo.monthlyVolume,
            merchantInfo.settings
        );
    }
    
    function getRecurringPaymentInfo(bytes32 paymentId)
        external
        view
        returns (
            address payer,
            address merchant,
            uint256 amount,
            uint256 frequency,
            uint256 nextProcessing,
            bool active
        )
    {
        RecurringPayment storage payment = recurringPayments[paymentId];
        return (
            payment.payer,
            payment.merchant,
            payment.amount,
            payment.frequency,
            payment.nextProcessing,
            payment.active
        );
    }
    
    function getDisputeInfo(bytes32 paymentId)
        external
        view
        returns (
            address disputer,
            uint256 amount,
            uint256 timestamp,
            string memory reason,
            bool resolved,
            DisputeResolution resolution
        )
    {
        PaymentDispute storage dispute = disputes[paymentId];
        return (
            dispute.disputer,
            dispute.amount,
            dispute.timestamp,
            dispute.reason,
            dispute.resolved,
            dispute.resolution
        );
    }
    
    // Identity Verification Functions
    
    function submitIdentityVerification(
        bytes32 identityHash,
        string memory ipfsHash,
        string memory jurisdiction,
        string[] memory documentTypes,
        bytes memory signature
    ) external nonReentrant whenNotPaused {
        require(!usedDocumentHashes[ipfsHash], "Documents already used");
        require(documentTypes.length > 0, "No documents provided");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            identityHash,
            ipfsHash,
            jurisdiction,
            block.timestamp
        ));
        require(!usedSignatures[messageHash], "Signature already used");
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        usedSignatures[messageHash] = true;
        usedDocumentHashes[ipfsHash] = true;
        
        // Create verification record
        identityVerifications[msg.sender] = IdentityVerification({
            identityHash: identityHash,
            verificationLevel: 1, // Start at basic level
            timestamp: block.timestamp,
            verifier: address(0), // Pending verification
            isValid: false,
            ipfsHash: ipfsHash,
            metadata: VerificationMetadata({
                jurisdiction: jurisdiction,
                expiryDate: block.timestamp + 365 days,
                documentTypes: documentTypes,
                auditTrail: messageHash
            })
        });
    }
    
    function verifyIdentity(
        address subject,
        uint256 verificationLevel,
        bytes memory verifierSignature
    ) external onlyOwner {
        require(verificationLevel <= MAX_VERIFICATION_LEVEL, "Invalid level");
        require(identityVerifications[subject].identityHash != bytes32(0), "No verification submitted");
        
        IdentityVerification storage verification = identityVerifications[subject];
        verification.verificationLevel = verificationLevel;
        verification.verifier = msg.sender;
        verification.isValid = true;
        
        emit IdentityVerified(
            subject,
            verificationLevel,
            block.timestamp,
            verification.metadata.jurisdiction
        );
    }
    
    function revokeVerification(
        address subject,
        string memory reason
    ) external onlyOwner {
        require(identityVerifications[subject].isValid, "Not verified");
        
        identityVerifications[subject].isValid = false;
        emit VerificationRevoked(subject, reason, block.timestamp);
    }
    
    // API Integration Functions
    
    function issueAPICredentials(
        address client,
        bytes32 apiKeyHash,
        uint256 rateLimit
    ) external onlyOwner {
        require(rateLimit > 0, "Invalid rate limit");
        
        apiCredentials[client] = APICredentials({
            apiKeyHash: apiKeyHash,
            nonce: 0,
            isActive: true,
            rateLimit: rateLimit,
            lastRequest: 0,
            requestCount: 0
        });
        
        emit APICredentialsIssued(client, rateLimit, block.timestamp);
    }
    
    function processAPIRequest(
        bytes32 requestId,
        bytes memory signature
    ) external nonReentrant whenNotPaused returns (bool) {
        APICredentials storage creds = apiCredentials[msg.sender];
        require(creds.isActive, "Invalid API credentials");
        
        // Rate limiting
        if (block.timestamp >= creds.lastRequest + API_RATE_LIMIT_WINDOW) {
            creds.requestCount = 0;
            creds.lastRequest = block.timestamp;
        }
        require(creds.requestCount < creds.rateLimit, "Rate limit exceeded");
        
        // Verify request signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            requestId,
            creds.nonce,
            block.timestamp
        ));
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        // Update state
        creds.nonce++;
        creds.requestCount++;
        creds.lastRequest = block.timestamp;
        
        emit APIRequestProcessed(msg.sender, requestId, block.timestamp);
        return true;
    }
    
    // Verification Helper Functions
    
    function verifySignature(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer != address(0);
    }
    
    function getIdentityVerification(address subject)
        external
        view
        returns (
            uint256 verificationLevel,
            bool isValid,
            uint256 timestamp,
            string memory jurisdiction,
            uint256 expiryDate,
            string[] memory documentTypes
        )
    {
        IdentityVerification storage verification = identityVerifications[subject];
        return (
            verification.verificationLevel,
            verification.isValid,
            verification.timestamp,
            verification.metadata.jurisdiction,
            verification.metadata.expiryDate,
            verification.metadata.documentTypes
        );
    }
    
    function getAPICredentialsStatus(address client)
        external
        view
        returns (
            bool isActive,
            uint256 rateLimit,
            uint256 remainingRequests,
            uint256 resetTime
        )
    {
        APICredentials storage creds = apiCredentials[client];
        uint256 remaining = creds.rateLimit;
        uint256 reset = 0;
        
        if (block.timestamp < creds.lastRequest + API_RATE_LIMIT_WINDOW) {
            remaining = creds.rateLimit - creds.requestCount;
            reset = creds.lastRequest + API_RATE_LIMIT_WINDOW;
        }
        
        return (
            creds.isActive,
            creds.rateLimit,
            remaining,
            reset
        );
    }
} 