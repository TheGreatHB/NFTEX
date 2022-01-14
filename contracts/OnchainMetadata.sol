// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract OnchainMetadata {

  event AddOnchainMetadata(
    string name, 
    string description, 
    string image, 
    address owner, 
    string parent, 
    string category,
    uint256 createdAt, 
    bytes sources,
    uint256 tokenId,
    uint256 royaltyFee
    );

  constructor() {

  }

  function setOnchainMetadata(
    string memory name, 
    string memory description, 
    string memory image, 
    address owner, 
    string memory parent,
    string memory category,
    bytes memory sources,
    uint256 tokenId,
    uint256 royaltyFee
  ) public{

    emit AddOnchainMetadata(name, description, image, owner, parent, category, block.timestamp, sources, tokenId, royaltyFee);

  }

}