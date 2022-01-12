const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTEX contract", function () {

  let NFTEX, ex, tokenERC721, Token, owner, addr1, addr2, addr3, addr4, AnconToken, anconToken, time;

  async function advanceBlockTimestamp(time = 0) {
    await ethers.provider.send('evm_setNextBlockTimestamp', [Date.now() + time]); 
    await ethers.provider.send('evm_mine');
  }

  async function _hash(ts, tokenAddress, id, ownerAddress) {
    let hash = await ethers.utils.solidityKeccak256(
      ["uint256","address","uint256","address"], 
      [ts,tokenAddress, id, ownerAddress]);
    return hash;
  }

  before(async function () {
    NFTEX = await ethers.getContractFactory("NFTEX");
    Token = await ethers.getContractFactory("Token");
    AnconNFT = await ethers.getContractFactory("AnconNFT");
    AnconToken = await ethers.getContractFactory("ANCON");

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    anconToken = await AnconToken.connect(owner).deploy();

    console.log('anconToken.address', anconToken.address)
    console.log('owner.address', owner.address)
    console.log('addr1.address', addr1.address)
    console.log('addr2.address', addr2.address)
    console.log('addr3.address', addr3.address)
    console.log('addr4.address', addr4.address)
    await expect(NFTEX.connect(owner).deploy(anconToken.address, 11000)
    ).to.be.revertedWith("input value is more than 100%"); 
    await advanceBlockTimestamp();
    time = Date.now()
    await anconToken.mint(addr1.address, 30);
    await anconToken.mint(addr2.address, 60);
    await anconToken.mint(addr3.address, 60);
    ex = await NFTEX.connect(owner).deploy(anconToken.address, 1000);
    console.log('ex.address', ex.address)
  });

  beforeEach(async function () {
    // await anconToken.mint(ex.address, 60);
    tokenERC721 = await Token.connect(owner).deploy();
    anconNFT = await AnconNFT.connect(owner).deploy(  
      "AnconTest",
      "AT", 
      anconToken.address,
      "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199");

    await tokenERC721.mint(owner.address, 0);
    await tokenERC721.mint(addr1.address, 1);
    await tokenERC721.mint(addr1.address, 11);
    await tokenERC721.mint(addr2.address, 2);

    await anconNFT.mint(addr4.address, 
      0, 
      "Nombre",
      "Descripcion ------------------------",
      "cid/nombrearchivo.png",
      "",
      "categoría",
      ethers.utils.hexlify(0));

  });

  describe("Deployment", function () {

    it("Check token balances", async function () {
      const ownerBalance = await tokenERC721.balanceOf(owner.address);
      const addr1Balance = await tokenERC721.balanceOf(addr1.address);
      const addr2Balance = await tokenERC721.balanceOf(addr2.address);
      const addr3Balance = await tokenERC721.balanceOf(addr3.address);

      const addr4AnconNFTBalance = await anconNFT.balanceOf(addr4.address)
      const addr3AnconTokenBalance = await anconToken.balanceOf(addr3.address)

      expect(ownerBalance).to.equal(1);
      expect(addr1Balance).to.equal(2);
      expect(addr2Balance).to.equal(1);
      expect(addr3Balance).to.equal(0);
      
      expect(addr4AnconNFTBalance).to.equal(1);
      expect(addr3AnconTokenBalance).to.equal(60);
    });

    it("variables and functions about fee", async function () {
      expect(await ex.feeAddress()).to.equal(owner.address);
      expect(await ex.feePercent()).to.equal(1000);

      await expect(
        ex.connect(addr1).setFeeAddress(addr1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ex.connect(addr1).updateFeePercent(300)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await ex.setFeeAddress(addr1.address);
      expect(await ex.feeAddress()).to.equal(addr1.address);

      await ex.updateFeePercent(300);
      expect(await ex.feePercent()).to.equal(300);

      await expect(
        ex.updateFeePercent(10300)
      ).to.be.revertedWith("input value is more than 100%");

    });
  });

  describe("Make Order", function () {
    it("Fixed Price", async function () {
      console.log('fixed price 1')
      await expect(
        ex.fixedPrice(tokenERC721.address, 1, 50, time + 1000)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      time = Date.now()
      await advanceBlockTimestamp()

      await tokenERC721.approve(ex.address, 0);
      console.log('fixed price 2')
      
      await expect(
        ex.fixedPrice(tokenERC721.address, 0, 50, time)
      ).to.be.revertedWith("Duration must be more than zero");

      await tokenERC721.approve(ex.address, 0);

      const block = await ethers.provider.getBlock()
      await ex.fixedPrice(tokenERC721.address, 0, 50, time + 3500);
      const hash = await _hash(block.timestamp + 1, tokenERC721.address, 0, owner.address);

      expect(await ex.getCurrentPrice(hash)).to.equal(50);
      expect(await ex.tokenOrderLength(tokenERC721.address, 0)).to.equal(1);
      expect(await ex.sellerOrderLength(owner.address)).to.equal(1);

      expect(await tokenERC721.balanceOf(owner.address)).to.equal(0);

      await advanceBlockTimestamp()
      expect(await ex.getCurrentPrice(hash)).to.equal(50);
    });

  });

  describe("Cancel Order", function () {
    it("Cancel", async function () {
      await tokenERC721.approve(ex.address, 0);
      await tokenERC721.connect(addr1).approve(ex.address, 1);
      await tokenERC721.connect(addr2).approve(ex.address, 2);
      await tokenERC721.connect(addr1).approve(ex.address, 11);

      const block = await ethers.provider.getBlock()
      await ex.fixedPrice(tokenERC721.address, 0, 50, time + 10000);
      const hash0 = await _hash(block.timestamp + 1, tokenERC721.address, 0, owner.address);

      await expect(
        ex.connect(addr3).cancelOrder(hash0)
      ).to.be.revertedWith("Access denied");

      expect(await tokenERC721.balanceOf(ex.address)).to.equal(1);
      expect(await tokenERC721.ownerOf(0)).to.equal(ex.address);

      const price = await ex.getCurrentPrice(hash0);
      await anconToken.connect(addr3).approve(ex.address, price);
      await ex.connect(addr3).buyItNow(hash0);

      await expect(
        ex.cancelOrder(hash0)
      ).to.be.revertedWith("Already sold");

      await advanceBlockTimestamp(10000);
      expect(await tokenERC721.ownerOf(0)).to.equal(addr3.address);
      await expect(ex.connect(addr1).buyItNow(hash0)).to.be.revertedWith("Its over");
    });
  });

  describe("Claim Order", function () {
    it("Claim", async function() {
      await tokenERC721.approve(ex.address, 0);
      await tokenERC721.connect(addr1).approve(ex.address, 1);
      await tokenERC721.connect(addr2).approve(ex.address, 2);
      await tokenERC721.connect(addr1).approve(ex.address, 11);

      time = Date.now()
      const block = await ethers.provider.getBlock()
      await ex.connect(addr1).fixedPrice(tokenERC721.address, 1, 50, time + 10000);
      const hash1 = await _hash(block.timestamp + 1, tokenERC721.address, 1, addr1.address);

      await advanceBlockTimestamp(10000);

      await expect(ex.connect(addr1).claim(hash1)).to.be.revertedWith("This function is for English Auction");
      
      await ex.setFeeAddress(addr3.address);
      expect(await tokenERC721.ownerOf(0)).to.equal(owner.address);
      expect(await tokenERC721.ownerOf(11)).to.equal(addr1.address);
    });
  });

  describe("Buy It Now Order", function () {
    it("BIN_Fixed Price", async function() {
      await tokenERC721.approve(ex.address, 0);
      await tokenERC721.connect(addr1).approve(ex.address, 1);
      await tokenERC721.connect(addr1).approve(ex.address, 11);
      await tokenERC721.connect(addr2).approve(ex.address, 2);

      time = Date.now()
      let block = await ethers.provider.getBlock()
      await ex.connect(addr1).fixedPrice(tokenERC721.address, 1, 50, time + 10000);
      const hash1 = await _hash(block.timestamp + 1, tokenERC721.address, 1, addr1.address);

      block = await ethers.provider.getBlock()
      await ex.connect(addr1).fixedPrice(tokenERC721.address, 11, 50, time + 20000);
      const hash2 = await _hash(block.timestamp + 1, tokenERC721.address, 11, addr1.address);

      block = await ethers.provider.getBlock()
      await ex.connect(addr2).fixedPrice(tokenERC721.address, 2, 60, time + 30000);
      const hash3 = await _hash(block.timestamp + 1, tokenERC721.address, 2, addr2.address);

      await advanceBlockTimestamp(10000);
      await expect(ex.connect(addr2).buyItNow(hash1)).to.be.revertedWith("Its over");

      expect(await tokenERC721.ownerOf(11)).to.equal(ex.address);
      let price = await ex.getCurrentPrice(hash2);
      await anconToken.connect(addr2).approve(ex.address, price);
      await ex.connect(addr2).buyItNow(hash2)
      expect(await anconToken.balanceOf(addr1.address)).to.equal(80)
      expect(await anconToken.balanceOf(addr2.address)).to.equal(10)
      expect(await tokenERC721.ownerOf(11)).to.equal(addr2.address);

      await expect(ex.connect(addr2).buyItNow(hash2)).to.be.revertedWith("Already sold");

      expect(await tokenERC721.ownerOf(2)).to.equal(ex.address);
      
      price = await ex.getCurrentPrice(hash3);
      await anconToken.connect(addr1).approve(ex.address, price);

      await ex.connect(addr1).buyItNow(hash3)
      expect(await anconToken.balanceOf(addr1.address)).to.equal(20)
      expect(await anconToken.balanceOf(addr2.address)).to.equal(69)
      expect(await tokenERC721.ownerOf(2)).to.equal(addr1.address);

      await ex.connect(addr1).cancelOrder(hash1);

      await advanceBlockTimestamp(10000);
      time = Date.now()
      await tokenERC721.connect(addr1).approve(ex.address, 1);
      block = await ethers.provider.getBlock()
      await ex.connect(addr1).fixedPrice(tokenERC721.address, 1, 20, time + 20000);
      const hash4 = await _hash(block.timestamp + 1, tokenERC721.address, 1, addr1.address);

      price = await ex.getCurrentPrice(hash4);
      await anconToken.connect(addr1).approve(ex.address, price);
      expect(await tokenERC721.ownerOf(1)).to.equal(ex.address);

      await ex.connect(addr1).buyItNow(hash4)
      expect(await tokenERC721.ownerOf(1)).to.equal(addr1.address);
      expect(await anconToken.balanceOf(addr1.address)).to.equal(20)
      expect(await anconToken.balanceOf(addr3.address)).to.equal(12)
    });
  });
  
});