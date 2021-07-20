// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract TalaToken is ERC20PresetMinterPauser {
    constructor(uint256 initialSupply) ERC20PresetMinterPauser("Tala Token", "TALA") {
        _mint(_msgSender(), initialSupply);
    }
}