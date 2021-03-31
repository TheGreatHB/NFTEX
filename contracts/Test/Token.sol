// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Token is ERC721("testToken", "tNFT") {
    function mint(address owner, uint256 id) public {
        _mint(owner, id);
    }
}