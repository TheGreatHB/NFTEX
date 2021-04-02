# NFTEX
**NFTEX** is an decentralized exchange (**DEX**) where people can trade their **ERC721 NFT** token.


## Features
NFTEX provides three types of trading.

1. Fixed Price Order
2. Dutch Auction Order
3. English Auction Order

Whatever you chooose, you should put token information, price information, and *deadline*.

People can buy and sell thier NFT token only with **ETH** at NFTEX.

#### 1. Fiexed Price Order
When you want to sell your NFT token with **a specific price**, you can use this order.

#### 2. Dutch Auction Order
When you want to sell your NFT token with **Dutch Auction**, you can use this order. During Dutch auction, price will **be decrease steadily** from start price to end price during order duration. Those are set when the order was made.

#### 3. English Auction Order
When you want to sell your NFT token with **English Auction**, you can use this order. During English auction, people can bid to an order 
until a deadline. Bids must be with at least 5% higher than the previous bid. If someone bid in the last 5 minutes of an auction, the auction will be automatically extended by 5 minutes.

## Development
* run `npm install` to install all node dependencies
* run `npx hardhat compile` to compile

### Run Test With Hardhat Network
Tests are located in the [test](https://github.com/TheGreatHB/NFTEX/tree/main/test) directory and can be modified as required. To run them:

* ```npx hardhat test```

## Contributions
**Please open all pull requests against the `main` branch.**


## License

Distributed under the MIT License. See [`LICENSE`](https://github.com/TheGreatHB/NFTEX/blob/main/LICENSE.txt) for more information.
