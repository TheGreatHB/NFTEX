const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3 = require("web3");
require("dotenv").config();
// const AnconNFT = require("../contracts/AnconNFT.sol/AnconNFT.json");
const NFTEXjson = require("../artifacts/contracts/NFTEX.sol/NFTEX.json");

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
    anconToken;

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
      0,
      "",
      "",
      "",
      "",
      "",
      ethers.utils.hexlify(0)
    );
    console.log("Minting to owner");
    await anconNFT.mint(
      addr1.address,
      1,
      "",
      "",
      "",
      "",
      "",
      ethers.utils.hexlify(0)
    );
    await anconNFT.mint(
      addr1.address,
      11,
      "",
      "",
      "",
      "",
      "",
      ethers.utils.hexlify(0)
    );
    await anconNFT.mint(
      addr2.address,
      2,
      "",
      "",
      "",
      "",
      "",
      ethers.utils.hexlify(0)
    );

    await anconNFT.mint(
      addr4.address,
      1,
      "",
      "",
      "",
      "",
      "",
      ethers.utils.hexlify(0)
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
    });
  });

  describe("Make Order", function () {
    it("Fixed Price", async function () {
      await expect(
        ex.fixedPrice(anconNFT.address, 1, 50, 300)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      await advanceBlockTo("310");
      console.log("Debug");

      await expect(
        ex.fixedPrice(anconNFT.address, 0, 50, 10)
      ).to.be.revertedWith("Duration must be more than zero");

      // await anconNFT.approve(ex.address, 0);

      // await ex.fixedPrice(anconNFT.address, 0, 50, 350);
      // const hash = await _hash(anconNFT.address, 0, owner.address);

      // expect(await ex.getCurrentPrice(hash)).to.equal(50);
      // expect(await ex.tokenOrderLength(anconNFT.address, 0)).to.equal(1);
      // expect(await ex.sellerOrderLength(owner.address)).to.equal(1);

      // expect(await anconNFT.balanceOf(owner.address)).to.equal(0);

      // await advanceBlockTo("330");
      // expect(await ex.getCurrentPrice(hash)).to.equal(50);

      // exWeb3 = new web3.eth.Contract(NFTEXjson.abi, ex.address);
      let provider = ethers.getDefaultProvider();
      let ethersContract = new ethers.Contract(
        ex.address,
        NFTEXjson.abi,
        provider
      );

      const response = await ethersContract.filters.MakeOrder();
      // const response = await exWeb3.getPastEvents("MakeOrder", {
      //   toBlock: "latest",
      //   fromBlock: 0,
      //   filter: { user: owner.address },
      // });

      console.log("Get past events response print", response);
    });
  });
});
