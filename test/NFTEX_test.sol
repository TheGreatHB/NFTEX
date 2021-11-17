// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract NFTEX_test is ERC721Holder, Ownable {

  struct Order {
    uint8 orderType;  //0:Fixed Price, 1:Dutch Auction, 2:English Auction
    address seller;
    IERC721 token;
    uint256 tokenId;
    uint256 startPrice;
    uint256 endPrice;
    uint256 startBlock;
    uint256 endBlock;
    uint256 lastBidPrice;
    address lastBidder;
    bool isSold;
  }

  mapping (IERC721 => mapping (uint256 => bytes32[])) public orderIdByToken;
  mapping (address => bytes32[]) public orderIdBySeller;
  mapping (bytes32 => Order) public orderInfo;

  address public feeAddress;
  uint16 public feePercent;

  event MakeOrder(IERC721 indexed token, uint256 id, bytes32 indexed hash, address seller);
  event CancelOrder(IERC721 indexed token, uint256 id, bytes32 indexed hash, address seller);
  event Bid(IERC721 indexed token, uint256 id, bytes32 indexed hash, address bidder, uint256 bidPrice);
  event Claim(IERC721 indexed token, uint256 id, bytes32 indexed hash, address seller, address taker, uint256 price);


  constructor(uint16 _feePercent) {
    require(_feePercent <= 10000, "input value is more than 100%");
    feeAddress = payable(msg.sender);
    feePercent = _feePercent;
  }


  // view fx
  function getCurrentPrice(bytes32 _order) public view returns (uint256) {
    Order storage o = orderInfo[_order];
    uint8 orderType = o.orderType;
    if (orderType == 0) {
      console.log("Current price is %s and the order type is FP", o.startPrice);
      return o.startPrice;
    } else if (orderType == 2) {
      uint256 lastBidPrice = o.lastBidPrice;
      uint256 ELastBidPrice = lastBidPrice == 0 ? o.startPrice : lastBidPrice;
      console.log("Current price is %s and the order type is EA", ELastBidPrice);
      return ELastBidPrice;
    } else {
      uint256 _startPrice = o.startPrice;
      uint256 _startBlock = o.startBlock;
      uint256 tickPerBlock = (_startPrice - o.endPrice) / (o.endBlock - _startBlock);
      uint256 price = _startPrice - ((block.number - _startBlock) * tickPerBlock);
      console.log("Current block is %s, tickPerBlock is %s, gap is %s", block.number, tickPerBlock, block.number - _startBlock);
      console.log("Start price is %s, current price is %s and the order type is DA", _startPrice, price);
      return price;
    }
  }

  function tokenOrderLength(IERC721 _token, uint256 _id) external view returns (uint256) {
    return orderIdByToken[_token][_id].length;
  }

  function sellerOrderLength(address _seller) external view returns (uint256) {
    return orderIdBySeller[_seller].length;
  }


  // make order fx
  //0:Fixed Price, 1:Dutch Auction, 2:English Auction
  function dutchAuction(IERC721 _token, uint256 _id, uint256 _startPrice, uint256 _endPrice, uint256 _endBlock) public {
    require(_startPrice > _endPrice, "End price should be lower than start price");
    _makeOrder(1, _token, _id, _startPrice, _endPrice, _endBlock);
    console.log("Dutch Auction is made. %s token from %s to %s", _id, _startPrice, _endPrice);
    console.log("Dutch Auction is made.until %s", _endBlock);
    console.log("DA from %s", block.number);
  }  //sp != ep

  function englishAuction(IERC721 _token, uint256 _id, uint256 _startPrice, uint256 _endBlock) public {
    _makeOrder(2, _token, _id, _startPrice, 0, _endBlock);
    console.log("English Auction is made. %s token from %s until %s", _id, _startPrice, _endBlock);
    console.log("EA from %s", block.number);
  } //ep=0. for gas saving.

  function fixedPrice(IERC721 _token, uint256 _id, uint256 _price, uint256 _endBlock) public {
    _makeOrder(0, _token, _id, _price, 0, _endBlock);
    console.log("Fixed Price is made. %s token with %s until %s", _id, _price, _endBlock);
    console.log("FP from %s", block.number);
  }  //ep=0. for gas saving.

  function _makeOrder(
    uint8 _orderType,
    IERC721 _token,
    uint256 _id,
    uint256 _startPrice,
    uint256 _endPrice,
    uint256 _endBlock
  ) internal {
    require(_endBlock > block.number, "Duration must be more than zero");

    //push
    bytes32 hash = _hash(_token, _id, msg.sender);
    orderInfo[hash] = Order(_orderType, msg.sender, _token, _id, _startPrice, _endPrice, block.number, _endBlock, 0, address(0), false);

    orderIdByToken[_token][_id].push(hash);
    orderIdBySeller[msg.sender].push(hash);

    console.log("%s token is of Sender %s", _id, IERC721(_token).ownerOf(_id));
    console.log("Trying to send %s token to %s", _id, address(this));

    //check if seller has a right to transfer the NFT token. safeTransferFrom.
    _token.safeTransferFrom(msg.sender, address(this), _id);

    console.log("%s token is of Sender %s", _id, IERC721(_token).ownerOf(_id));

    emit MakeOrder(_token, _id, hash, msg.sender);
  }

  //for testing, temporarily it is public not internal.
  function _hash(IERC721 _token, uint256 _id, address _seller) public view returns (bytes32) {
    console.log("Hash from %s", block.number);
    return keccak256(abi.encodePacked(block.number, _token, _id, _seller));
  }


  // take order fx
  //you have to pay only ETH for bidding and buying.

  //Bids must be at least 5% higher than the previous bid.
  //If someone bids in the last 5 minutes of an auction, the auction will automatically extend by 5 minutes.
  function bid(bytes32 _order) payable external {
    Order storage o = orderInfo[_order];
    uint256 endBlock = o.endBlock;
    uint256 lastBidPrice = o.lastBidPrice;
    address lastBidder = o.lastBidder;

    require(o.orderType == 2, "only for English Auction");
    require(endBlock != 0, "Canceled order");
    require(block.number <= endBlock, "It's over");
    require(o.seller != msg.sender, "Can not bid to your order");

    if (lastBidPrice != 0) {
      console.log("last bid price is %s", lastBidPrice);
      require(msg.value >= lastBidPrice + (lastBidPrice / 20), "low price bid");  //5%
      console.log("you paid %s and it's more than %s percent", msg.value, (msg.value-lastBidPrice)*100/lastBidPrice);
    } else {
      console.log("last bid price is %s", 0);
      require(msg.value >= o.startPrice && msg.value > 0, "low price bid");
      console.log("you paid %s more than start price %s", msg.value, o.startPrice);
    }

    if (block.number > endBlock - 20) {  //20blocks = 5 mins in Etherium.
      console.log("previous end block was %s but it is enlonged to %s", endBlock, endBlock + 20);
      o.endBlock = endBlock + 20;
    }

    o.lastBidder = msg.sender;
    o.lastBidPrice = msg.value;

    if (lastBidPrice != 0) {
    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Bidder balance is %s wei", msg.sender.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);
    console.log("Last bidder balance is %s wei", lastBidder.balance);
    console.log("This contract balance is %s wei", address(this).balance);
    console.log("Trying to send %s wei from %s to %s", lastBidPrice, address(this), o.lastBidder);

    payable(lastBidder).transfer(lastBidPrice);

    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Bidder balance is %s wei", msg.sender.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);
    console.log("Last bidder balance is %s wei", lastBidder.balance);
    console.log("This contract balance is %s wei", address(this).balance);
    }

    emit Bid(o.token, o.tokenId, _order, msg.sender, msg.value);
  }




  function buyItNow(bytes32 _order) payable external {
    Order storage o = orderInfo[_order];
    require(o.endBlock > block.number, "It's over");
    require(o.orderType < 2, "It's a English Auction");
    require(o.isSold == false, "Already sold");


    uint256 currentPrice = getCurrentPrice(_order);
    require(msg.value >= currentPrice, "price error");

    o.isSold = true;

    uint256 fee = currentPrice * feePercent / 10000;

    console.log("price is %s, fee is %s, and you paid %s", currentPrice, fee, msg.value);

    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Buyer balance is %s wei", msg.sender.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);
    console.log("Trying to send %s wei from %s to %s", currentPrice - fee, address(this), o.seller);
    console.log("Trying to send %s wei from %s to %s", fee, address(this), feeAddress);

    payable(o.seller).transfer(currentPrice - fee);
    payable(feeAddress).transfer(fee);

    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Buyer balance is %s wei", msg.sender.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);

    if (msg.value > currentPrice) {
      console.log("overpayed %s wei", msg.value - currentPrice);
      console.log("Buyer balance is %s wei", msg.sender.balance);
      payable(msg.sender).transfer(msg.value - currentPrice);
      console.log("Buyer balance after getting money back is %s wei", msg.sender.balance);

    }



    console.log("%s token is of Sender %s", o.tokenId, o.token.ownerOf(o.tokenId));
    console.log("Trying to send %s token to %s", o.tokenId, msg.sender);

    o.token.safeTransferFrom(address(this), msg.sender, o.tokenId);

    console.log("%s token is of Sender %s", o.tokenId, o.token.ownerOf(o.tokenId));


    emit Claim(o.token, o.tokenId, _order, o.seller, msg.sender, currentPrice);
  }

  //both seller and taker can call this fx in English Auction. Probably the taker(last bidder) might call this fx.
  //In both DA and FP, buyItNow fx include claim fx.
  function claim(bytes32 _order) external {
    Order storage o = orderInfo[_order];
    address seller = o.seller;
    address lastBidder = o.lastBidder;
    require(o.isSold == false, "Already sold");

    require(seller == msg.sender || lastBidder == msg.sender, "Access denied");
    require(o.orderType == 2, "This function is for English Auction");
    require(block.number > o.endBlock, "Not yet");

    IERC721 token = o.token;
    uint256 lastBidPrice = o.lastBidPrice;

    uint256 fee = lastBidPrice * feePercent / 10000;

    o.isSold = true;

    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Buyer balance is %s wei", lastBidder.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);
    console.log("Trying to send %s wei from %s to %s", o.lastBidPrice - fee, address(this), o.seller);
    console.log("Trying to send %s wei from %s to %s", fee, address(this), feeAddress);

    payable(seller).transfer(o.lastBidPrice - fee);
    payable(feeAddress).transfer(fee);

    console.log("Seller balance is %s wei", o.seller.balance);
    console.log("Buyer balance is %s wei", lastBidder.balance);
    console.log("FeeAddress balance is %s wei", feeAddress.balance);

    console.log("%s token is of Sender %s", o.tokenId, token.ownerOf(o.tokenId));
    console.log("Trying to send %s token to %s", o.tokenId, lastBidder);

    token.safeTransferFrom(address(this), lastBidder, o.tokenId);

    console.log("%s token is of Sender %s", o.tokenId, token.ownerOf(o.tokenId));

    emit Claim(token, o.tokenId, _order, seller, lastBidder, lastBidPrice);
  }

  function cancelOrder(bytes32 _order) external {
    Order storage o = orderInfo[_order];
    require(o.seller == msg.sender, "Access denied");
    require(o.lastBidPrice == 0, "Bidding exist"); //for EA. but even in DA, FP, seller can withdraw his/her token with his fx.
    require(o.isSold == false, "Already sold");

    IERC721 token = o.token;
    uint256 tokenId = o.tokenId;

    o.endBlock = 0;   //0 endBlock means the order is canceled.


    console.log("%s token is of Sender %s", tokenId, token.ownerOf(tokenId));
    console.log("Trying to send %s token to %s", tokenId, msg.sender);

    token.safeTransferFrom(address(this), msg.sender, tokenId);

    console.log("%s token is of Sender %s", tokenId, token.ownerOf(tokenId));


    emit CancelOrder(token, tokenId, _order, msg.sender);
  }


  function setFeeAddress(address _feeAddress) external onlyOwner {
    console.log("Fee address is changed from %s to %s", feeAddress, _feeAddress);
    feeAddress = _feeAddress;
  }

  function updateFeePercent(uint16 _percent) external onlyOwner {
    require(_percent <= 10000, "input value is more than 100%");
    console.log("Fee percent is changed from %s to %s", feePercent, _percent);
    feePercent = _percent;
  }

}