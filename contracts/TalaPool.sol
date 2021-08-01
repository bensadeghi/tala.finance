// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TalaPool is Initializable, ReentrancyGuardUpgradeable, Context {
    using SafeMath for uint256;

    /* ========== INITIALIZER ========== */   
    ERC20PresetMinterPauser private _token;
    uint private _rewardRate;

    function initialize(ERC20PresetMinterPauser token) external initializer {
        __ReentrancyGuard_init();
        _token = token;
        _rewardRate = 1e4;
    }

    /* ========== STATE VARIABLES ========== */   
    struct staker {
        uint stakeAmount;
        uint stakeTime;
        uint reward;
    }

    mapping (address => staker) private _stakeHolders;

    uint private _placeHolder1;

    /* ========== EVENTS ========== */   
    event Deposit (address indexed from, uint amount);
    event Withdraw(address indexed from, uint amount);
    event Claim   (address indexed from, uint amount);
    event SetRewardRate(address from, uint rate);

    /* ========== FUNCTIONS: STAKING ========== */   
    function stakeBalance() external view returns(uint) {
        return _stakeHolders[_msgSender()].stakeAmount;
    }

    function depositStake(uint256 amount) external nonReentrant {
        require(amount > 0, "amount <= 0");
        _updateRewardBalance();
        _stakeHolders[_msgSender()].stakeAmount = _stakeHolders[_msgSender()].stakeAmount.add(amount);
        _token.transferFrom(_msgSender(), address(this), amount);
        emit Deposit(_msgSender(), amount);
    }

    function withdrawStake(uint256 amount) external nonReentrant {
        require(amount > 0, "amount <= 0");
        require(_stakeHolders[_msgSender()].stakeAmount >= amount, "Not enough funds staked");
        _updateRewardBalance();
        _stakeHolders[_msgSender()].stakeAmount = _stakeHolders[_msgSender()].stakeAmount.sub(amount);
        _token.transfer(_msgSender(), amount);
        emit Withdraw(_msgSender(), amount);
    }

    /* ========== FUNCTIONS: REWARDS ========== */   
    modifier onlyMinter() {
        require(_token.hasRole(_token.MINTER_ROLE(), _msgSender()), "NO PERMISSION");
        _;
    }

    function getRewardRate() external view onlyMinter returns(uint) {
        return _rewardRate;
    }
    function setRewardRate(uint rate) external onlyMinter {
        require(rate > 0, "rate <= 0");
        _rewardRate = rate;
        emit SetRewardRate(_msgSender(), rate);
    }

    function rewardBalance() public view returns(uint) {
        uint timeSince = (block.timestamp).sub(_stakeHolders[_msgSender()].stakeTime);
        uint newReward = timeSince.mul(_stakeHolders[_msgSender()].stakeAmount).mul(1e18).div(_rewardRate).div(_token.totalSupply());
        uint totalReward = _stakeHolders[_msgSender()].reward.add(newReward);
        return totalReward;
    }

    function _updateRewardBalance() private {
        _stakeHolders[_msgSender()].reward = rewardBalance();    // update reward
        _stakeHolders[_msgSender()].stakeTime = block.timestamp; // reset skateTime
    }

    function claimReward() external nonReentrant {
        uint reward = rewardBalance();
        _stakeHolders[_msgSender()].reward = 0;                  // reset reward
        _stakeHolders[_msgSender()].stakeTime = block.timestamp; // reset skateTime
        _token.mint(_msgSender(), reward);
        emit Claim(_msgSender(), reward);
    }
}