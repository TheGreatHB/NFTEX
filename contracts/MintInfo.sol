// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract MintInfo {
    event AddMintInfo(
        address creator,
        string uri,
        uint256 tokenId,
        uint256 royaltyFee
    );
    
    constructor() {}

    function setMintInfo(
        address creator,
        string memory uri,
        uint256 tokenId,
        uint256 royaltyFee
    ) public {
        emit AddMintInfo(creator, uri, tokenId, royaltyFee);
    }
}
