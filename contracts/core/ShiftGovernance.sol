// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title ShiftGovernance
 * @dev Implementation of the Shift governance and upgrade system
 */
contract ShiftGovernance is ReentrancyGuard, Ownable, Pausable {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    struct Proposal {
        bytes32 proposalId;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        ProposalType proposalType;
        bytes32 contentHash;
        ProposalMetadata metadata;
    }

    struct ProposalMetadata {
        string category;
        string[] tags;
        string documentationUrl;
        address[] requiredContracts;
        uint256[] requiredValues;
        bytes[] callData;
    }

    struct Vote {
        bool support;
        uint256 weight;
        string reason;
    }

    struct Delegate {
        address delegator;
        address delegatee;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    enum ProposalType {
        Generic,
        UpgradeContract,
        UpdateParameter,
        AddFeature,
        RemoveFeature,
        Emergency
    }

    // State Variables
    IERC20 public governanceToken;
    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => mapping(address => Vote)) public votes;
    mapping(address => Delegate) public delegates;
    mapping(address => uint256) public votingPower;
    mapping(bytes32 => uint256) public proposalTallies;
    
    uint256 public constant PROPOSAL_THRESHOLD = 100000e18;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant EMERGENCY_VOTING_PERIOD = 1 days;
    uint256 public constant MIN_VOTING_POWER = 1000e18;
    
    Counters.Counter private _proposalIdCounter;
    
    // Events
    event ProposalCreated(
        bytes32 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        bytes32 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(
        bytes32 indexed proposalId,
        address indexed executor,
        uint256 timestamp
    );
    event DelegateRegistered(
        address indexed delegator,
        address indexed delegatee,
        uint256 amount
    );
    event ContractUpgraded(
        address indexed proxyAddress,
        address indexed newImplementation,
        bytes32 indexed proposalId
    );
    event ParameterUpdated(
        string indexed parameter,
        uint256 oldValue,
        uint256 newValue,
        bytes32 indexed proposalId
    );

    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token address");
        governanceToken = IERC20(_governanceToken);
    }

    // Proposal Management

    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        ProposalMetadata memory metadata
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(
            governanceToken.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD,
            "Insufficient tokens to propose"
        );
        
        bytes32 proposalId = bytes32(_proposalIdCounter.current());
        _proposalIdCounter.increment();
        
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = startTime + (
            proposalType == ProposalType.Emergency ?
            EMERGENCY_VOTING_PERIOD : VOTING_PERIOD
        );
        
        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            executed: false,
            canceled: false,
            proposalType: proposalType,
            contentHash: keccak256(abi.encodePacked(title, description)),
            metadata: metadata
        });
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            startTime,
            endTime
        );
        
        return proposalId;
    }

    function castVote(
        bytes32 proposalId,
        bool support,
        string memory reason
    ) external nonReentrant {
        require(canVote(msg.sender, proposalId), "Cannot vote");
        require(!hasVoted(msg.sender, proposalId), "Already voted");
        
        uint256 weight = calculateVotingPower(msg.sender);
        require(weight >= MIN_VOTING_POWER, "Insufficient voting power");
        
        votes[proposalId][msg.sender] = Vote({
            support: support,
            weight: weight,
            reason: reason
        });
        
        if (support) {
            proposalTallies[proposalId] += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    // Delegation Management

    function delegate(
        address delegatee,
        uint256 amount,
        uint256 duration
    ) external nonReentrant {
        require(delegatee != address(0), "Invalid delegatee");
        require(amount > 0, "Invalid amount");
        require(
            governanceToken.balanceOf(msg.sender) >= amount,
            "Insufficient balance"
        );
        
        delegates[msg.sender] = Delegate({
            delegator: msg.sender,
            delegatee: delegatee,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true
        });
        
        votingPower[delegatee] += amount;
        emit DelegateRegistered(msg.sender, delegatee, amount);
    }

    // Execution Management

    function executeProposal(bytes32 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(
            block.timestamp >= proposal.endTime + EXECUTION_DELAY,
            "Execution delay not met"
        );
        require(isProposalPassed(proposalId), "Proposal not passed");
        
        proposal.executed = true;
        
        if (proposal.proposalType == ProposalType.UpgradeContract) {
            executeContractUpgrade(proposal);
        } else if (proposal.proposalType == ProposalType.UpdateParameter) {
            executeParameterUpdate(proposal);
        }
        
        emit ProposalExecuted(proposalId, msg.sender, block.timestamp);
    }

    // Internal Functions

    function executeContractUpgrade(Proposal storage proposal) internal {
        require(
            proposal.metadata.requiredContracts.length == 1,
            "Invalid upgrade data"
        );
        
        address proxyAddress = proposal.metadata.requiredContracts[0];
        address newImplementation = address(uint160(proposal.metadata.requiredValues[0]));
        
        TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(payable(proxyAddress));
        // proxy.upgradeTo(newImplementation);
        
        emit ContractUpgraded(proxyAddress, newImplementation, proposal.proposalId);
    }

    function executeParameterUpdate(Proposal storage proposal) internal {
        require(
            proposal.metadata.requiredValues.length > 0,
            "Invalid parameter data"
        );
        
        // Implementation specific to parameter updates
        emit ParameterUpdated(
            proposal.metadata.category,
            0, // old value
            proposal.metadata.requiredValues[0],
            proposal.proposalId
        );
    }

    function calculateVotingPower(address account) public view returns (uint256) {
        uint256 ownPower = governanceToken.balanceOf(account);
        uint256 delegatedPower = votingPower[account];
        
        Delegate storage delegation = delegates[account];
        if (delegation.active && block.timestamp <= delegation.endTime) {
            ownPower -= delegation.amount;
        }
        
        return ownPower + delegatedPower;
    }

    function canVote(
        address account,
        bytes32 proposalId
    ) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return (
            block.timestamp >= proposal.startTime &&
            block.timestamp <= proposal.endTime &&
            calculateVotingPower(account) >= MIN_VOTING_POWER
        );
    }

    function hasVoted(
        address account,
        bytes32 proposalId
    ) public view returns (bool) {
        return votes[proposalId][account].weight > 0;
    }

    function isProposalPassed(bytes32 proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposalTallies[proposalId];
        uint256 quorum = governanceToken.totalSupply() / 4; // 25% quorum
        
        return (
            totalVotes >= quorum &&
            block.timestamp > proposal.endTime
        );
    }

    // View Functions

    function getProposalInfo(bytes32 proposalId)
        external
        view
        returns (
            address proposer,
            string memory title,
            uint256 startTime,
            uint256 endTime,
            bool executed,
            ProposalType proposalType,
            ProposalMetadata memory metadata
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.proposalType,
            proposal.metadata
        );
    }

    function getVoteInfo(bytes32 proposalId, address voter)
        external
        view
        returns (
            bool support,
            uint256 weight,
            string memory reason
        )
    {
        Vote storage vote = votes[proposalId][voter];
        return (vote.support, vote.weight, vote.reason);
    }

    function getDelegateInfo(address delegator)
        external
        view
        returns (
            address delegatee,
            uint256 amount,
            uint256 endTime,
            bool active
        )
    {
        Delegate storage delegate = delegates[delegator];
        return (
            delegate.delegatee,
            delegate.amount,
            delegate.endTime,
            delegate.active
        );
    }

    // Admin Functions

    function updateProposalThreshold(uint256 newThreshold) external onlyOwner {
        PROPOSAL_THRESHOLD = newThreshold;
    }

    function updateVotingPeriod(uint256 newPeriod) external onlyOwner {
        VOTING_PERIOD = newPeriod;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 