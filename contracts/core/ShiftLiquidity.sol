// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ShiftLiquidity
 * @dev Implementation of the Shift Liquidity Pool with advanced features and security
 */
contract ShiftLiquidity is ReentrancyGuard, Ownable, Pausable {
    using SafeMath for uint256;

    IERC20 public shiftToken;
    
    struct Pool {
        uint256 ethBalance;
        uint256 tokenBalance;
        uint256 totalShares;
        uint256 minLiquidity;
        uint256 swapFee;        // in basis points (1/100 of a percent)
        uint256 providerFee;    // in basis points
        bool initialized;
    }
    
    struct ProviderInfo {
        uint256 shares;
        uint256 ethContributed;
        uint256 tokenContributed;
        uint256 lastDepositTime;
    }
    
    struct StakingInfo {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        uint256 lockEndTime;
        bool isStaking;
    }
    
    // State Variables
    Pool public pool;
    mapping(address => ProviderInfo) public providers;
    uint256 public constant MAX_FEE = 1000;         // 10% max fee
    uint256 public constant MIN_LIQUIDITY = 1000;   // Minimum liquidity requirement
    uint256 public constant PRICE_IMPACT_LIMIT = 1000; // 10% max price impact
    uint256 public lockPeriod = 1 days;            // Minimum time between withdrawals
    
    // Staking and Reward Variables
    uint256 public rewardPerBlock;
    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;
    uint256 public totalStaked;
    uint256 public minStakingPeriod = 7 days;
    uint256 public earlyWithdrawalFee = 500; // 5% in basis points
    mapping(address => StakingInfo) public stakingInfo;
    
    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 shares
    );
    event SwapExecuted(
        address indexed user,
        bool ethToToken,
        uint256 amountIn,
        uint256 amountOut
    );
    event FeesUpdated(uint256 swapFee, uint256 providerFee);
    event PriceImpactExceeded(
        address indexed user,
        uint256 impact,
        uint256 limit
    );
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor(
        address _shiftToken,
        uint256 _swapFee,
        uint256 _providerFee
    ) {
        require(_shiftToken != address(0), "Invalid token address");
        require(_swapFee <= MAX_FEE, "Swap fee too high");
        require(_providerFee <= MAX_FEE, "Provider fee too high");
        
        shiftToken = IERC20(_shiftToken);
        pool.swapFee = _swapFee;
        pool.providerFee = _providerFee;
        pool.minLiquidity = MIN_LIQUIDITY;
    }
    
    // Liquidity Management
    
    function addLiquidity(uint256 tokenAmount)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        require(msg.value > 0, "Must provide ETH");
        require(tokenAmount > 0, "Must provide tokens");
        
        // Calculate shares
        if (!pool.initialized) {
            shares = msg.value;  // Initial shares equal to ETH provided
            pool.initialized = true;
        } else {
            uint256 ethRatio = msg.value.mul(1e18).div(pool.ethBalance);
            uint256 tokenRatio = tokenAmount.mul(1e18).div(pool.tokenBalance);
            require(
                ethRatio.mul(100).div(tokenRatio) >= 95 &&
                ethRatio.mul(100).div(tokenRatio) <= 105,
                "Unbalanced provision"
            );
            shares = msg.value.mul(pool.totalShares).div(pool.ethBalance);
        }
        
        // Update pool and provider info
        pool.ethBalance = pool.ethBalance.add(msg.value);
        pool.tokenBalance = pool.tokenBalance.add(tokenAmount);
        pool.totalShares = pool.totalShares.add(shares);
        
        ProviderInfo storage provider = providers[msg.sender];
        provider.shares = provider.shares.add(shares);
        provider.ethContributed = provider.ethContributed.add(msg.value);
        provider.tokenContributed = provider.tokenContributed.add(tokenAmount);
        provider.lastDepositTime = block.timestamp;
        
        require(
            shiftToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );
        
        emit LiquidityAdded(msg.sender, msg.value, tokenAmount, shares);
        return shares;
    }
    
    function removeLiquidity(uint256 shares)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 ethAmount, uint256 tokenAmount)
    {
        ProviderInfo storage provider = providers[msg.sender];
        require(shares > 0 && shares <= provider.shares, "Invalid shares");
        require(
            block.timestamp >= provider.lastDepositTime + lockPeriod,
            "Lock period active"
        );
        
        // Calculate amounts to return
        ethAmount = shares.mul(pool.ethBalance).div(pool.totalShares);
        tokenAmount = shares.mul(pool.tokenBalance).div(pool.totalShares);
        
        // Update pool and provider info
        pool.ethBalance = pool.ethBalance.sub(ethAmount);
        pool.tokenBalance = pool.tokenBalance.sub(tokenAmount);
        pool.totalShares = pool.totalShares.sub(shares);
        provider.shares = provider.shares.sub(shares);
        provider.ethContributed = provider.ethContributed.sub(ethAmount);
        provider.tokenContributed = provider.tokenContributed.sub(tokenAmount);
        
        // Transfer assets
        payable(msg.sender).transfer(ethAmount);
        require(shiftToken.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        emit LiquidityRemoved(msg.sender, ethAmount, tokenAmount, shares);
        return (ethAmount, tokenAmount);
    }
    
    // Swap Functions
    
    function swapETHForTokens(uint256 minTokensOut)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 tokenAmount)
    {
        require(msg.value > 0, "Must provide ETH");
        
        uint256 inputWithFee = msg.value.mul(1000 - pool.swapFee).div(1000);
        tokenAmount = getTokensOutForETH(inputWithFee);
        
        require(tokenAmount >= minTokensOut, "Insufficient output amount");
        require(
            calculatePriceImpact(msg.value, tokenAmount) <= PRICE_IMPACT_LIMIT,
            "Price impact too high"
        );
        
        pool.ethBalance = pool.ethBalance.add(msg.value);
        pool.tokenBalance = pool.tokenBalance.sub(tokenAmount);
        
        require(shiftToken.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        emit SwapExecuted(msg.sender, true, msg.value, tokenAmount);
        return tokenAmount;
    }
    
    function swapTokensForETH(uint256 tokenAmount, uint256 minETHOut)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 ethAmount)
    {
        require(tokenAmount > 0, "Must provide tokens");
        
        uint256 inputWithFee = tokenAmount.mul(1000 - pool.swapFee).div(1000);
        ethAmount = getETHOutForTokens(inputWithFee);
        
        require(ethAmount >= minETHOut, "Insufficient output amount");
        require(
            calculatePriceImpact(tokenAmount, ethAmount) <= PRICE_IMPACT_LIMIT,
            "Price impact too high"
        );
        
        pool.tokenBalance = pool.tokenBalance.add(tokenAmount);
        pool.ethBalance = pool.ethBalance.sub(ethAmount);
        
        require(
            shiftToken.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );
        payable(msg.sender).transfer(ethAmount);
        
        emit SwapExecuted(msg.sender, false, tokenAmount, ethAmount);
        return ethAmount;
    }
    
    // Price Calculation Functions
    
    function getTokensOutForETH(uint256 ethAmount)
        public
        view
        returns (uint256)
    {
        require(pool.ethBalance > 0 && pool.tokenBalance > 0, "Pool empty");
        return ethAmount.mul(pool.tokenBalance).div(pool.ethBalance);
    }
    
    function getETHOutForTokens(uint256 tokenAmount)
        public
        view
        returns (uint256)
    {
        require(pool.ethBalance > 0 && pool.tokenBalance > 0, "Pool empty");
        return tokenAmount.mul(pool.ethBalance).div(pool.tokenBalance);
    }
    
    function calculatePriceImpact(uint256 amountIn, uint256 amountOut)
        public
        pure
        returns (uint256)
    {
        return amountIn.mul(1000).div(amountOut);
    }
    
    // Admin Functions
    
    function updateFees(uint256 newSwapFee, uint256 newProviderFee)
        external
        onlyOwner
    {
        require(newSwapFee <= MAX_FEE, "Swap fee too high");
        require(newProviderFee <= MAX_FEE, "Provider fee too high");
        
        pool.swapFee = newSwapFee;
        pool.providerFee = newProviderFee;
        
        emit FeesUpdated(newSwapFee, newProviderFee);
    }
    
    function updateLockPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod <= 30 days, "Lock period too long");
        lockPeriod = newPeriod;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency Functions
    
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        if (pool.ethBalance > 0) {
            payable(owner()).transfer(pool.ethBalance);
        }
        if (pool.tokenBalance > 0) {
            require(
                shiftToken.transfer(owner(), pool.tokenBalance),
                "Token transfer failed"
            );
        }
        pool.ethBalance = 0;
        pool.tokenBalance = 0;
        pool.totalShares = 0;
    }
    
    // View Functions
    
    function getProviderInfo(address provider)
        external
        view
        returns (
            uint256 shares,
            uint256 ethContributed,
            uint256 tokenContributed,
            uint256 lastDepositTime
        )
    {
        ProviderInfo storage info = providers[provider];
        return (
            info.shares,
            info.ethContributed,
            info.tokenContributed,
            info.lastDepositTime
        );
    }
    
    function getPoolInfo()
        external
        view
        returns (
            uint256 ethBalance,
            uint256 tokenBalance,
            uint256 totalShares,
            uint256 swapFee,
            uint256 providerFee
        )
    {
        return (
            pool.ethBalance,
            pool.tokenBalance,
            pool.totalShares,
            pool.swapFee,
            pool.providerFee
        );
    }
    
    function pendingReward(address user) external view returns (uint256) {
        StakingInfo storage staker = stakingInfo[user];
        if (!staker.isStaking || block.number <= lastRewardBlock) {
            return 0;
        }
        
        uint256 multiplier = block.number.sub(lastRewardBlock);
        uint256 reward = multiplier.mul(rewardPerBlock);
        uint256 adjustedAccRewardPerShare = accRewardPerShare.add(
            reward.mul(1e12).div(totalStaked)
        );
        
        return staker.stakedAmount.mul(adjustedAccRewardPerShare).div(1e12).sub(staker.rewardDebt);
    }
    
    function getStakingInfo(address user)
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingRewards,
            uint256 lockEndTime,
            bool isStaking
        )
    {
        StakingInfo storage staker = stakingInfo[user];
        uint256 pending = this.pendingReward(user);
        
        return (
            staker.stakedAmount,
            pending,
            staker.lockEndTime,
            staker.isStaking
        );
    }
    
    // Staking Functions
    
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(lockPeriod >= minStakingPeriod, "Lock period too short");
        
        updatePool();
        StakingInfo storage staker = stakingInfo[msg.sender];
        
        if (staker.isStaking) {
            uint256 pending = staker.stakedAmount.mul(accRewardPerShare).div(1e12).sub(staker.rewardDebt);
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        
        require(shiftToken.transferFrom(msg.sender, address(this), amount), "Stake transfer failed");
        
        staker.stakedAmount = staker.stakedAmount.add(amount);
        staker.lastStakeTime = block.timestamp;
        staker.lockEndTime = block.timestamp.add(lockPeriod);
        staker.isStaking = true;
        staker.rewardDebt = staker.stakedAmount.mul(accRewardPerShare).div(1e12);
        totalStaked = totalStaked.add(amount);
        
        emit Staked(msg.sender, amount, lockPeriod);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.isStaking, "Not staking");
        require(amount > 0 && amount <= staker.stakedAmount, "Invalid amount");
        
        updatePool();
        uint256 pending = staker.stakedAmount.mul(accRewardPerShare).div(1e12).sub(staker.rewardDebt);
        
        if (amount == staker.stakedAmount) {
            staker.isStaking = false;
        }
        
        staker.stakedAmount = staker.stakedAmount.sub(amount);
        staker.rewardDebt = staker.stakedAmount.mul(accRewardPerShare).div(1e12);
        totalStaked = totalStaked.sub(amount);
        
        uint256 withdrawalAmount = amount;
        if (block.timestamp < staker.lockEndTime) {
            uint256 fee = amount.mul(earlyWithdrawalFee).div(10000);
            withdrawalAmount = amount.sub(fee);
            // Fee goes to the reward pool
            totalStaked = totalStaked.add(fee);
        }
        
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }
        require(shiftToken.transfer(msg.sender, withdrawalAmount), "Unstake transfer failed");
        
        emit Unstaked(msg.sender, amount, pending);
    }
    
    function claimReward() external nonReentrant {
        StakingInfo storage staker = stakingInfo[msg.sender];
        require(staker.isStaking, "Not staking");
        
        updatePool();
        uint256 pending = staker.stakedAmount.mul(accRewardPerShare).div(1e12).sub(staker.rewardDebt);
        require(pending > 0, "No rewards to claim");
        
        staker.rewardDebt = staker.stakedAmount.mul(accRewardPerShare).div(1e12);
        safeRewardTransfer(msg.sender, pending);
        
        emit RewardClaimed(msg.sender, pending);
    }
    
    // Pool Update and Reward Functions
    
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        
        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number.sub(lastRewardBlock);
        uint256 reward = multiplier.mul(rewardPerBlock);
        accRewardPerShare = accRewardPerShare.add(
            reward.mul(1e12).div(totalStaked)
        );
        lastRewardBlock = block.number;
    }
    
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        updatePool();
        emit RewardRateUpdated(rewardPerBlock, _rewardPerBlock);
        rewardPerBlock = _rewardPerBlock;
    }
    
    function setMinStakingPeriod(uint256 _minStakingPeriod) external onlyOwner {
        require(_minStakingPeriod <= 365 days, "Period too long");
        minStakingPeriod = _minStakingPeriod;
    }
    
    function setEarlyWithdrawalFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        earlyWithdrawalFee = _fee;
    }
    
    // Internal Functions
    
    function safeRewardTransfer(address to, uint256 amount) internal {
        uint256 balance = shiftToken.balanceOf(address(this));
        if (amount > balance) {
            require(shiftToken.transfer(to, balance), "Reward transfer failed");
        } else {
            require(shiftToken.transfer(to, amount), "Reward transfer failed");
        }
    }
    
    receive() external payable {
        // Accept ETH transfers
    }
} 