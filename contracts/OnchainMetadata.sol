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
    bytes sources
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
    bytes memory sources
  ) public{

    emit AddOnchainMetadata(name, description, image, owner, parent, category, block.timestamp, sources);

  }

}