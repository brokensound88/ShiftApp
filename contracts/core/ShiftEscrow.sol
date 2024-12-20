// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ShiftEscrow
 * @dev Implementation of the Shift Escrow system with time-locks and dispute resolution
 */
contract ShiftEscrow is ReentrancyGuard, Ownable, Pausable {
    IERC20 public shiftToken;
    
    // Escrow States
    enum EscrowState { 
        Created,    // Initial state
        Locked,     // Funds locked in time-lock
        Disputed,   // Under dispute resolution
        Resolved,   // Dispute resolved
        Released,   // Funds released to payee
        Refunded,   // Funds returned to payer
        Cancelled   // Escrow cancelled
    }
    
    // Dispute Resolution
    enum DisputeResolution {
        None,           // No dispute
        RefundToPayer,  // Resolve in favor of payer
        PayToPayee,     // Resolve in favor of payee
        Split          // Split between parties
    }
    
    struct TimeLock {
        uint256 releaseTime;
        bool isActive;
    }
    
    struct Dispute {
        address initiator;
        string reason;
        uint256 timestamp;
        DisputeResolution resolution;
        string evidence;
        bool isResolved;
    }
    
    struct Payment {
        address payer;
        address payee;
        address arbiter;
        uint256 amount;
        EscrowState state;
        uint256 createdAt;
        TimeLock timeLock;
        Dispute dispute;
        uint256 payerPercentage;  // For split resolutions (in basis points)
    }
    
    // State Variables
    mapping(bytes32 => Payment) public payments;
    mapping(address => bool) public approvedArbiters;
    uint256 public minLockPeriod = 1 days;
    uint256 public maxLockPeriod = 30 days;
    uint256 public disputeTimeout = 7 days;
    
    // Events
    event PaymentCreated(bytes32 indexed paymentId, address payer, address payee, uint256 amount);
    event PaymentLocked(bytes32 indexed paymentId, uint256 releaseTime);
    event PaymentReleased(bytes32 indexed paymentId);
    event PaymentRefunded(bytes32 indexed paymentId);
    event DisputeInitiated(bytes32 indexed paymentId, address initiator, string reason);
    event DisputeResolved(bytes32 indexed paymentId, DisputeResolution resolution);
    event ArbiterUpdated(address arbiter, bool approved);
    event TimeLockUpdated(bytes32 indexed paymentId, uint256 releaseTime);
    event EvidenceSubmitted(bytes32 indexed paymentId, address submitter, string evidence);
    
    constructor(address _shiftToken) {
        require(_shiftToken != address(0), "Invalid token address");
        shiftToken = IERC20(_shiftToken);
        approvedArbiters[msg.sender] = true;
    }
    
    // Escrow Logic
    
    function createEscrow(
        address payee,
        address arbiter,
        uint256 amount,
        uint256 lockPeriod
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(payee != address(0), "Invalid payee address");
        require(arbiter != address(0), "Invalid arbiter address");
        require(approvedArbiters[arbiter], "Arbiter not approved");
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriod >= minLockPeriod && lockPeriod <= maxLockPeriod, "Invalid lock period");
        
        bytes32 escrowId = keccak256(
            abi.encodePacked(msg.sender, payee, amount, block.timestamp)
        );
        
        require(shiftToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        payments[escrowId] = Payment({
            payer: msg.sender,
            payee: payee,
            arbiter: arbiter,
            amount: amount,
            state: EscrowState.Created,
            createdAt: block.timestamp,
            timeLock: TimeLock({
                releaseTime: block.timestamp + lockPeriod,
                isActive: true
            }),
            dispute: Dispute({
                initiator: address(0),
                reason: "",
                timestamp: 0,
                resolution: DisputeResolution.None,
                evidence: "",
                isResolved: false
            }),
            payerPercentage: 0
        });
        
        emit PaymentCreated(escrowId, msg.sender, payee, amount);
        emit PaymentLocked(escrowId, block.timestamp + lockPeriod);
        
        return escrowId;
    }
    
    // Time-Lock Features
    
    function updateTimeLock(bytes32 escrowId, uint256 newLockPeriod) external {
        Payment storage payment = payments[escrowId];
        require(msg.sender == payment.payer || msg.sender == payment.payee, "Unauthorized");
        require(payment.state == EscrowState.Created || payment.state == EscrowState.Locked, "Invalid state");
        require(newLockPeriod >= minLockPeriod && newLockPeriod <= maxLockPeriod, "Invalid lock period");
        
        payment.timeLock.releaseTime = block.timestamp + newLockPeriod;
        emit TimeLockUpdated(escrowId, payment.timeLock.releaseTime);
    }
    
    function releaseEscrow(bytes32 escrowId) external nonReentrant {
        Payment storage payment = payments[escrowId];
        require(msg.sender == payment.payee, "Only payee can release");
        require(payment.state == EscrowState.Created || payment.state == EscrowState.Locked, "Invalid state");
        require(block.timestamp >= payment.timeLock.releaseTime, "Time lock active");
        require(!payment.dispute.isResolved, "Dispute must be resolved first");
        
        payment.state = EscrowState.Released;
        require(shiftToken.transfer(payment.payee, payment.amount), "Transfer failed");
        
        emit PaymentReleased(escrowId);
    }
    
    // Dispute Resolution
    
    function initiateDispute(bytes32 escrowId, string calldata reason) external {
        Payment storage payment = payments[escrowId];
        require(msg.sender == payment.payer || msg.sender == payment.payee, "Unauthorized");
        require(payment.state == EscrowState.Created || payment.state == EscrowState.Locked, "Invalid state");
        require(!payment.dispute.isResolved, "Dispute already resolved");
        
        payment.state = EscrowState.Disputed;
        payment.dispute.initiator = msg.sender;
        payment.dispute.reason = reason;
        payment.dispute.timestamp = block.timestamp;
        
        emit DisputeInitiated(escrowId, msg.sender, reason);
    }
    
    function submitEvidence(bytes32 escrowId, string calldata evidence) external {
        Payment storage payment = payments[escrowId];
        require(
            msg.sender == payment.payer || 
            msg.sender == payment.payee || 
            msg.sender == payment.arbiter,
            "Unauthorized"
        );
        require(payment.state == EscrowState.Disputed, "Not in dispute");
        
        payment.dispute.evidence = evidence;
        emit EvidenceSubmitted(escrowId, msg.sender, evidence);
    }
    
    function resolveDispute(
        bytes32 escrowId,
        DisputeResolution resolution,
        uint256 payerPercentage
    ) external nonReentrant {
        Payment storage payment = payments[escrowId];
        require(msg.sender == payment.arbiter, "Only arbiter can resolve");
        require(payment.state == EscrowState.Disputed, "Not in dispute");
        require(!payment.dispute.isResolved, "Already resolved");
        require(payerPercentage <= 10000, "Invalid percentage");
        
        payment.dispute.resolution = resolution;
        payment.dispute.isResolved = true;
        payment.state = EscrowState.Resolved;
        payment.payerPercentage = payerPercentage;
        
        uint256 payerAmount;
        uint256 payeeAmount;
        
        if (resolution == DisputeResolution.RefundToPayer) {
            payerAmount = payment.amount;
            payeeAmount = 0;
        } else if (resolution == DisputeResolution.PayToPayee) {
            payerAmount = 0;
            payeeAmount = payment.amount;
        } else if (resolution == DisputeResolution.Split) {
            payerAmount = (payment.amount * payerPercentage) / 10000;
            payeeAmount = payment.amount - payerAmount;
        }
        
        if (payerAmount > 0) {
            require(shiftToken.transfer(payment.payer, payerAmount), "Payer transfer failed");
        }
        if (payeeAmount > 0) {
            require(shiftToken.transfer(payment.payee, payeeAmount), "Payee transfer failed");
        }
        
        emit DisputeResolved(escrowId, resolution);
    }
    
    // Admin Functions
    
    function setArbiter(address arbiter, bool approved) external onlyOwner {
        require(arbiter != address(0), "Invalid arbiter address");
        approvedArbiters[arbiter] = approved;
        emit ArbiterUpdated(arbiter, approved);
    }
    
    function updateLockPeriods(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin <= newMax, "Invalid periods");
        minLockPeriod = newMin;
        maxLockPeriod = newMax;
    }
    
    function updateDisputeTimeout(uint256 newTimeout) external onlyOwner {
        require(newTimeout >= 1 days, "Timeout too short");
        disputeTimeout = newTimeout;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View Functions
    
    function getEscrow(bytes32 escrowId) external view returns (
        address payer,
        address payee,
        address arbiter,
        uint256 amount,
        EscrowState state,
        uint256 releaseTime,
        bool isDisputed,
        DisputeResolution resolution
    ) {
        Payment storage payment = payments[escrowId];
        return (
            payment.payer,
            payment.payee,
            payment.arbiter,
            payment.amount,
            payment.state,
            payment.timeLock.releaseTime,
            payment.state == EscrowState.Disputed,
            payment.dispute.resolution
        );
    }
    
    function getDispute(bytes32 escrowId) external view returns (
        address initiator,
        string memory reason,
        uint256 timestamp,
        bool isResolved,
        string memory evidence
    ) {
        Dispute storage dispute = payments[escrowId].dispute;
        return (
            dispute.initiator,
            dispute.reason,
            dispute.timestamp,
            dispute.isResolved,
            dispute.evidence
        );
    }
} 