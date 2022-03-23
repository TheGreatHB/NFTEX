// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MintInfo.sol";

//import "./ICredentialRegistry.sol";

//  a NFT secure document
contract AnconNFT is
    ERC721Burnable,
    ERC721URIStorage,
    Ownable,
    MintInfo
{
    struct CreatorInfo {
        address creator;
        uint256 royaltyFee;
    }
    using Counters for Counters.Counter;
    // OnchainMetadata public onChainMetadata;
    Counters.Counter private _tokenIds;
    IERC20 public nativeCoin;
    address public verifierAddress;
    uint256 public serviceFeeForPaymentAddress = 0;
    uint256 public serviceFeeForContract = 0;
    uint256 public royaltyFeePercent;
    mapping (uint256 => CreatorInfo) public creators;

    event Withdrawn(address indexed paymentAddress, uint256 amount);

    event ServiceFeePaid(
        address indexed from,
        uint256 paidToContract,
        uint256 paidToPaymentAddress
    );

    /**
     * XDVNFT Data Token
     */
    constructor(
        string memory name,
        string memory symbol,
        address tokenERC20,
        address verifierAddr
    ) ERC721(name, symbol) {
        nativeCoin = IERC20(tokenERC20);
        verifierAddress = verifierAddr;
    }

    function setServiceFeeForPaymentAddress(uint256 _fee) public onlyOwner {
        serviceFeeForPaymentAddress = _fee;
    }

    function setServiceFeeForContract(uint256 _fee) public onlyOwner {
        serviceFeeForContract = _fee;
    }

    /**
     * @dev Mints a XDV Data Token+
     * @param user 
     * @param uri Uuid generated on the front end with the uuidv4 library. Uuids are used as a general index.
     * @param _royaltyFeePercent
     */
    function mint(
        address user,
        string memory uri, //UUID
        uint256 _royaltyFeePercent //Must be from 0 to 10000, 1 = 0.01%, 10000 = 100.00%
    ) public returns (uint256) {
        require(_royaltyFeePercent <= 10000, "input value is more than 100%");
        _tokenIds.increment();
        royaltyFeePercent = _royaltyFeePercent;
        uint256 newItemId = _tokenIds.current();
        _safeMint(user, newItemId);
        _setTokenURI(newItemId, uri);
        setMintInfo(user, uri, newItemId, _royaltyFeePercent);
        creators[newItemId] = CreatorInfo(user,_royaltyFeePercent);
        return newItemId;
    }

    function getCreator(uint256 id) external view returns(address){
        return creators[id].creator;
    }

    function getRoyaltyFee(uint256 id) external view returns(uint256){
        return creators[id].royaltyFee;
    }

    /**
     * @dev Just overrides the superclass' function. Fixes inheritance
     * source: https://forum.openzeppelin.com/t/how-do-inherit-from-erc721-erc721enumerable-and-erc721uristorage-in-v4-of-openzeppelin-contracts/6656/4
     */
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /**
     * @dev Just overrides the superclass' function. Fixes inheritance
     * source: https://forum.openzeppelin.com/t/how-do-inherit-from-erc721-erc721enumerable-and-erc721uristorage-in-v4-of-openzeppelin-contracts/6656/4
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function withdrawBalance(address payable payee) public onlyOwner {
        uint256 balance = nativeCoin.balanceOf(address(this));

        require(nativeCoin.transfer(payee, balance), "XDV: Transfer failed");

        emit Withdrawn(payee, balance);
    }
}
