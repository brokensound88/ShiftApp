// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ShiftToken
 * @dev Implementation of the Shift Token with advanced features and security mechanisms
 */
contract ShiftToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Token Economics
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MINT_CAP = 10_000_000 * 10**18; // 10 million tokens per mint
    uint256 public constant BURN_CAP = 5_000_000 * 10**18; // 5 million tokens per burn
    uint256 public constant TRANSFER_CAP = 1_000_000 * 10**18; // 1 million tokens per transfer

    // Fee Structure
    uint256 public transferFee = 10; // 0.1% (basis points)
    address public feeCollector;
    mapping(address => bool) public isFeeExempt;

    // Transfer Restrictions
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public dailyTransferLimit;
    mapping(address => uint256) public lastTransferTimestamp;
    mapping(address => uint256) public dailyTransferAmount;

    // Events
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event BlacklistUpdated(address account, bool blacklisted);
    event TransferLimitUpdated(address account, uint256 limit);
    event FeeExemptionUpdated(address account, bool exempt);

    constructor(uint256 initialSupply, address _feeCollector) ERC20("Shift", "SHFT") {
        require(initialSupply * 10**decimals() <= MAX_SUPPLY, "Exceeds max supply");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        feeCollector = _feeCollector;
        _mint(msg.sender, initialSupply * 10**decimals());
        
        // Set default transfer limits
        dailyTransferLimit[msg.sender] = TRANSFER_CAP;
        isFeeExempt[msg.sender] = true;
    }

    // Core Functionality

    function setTransferFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10% fee
        emit FeeUpdated(transferFee, newFee);
        transferFee = newFee;
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid fee collector");
        emit FeeCollectorUpdated(feeCollector, newCollector);
        feeCollector = newCollector;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Minting and Burning Mechanisms

    function mint(address to, uint256 amount) public onlyOwner nonReentrant {
        require(amount <= MINT_CAP, "Exceeds mint cap");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public nonReentrant {
        require(amount <= BURN_CAP, "Exceeds burn cap");
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public nonReentrant {
        require(amount <= BURN_CAP, "Exceeds burn cap");
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }

    // Transfer Restrictions

    function setBlacklist(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }

    function setTransferLimit(address account, uint256 limit) external onlyOwner {
        require(limit <= TRANSFER_CAP, "Exceeds transfer cap");
        dailyTransferLimit[account] = limit;
        emit TransferLimitUpdated(account, limit);
    }

    function setFeeExemption(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Address blacklisted");
        
        // Skip transfer limit checks for minting and burning
        if (from != address(0) && to != address(0)) {
            // Reset daily transfer amount if it's a new day
            if (block.timestamp >= lastTransferTimestamp[from] + 1 days) {
                dailyTransferAmount[from] = 0;
            }
            
            // Check and update daily transfer limit
            require(
                dailyTransferAmount[from] + amount <= dailyTransferLimit[from],
                "Exceeds daily transfer limit"
            );
            dailyTransferAmount[from] += amount;
            lastTransferTimestamp[from] = block.timestamp;
        }
        
        super._beforeTokenTransfer(from, to, amount);
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");

        // Calculate and deduct fee if applicable
        if (!isFeeExempt[sender] && !isFeeExempt[recipient]) {
            uint256 feeAmount = (amount * transferFee) / 10000;
            super._transfer(sender, feeCollector, feeAmount);
            super._transfer(sender, recipient, amount - feeAmount);
        } else {
            super._transfer(sender, recipient, amount);
        }
    }

    // View Functions

    function getDailyTransferAmount(address account) external view returns (uint256) {
        if (block.timestamp >= lastTransferTimestamp[account] + 1 days) {
            return 0;
        }
        return dailyTransferAmount[account];
    }

    function getRemainingDailyTransferLimit(address account) external view returns (uint256) {
        if (block.timestamp >= lastTransferTimestamp[account] + 1 days) {
            return dailyTransferLimit[account];
        }
        return dailyTransferLimit[account] - dailyTransferAmount[account];
    }
} 