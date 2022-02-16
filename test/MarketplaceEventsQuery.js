const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-web3");
require("dotenv").config();
const AnconNFTjson = require("../artifacts/contracts/AnconNFT.sol/AnconNFT.json");

describe("NFTEX contract", function () {
  let NFTEX,
    ex,
    token,
    Token,
    owner,
    addr1,
    addr2,
    addr3,
    addr4,
    AnconToken,
    anconToken,
    block;

  async function advanceBlockTo(blockNumber) {
    for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
      await advanceBlock();
    }
  }

  async function advanceBlock() {
    return ethers.provider.send("evm_mine", []);
  }

  async function _hash(tokenAddress, id, ownerAddress) {
    let bn = await ethers.provider.getBlockNumber();
    let hash = await ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "address"],
      [bn, tokenAddress, id, ownerAddress]
    );
    return hash;
  }

  before(async function () {
    NFTEX = await ethers.getContractFactory("NFTEX");
    // Token = await ethers.getContractFactory("Token");
    AnconNFT = await ethers.getContractFactory("AnconNFT");
    AnconToken = await ethers.getContractFactory("ANCON");

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    anconToken = await AnconToken.connect(owner).deploy();

    await expect(
      NFTEX.connect(owner).deploy(anconToken.address, 11000)
    ).to.be.revertedWith("input value is more than 100%");
  });

  beforeEach(async function () {
    ex = await NFTEX.connect(owner).deploy(anconToken.address, 500);
    // token = await Token.connect(owner).deploy();
    anconToken = await AnconToken.connect(owner).deploy();
    anconNFT = await AnconNFT.connect(owner).deploy(
      "AnconTest",
      "AT",
      anconToken.address,
      "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
    );

    await anconNFT.mint(
      owner.address,
      "d0ae3a5b-b86d-4227-9bec-e2438ab485ca", //UUID as uri
      1 //royalty fee percent from 0 to 10000, 1 = 0.01%, 10000 = 100.00%
    );
    await anconNFT.mint(
      addr1.address,
      "a67083c3-a36b-4956-baa0-c9239c75c582",
      2
    );
    await anconNFT.mint(
      addr1.address,
      "04030310-d8df-441a-89f6-44ab9c7dab19",
      20
    );
    await anconNFT.mint(
      addr2.address,
      "f9754447-70e3-440e-90a5-86e632dbb4c2",
      100
    );

    await anconNFT.mint(
      addr4.address,
      "866124d8-6c7b-4d50-8705-f7dea72e4695",
      10000
    );
  });

  describe("Deployment", function () {
    it("Check token balances", async function () {
      const ownerBalance = await anconNFT.balanceOf(owner.address);
      const addr1Balance = await anconNFT.balanceOf(addr1.address);
      const addr2Balance = await anconNFT.balanceOf(addr2.address);
      const addr3Balance = await anconNFT.balanceOf(addr3.address);

      const addr4AnconNFTBalance = await anconNFT.balanceOf(addr4.address);
      const addr4AnconTokenBalance = await anconToken.balanceOf(addr4.address);

      expect(ownerBalance).to.equal(1);
      expect(addr1Balance).to.equal(2);
      expect(addr2Balance).to.equal(1);
      expect(addr3Balance).to.equal(0);

      expect(addr4AnconNFTBalance).to.equal(1);
      // expect(ownerAnconTokenBalance).to.equal(100);
    });

    it("variables and functions about fee", async function () {
      expect(await ex.feeAddress()).to.equal(owner.address);
      expect(await ex.feePercent()).to.equal(500);

      await expect(
        ex.connect(addr1).setFeeAddress(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(ex.connect(addr1).updateFeePercent(300)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await ex.setFeeAddress(addr1.address);
      expect(await ex.feeAddress()).to.equal(addr1.address);

      await ex.updateFeePercent(300);
      expect(await ex.feePercent()).to.equal(300);

      await expect(ex.updateFeePercent(10300)).to.be.revertedWith(
        "input value is more than 100%"
      );
      block = await ethers.provider.getBlock(
        await ethers.provider.getBlockNumber()
      );
      console.log("Block Timestamp", block.timestamp);
    });
  });

  describe("Get at mint events", function () {
    it("Print event log", async function () {
      const web3NFTContract = new web3.eth.Contract(
        AnconNFTjson.abi,
        anconNFT.address
      );

      //Mint Query event
      const transferEventLog = await web3NFTContract.getPastEvents("Transfer", {
        toBlock: "latest",
        fromBlock: 0,
        filter: { user: owner.address },
      });

      const setOnchainEventLog = await web3NFTContract.getPastEvents(
        "AddMintInfo",
        {
          toBlock: "latest",
          fromBlock: 0,
          filter: { user: owner.address },
        }
      );

      const setOnchainEventLogAll = await web3NFTContract.getPastEvents(
        "AddMintInfo",
        {
          toBlock: "latest",
          fromBlock: 0,
        }
      );

      console.log(
        "\n 'Transfer' Get past events Web3 response print",
        transferEventLog[0]
      );

      console.log(
        "\n 'AddMintInfo' from owner Get past events Web3 response print",
        setOnchainEventLog
      );

      console.log(
        "\n 'AddMintInfo' all Get past events Web3 response print",
        setOnchainEventLogAll
      );
    });
  });

  describe("Make Order", function () {
    it("Fixed Price", async function () {
      /* await expect(
        ex.fixedPrice(anconNFT.address, 1, 50, block.timestamp + 20000)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      await advanceBlockTo("310");
      console.log("Debug");

      await expect(
        ex.fixedPrice(anconNFT.address, 0, 50, block.timestamp)
      ).to.be.revertedWith("Duration must be more than zero"); */
      // try {
      //   await anconNFT.approve(ex.address, 0);
      //   await ex.fixedPrice(anconNFT.address, 0, 50, block.timestamp + 20000);
      //   const hash = await _hash(anconNFT.address, 0, owner.address);
      // } catch (error) {
      //   console.log(error);
      // }
      // expect(await ex.getCurrentPrice(hash)).to.equal(50);
      // expect(await ex.tokenOrderLength(anconNFT.address, 0)).to.equal(1);
      // expect(await ex.sellerOrderLength(owner.address)).to.equal(1);
      // expect(await anconNFT.balanceOf(owner.address)).to.equal(0);
      // await advanceBlockTo("330");
      // expect(await ex.getCurrentPrice(hash)).to.equal(50);
    });
  });
});
