pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Controller is Ownable{

  address public statsAddress;
  address public registryAddress;
  address public nftexAddress;
  address public metadataAddress;
  constructor(
    address _statsAddress,
    address _registryAddress,
    address _nftexAddress,
    address _metadataAddress
  ){
    statsAddress = _statsAddress;
    registryAddress = _registryAddress;
    nftexAddress = _nftexAddress;
    metadataAddress = _metadataAddress;
  }

  function getStatContract() public returns(address) {
    return statsAddress;
  }

  function setStatContract(address _statsAddress) public onlyOwner {
    statsAddress = _statsAddress;
  }

  function getRegistryContract() public returns(address){
    return registryAddress;
  }

  function setRegistryContract(address _registryAddress) public onlyOwner {
    registryAddress = _registryAddress;
  }

  function getNFTEXContract() public returns(address) {
    return nftexAddress;
  }

  function setNTEXContract(address _nftexAddress) public onlyOwner {
    nftexAddress = _nftexAddress;
  }

  function getOnchainMetadata() public returns(address) {
    return metadataAddress;
  }
  
  function setOnchainMetadata(address _metadataAddress) public onlyOwner {
    metadataAddress = _metadataAddress;
  }

}