pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./SafeERC20.sol";

contract SendToken {
  using SafeERC20 for IERC20;

  IERC20 angelsToken;
  IERC20 gemToken;
  uint256 public value = 10000 ether;
  mapping(address => bool) public users;
  uint256 public totalUser = 0;
  uint256 public maxUser = 10000;

  constructor() {
    angelsToken = IERC20(0x965919bCb51cCE4FeB5aE062f710226037738e00);
    gemToken = IERC20(0x756dD03Fe43d9e3e50D2ABd7093E572C531916EF);
  }

  function setValue(uint256 _value) external {
    value = _value;
  }

  function setMaxUser(uint256 _maxUser) external {
    maxUser = _maxUser;
  }

  function sendToken() external {
    require(totalUser < maxUser, "Full faucet token");
    require(!users[msg.sender], "You already faucet!!");
    totalUser++;
    users[msg.sender] = true;
    angelsToken.safeTransfer(msg.sender, value);
    gemToken.safeTransfer(msg.sender, value);
  }
}
