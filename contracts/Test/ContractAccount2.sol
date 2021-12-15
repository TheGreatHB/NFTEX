// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "../NFTEX.sol";

contract TransferTest2 {
    NFTEX public ex;
    address public owner;

    constructor(address _ex) {
        ex = NFTEX(_ex);
        owner = msg.sender;
    }

    receive() external payable {
        payable(owner).transfer(msg.value);
    }

    function bid(bytes32 _order) payable external {
        (bool success,) = address(ex).call{value: msg.value}(abi.encodeWithSignature("bid(bytes32)", _order));
        require(success);
    }
}