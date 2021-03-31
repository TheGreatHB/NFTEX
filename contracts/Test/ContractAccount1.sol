// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import "../NFTEX.sol";

contract TransferTest1 {
    NFTEX public ex;

    constructor(address _ex) {
        ex = NFTEX(_ex);
    }

    receive() external payable {
    }

    function bid(bytes32 _order) payable external {
        (bool success,) = address(ex).call{value: msg.value}(abi.encodeWithSignature("bid(bytes32)", _order));
        require(success);
    }
}