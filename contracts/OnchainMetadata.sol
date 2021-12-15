// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract OnchainMetadata {

  event AddOnchainMetadata(
    string name, 
    string description, 
    string image, 
    string owner, 
    string parent, 
    bytes sources
    );

  constructor() {

  }

  function setOnchainMetadata(
    string memory name, 
    string memory description, 
    string memory image, 
    string memory owner, 
    string memory parent, 
    bytes memory sources
  ) public{

    emit AddOnchainMetadata(name, description, image, owner, parent, sources);

  }

}