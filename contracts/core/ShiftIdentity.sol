// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ShiftIdentity
 * @dev Implementation of the Shift Identity verification system
 */
contract ShiftIdentity is ReentrancyGuard, Ownable, Pausable {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    struct Identity {
        bytes32 identityHash;        // Hash of core identity data
        uint256 verificationLevel;   // Level of verification (1-4)
        uint256 timestamp;          // When verification was performed
        address verifier;           // Address that performed verification
        bool isValid;              // Current validity status
        string ipfsHash;           // IPFS hash of encrypted identity documents
        IdentityMetadata metadata; // Additional identity metadata
    }

    struct IdentityMetadata {
        string jurisdiction;       // Legal jurisdiction
        uint256 expiryDate;       // Verification expiry date
        string[] documentTypes;    // Types of documents verified
        bytes32[] auditTrail;     // Hash trail of verification steps
        uint256 trustScore;       // Computed trust score (0-100)
        bool kycCompleted;        // KYC verification status
        bool amlChecked;          // AML check status
    }

    struct Verifier {
        bool isActive;
        uint256 trustLevel;       // Verifier trust level (1-5)
        uint256 verificationCount;
        string jurisdiction;
        string[] certifications;
    }

    struct VerificationRequest {
        address subject;
        uint256 timestamp;
        string[] documentTypes;
        bytes32 documentHash;
        bool isProcessed;
        bytes32 resultHash;
    }

    // State Variables
    mapping(address => Identity) public identities;
    mapping(address => Verifier) public verifiers;
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(string => bool) public usedDocuments;
    mapping(bytes32 => bool) public usedHashes;
    
    Counters.Counter private _requestIdCounter;
    
    uint256 public constant MAX_VERIFICATION_LEVEL = 4;
    uint256 public constant MAX_TRUST_LEVEL = 5;
    uint256 public constant MIN_TRUST_SCORE = 60;
    uint256 public verificationFee;
    uint256 public documentExpiryPeriod = 365 days;

    // Events
    event IdentitySubmitted(
        address indexed subject,
        bytes32 indexed requestId,
        uint256 timestamp
    );
    event IdentityVerified(
        address indexed subject,
        uint256 verificationLevel,
        uint256 trustScore,
        uint256 timestamp
    );
    event VerifierRegistered(
        address indexed verifier,
        uint256 trustLevel,
        string jurisdiction
    );
    event VerificationRevoked(
        address indexed subject,
        string reason,
        uint256 timestamp
    );
    event DocumentExpired(
        address indexed subject,
        string[] documentTypes,
        uint256 timestamp
    );
    event TrustScoreUpdated(
        address indexed subject,
        uint256 oldScore,
        uint256 newScore
    );

    constructor(uint256 _verificationFee) {
        verificationFee = _verificationFee;
    }

    // Identity Submission

    function submitIdentity(
        bytes32 documentHash,
        string memory ipfsHash,
        string memory jurisdiction,
        string[] memory documentTypes,
        bytes memory signature
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(msg.value >= verificationFee, "Insufficient fee");
        require(!usedDocuments[ipfsHash], "Documents already used");
        require(documentTypes.length > 0, "No documents provided");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            documentHash,
            ipfsHash,
            jurisdiction,
            block.timestamp
        ));
        require(!usedHashes[messageHash], "Signature already used");
        require(verifySignature(messageHash, signature), "Invalid signature");
        
        // Create verification request
        bytes32 requestId = bytes32(_requestIdCounter.current());
        _requestIdCounter.increment();
        
        verificationRequests[requestId] = VerificationRequest({
            subject: msg.sender,
            timestamp: block.timestamp,
            documentTypes: documentTypes,
            documentHash: documentHash,
            isProcessed: false,
            resultHash: bytes32(0)
        });
        
        // Mark documents and hashes as used
        usedDocuments[ipfsHash] = true;
        usedHashes[messageHash] = true;
        
        emit IdentitySubmitted(msg.sender, requestId, block.timestamp);
        return requestId;
    }

    // Verifier Management

    function registerVerifier(
        address verifier,
        uint256 trustLevel,
        string memory jurisdiction,
        string[] memory certifications
    ) external onlyOwner {
        require(trustLevel <= MAX_TRUST_LEVEL, "Invalid trust level");
        require(bytes(jurisdiction).length > 0, "Invalid jurisdiction");
        
        verifiers[verifier] = Verifier({
            isActive: true,
            trustLevel: trustLevel,
            verificationCount: 0,
            jurisdiction: jurisdiction,
            certifications: certifications
        });
        
        emit VerifierRegistered(verifier, trustLevel, jurisdiction);
    }

    // Verification Process

    function verifyIdentity(
        bytes32 requestId,
        uint256 verificationLevel,
        uint256 trustScore,
        bytes32 resultHash,
        bytes memory verifierSignature
    ) external nonReentrant {
        require(verifiers[msg.sender].isActive, "Not an active verifier");
        require(verificationLevel <= MAX_VERIFICATION_LEVEL, "Invalid level");
        require(trustScore <= 100, "Invalid trust score");
        
        VerificationRequest storage request = verificationRequests[requestId];
        require(!request.isProcessed, "Request already processed");
        
        // Verify the verification result
        bytes32 messageHash = keccak256(abi.encodePacked(
            requestId,
            verificationLevel,
            trustScore,
            resultHash,
            block.timestamp
        ));
        require(verifySignature(messageHash, verifierSignature), "Invalid signature");
        
        // Update request status
        request.isProcessed = true;
        request.resultHash = resultHash;
        
        // Create or update identity record
        Identity storage identity = identities[request.subject];
        identity.identityHash = request.documentHash;
        identity.verificationLevel = verificationLevel;
        identity.timestamp = block.timestamp;
        identity.verifier = msg.sender;
        identity.isValid = true;
        
        // Update metadata
        identity.metadata.trustScore = trustScore;
        identity.metadata.auditTrail.push(resultHash);
        identity.metadata.kycCompleted = true;
        identity.metadata.expiryDate = block.timestamp + documentExpiryPeriod;
        
        // Update verifier stats
        verifiers[msg.sender].verificationCount++;
        
        emit IdentityVerified(
            request.subject,
            verificationLevel,
            trustScore,
            block.timestamp
        );
    }

    // Trust Score Management

    function updateTrustScore(
        address subject,
        uint256 newScore,
        bytes32 reason
    ) external {
        require(verifiers[msg.sender].isActive, "Not an active verifier");
        require(newScore <= 100, "Invalid trust score");
        require(identities[subject].isValid, "Identity not valid");
        
        uint256 oldScore = identities[subject].metadata.trustScore;
        identities[subject].metadata.trustScore = newScore;
        identities[subject].metadata.auditTrail.push(reason);
        
        emit TrustScoreUpdated(subject, oldScore, newScore);
    }

    // Document Management

    function checkDocumentExpiry() external {
        Identity storage identity = identities[msg.sender];
        require(identity.isValid, "Identity not valid");
        
        if (block.timestamp >= identity.metadata.expiryDate) {
            identity.isValid = false;
            emit DocumentExpired(
                msg.sender,
                identity.metadata.documentTypes,
                block.timestamp
            );
        }
    }

    // Revocation

    function revokeVerification(
        address subject,
        string memory reason,
        bytes32 evidenceHash
    ) external {
        require(verifiers[msg.sender].isActive, "Not an active verifier");
        require(identities[subject].isValid, "Identity not valid");
        
        Identity storage identity = identities[subject];
        identity.isValid = false;
        identity.metadata.auditTrail.push(evidenceHash);
        
        emit VerificationRevoked(subject, reason, block.timestamp);
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

    function getIdentityInfo(address subject)
        external
        view
        returns (
            uint256 verificationLevel,
            uint256 trustScore,
            bool isValid,
            uint256 expiryDate,
            string memory jurisdiction,
            bool kycCompleted,
            bool amlChecked
        )
    {
        Identity storage identity = identities[subject];
        IdentityMetadata storage metadata = identity.metadata;
        
        return (
            identity.verificationLevel,
            metadata.trustScore,
            identity.isValid,
            metadata.expiryDate,
            metadata.jurisdiction,
            metadata.kycCompleted,
            metadata.amlChecked
        );
    }

    function getVerifierInfo(address verifier)
        external
        view
        returns (
            bool isActive,
            uint256 trustLevel,
            uint256 verificationCount,
            string memory jurisdiction,
            string[] memory certifications
        )
    {
        Verifier storage v = verifiers[verifier];
        return (
            v.isActive,
            v.trustLevel,
            v.verificationCount,
            v.jurisdiction,
            v.certifications
        );
    }

    // Admin Functions

    function setVerificationFee(uint256 newFee) external onlyOwner {
        verificationFee = newFee;
    }

    function setDocumentExpiryPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 30 days, "Period too short");
        documentExpiryPeriod = newPeriod;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 