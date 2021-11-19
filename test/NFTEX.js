const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTEX contract", function () {

  let NFTEX, ex, token, Token, owner, addr1, addr2, addr3, addr4, AnconToken, anconToken;

  async function advanceBlockTo(blockNumber) {
    for (let i = await ethers.provider.getBlockNumber(); i < blockNumber; i++) {
      await advanceBlock();
    }
  }

  async function advanceBlock() {
    return ethers.provider.send("evm_mine", [])
  }

  async function _hash(tokenAddress, id, ownerAddress) {
    let bn = await ethers.provider.getBlockNumber();
    let hash = await ethers.utils.solidityKeccak256(["uint256","address","uint256","address"], [bn,tokenAddress, id, ownerAddress]);
    return hash;
  }

  before(async function () {
    NFTEX = await ethers.getContractFactory("NFTEX");
    Token = await ethers.getContractFactory("Token");
    AnconNFT = await ethers.getContractFactory("AnconNFT");
    AnconToken = await ethers.getContractFactory("ANCON");

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    await expect(NFTEX.connect(owner).deploy(11000)
    ).to.be.revertedWith("input value is more than 100%"); 
  });

  beforeEach(async function () {
    ex = await NFTEX.connect(owner).deploy(500);
    token = await Token.connect(owner).deploy();
    anconToken = await AnconToken.connect(owner).deploy();
    anconNFT = await AnconNFT.connect(owner).deploy("AnconTest","AT", anconToken.address,"0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199");

    await token.mint(owner.address, 0);
    await token.mint(addr1.address, 1);
    await token.mint(addr1.address, 11);
    await token.mint(addr2.address, 2);

    await anconNFT.mint(addr4.address, 1);

  });

  describe("Deployment", function () {

    it("Check token balances", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      const addr1Balance = await token.balanceOf(addr1.address);
      const addr2Balance = await token.balanceOf(addr2.address);
      const addr3Balance = await token.balanceOf(addr3.address);

      const addr4AnconNFTBalance = await anconNFT.balanceOf(addr4.address)
      const addr4AnconTokenBalance = await anconToken.balanceOf(addr4.address)

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
    it("Dutch Auction", async function () {
      await expect(
        ex.dutchAuction(token.address, 1, 100, 0, 100)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      await expect(
        ex.dutchAuction(token.address, 0, 10, 100, 100)
      ).to.be.revertedWith("End price should be lower than start price");

      await advanceBlockTo("20");

      await expect(
        ex.dutchAuction(token.address, 0, 100, 0, 10)
      ).to.be.revertedWith("Duration must be more than zero");

      await token.approve(ex.address, 0);

      await advanceBlockTo("30"); //after finishing this, blocknumber : 30. next tx will be 31. before the next tx, block number is still 30.
      await ex.dutchAuction(token.address, 0, 100, 0, 131); //this block is 31. since it is in tx. 
      const hash = await _hash(token.address, 0, owner.address);

      expect(await ex.getCurrentPrice(hash)).to.equal(100);   //31
      expect(await ex.tokenOrderLength(token.address, 0)).to.equal(1);  //31
      expect(await ex.sellerOrderLength(owner.address)).to.equal(1);  //31

      expect(await token.balanceOf(owner.address)).to.equal(0); //31

      await advanceBlockTo("60"); //60
      expect(await ex.getCurrentPrice(hash)).to.equal(71);  //60

      await advanceBlockTo("131");  //131
      expect(await ex.getCurrentPrice(hash)).to.equal(0); //131
    });

    it("English Auction", async function () {
      await expect(
        ex.englishAuction(token.address, 1, 10, 200)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      await advanceBlockTo("230");

      await expect(
        ex.englishAuction(token.address, 0, 10, 10)
      ).to.be.revertedWith("Duration must be more than zero");

      await token.approve(ex.address, 0);

      await ex.englishAuction(token.address, 0, 10, 300);
      const hash = await _hash(token.address, 0, owner.address);

      expect(await ex.getCurrentPrice(hash)).to.equal(10);
      expect(await ex.tokenOrderLength(token.address, 0)).to.equal(1);
      expect(await ex.sellerOrderLength(owner.address)).to.equal(1);

      expect(await token.balanceOf(owner.address)).to.equal(0);

      await advanceBlockTo("260");
      expect(await ex.getCurrentPrice(hash)).to.equal(10);
    });

    it("Fixed Price", async function () {
      await expect(
        ex.fixedPrice(token.address, 1, 50, 300)
      ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

      await advanceBlockTo("310");

      await expect(
        ex.fixedPrice(token.address, 0, 50, 10)
      ).to.be.revertedWith("Duration must be more than zero");

      await token.approve(ex.address, 0);

      await ex.fixedPrice(token.address, 0, 50, 350);
      const hash = await _hash(token.address, 0, owner.address);

      expect(await ex.getCurrentPrice(hash)).to.equal(50);
      expect(await ex.tokenOrderLength(token.address, 0)).to.equal(1);
      expect(await ex.sellerOrderLength(owner.address)).to.equal(1);

      expect(await token.balanceOf(owner.address)).to.equal(0);

      await advanceBlockTo("330");
      expect(await ex.getCurrentPrice(hash)).to.equal(50);
    });

    it("Multiple orders", async function () {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr2).approve(ex.address, 2);

      await ex.fixedPrice(token.address, 0, 50, 500);
      await ex.connect(addr1).englishAuction(token.address, 1, 50, 600);
      await ex.connect(addr2).dutchAuction(token.address, 2, 100, 50, 550);

      expect(await ex.tokenOrderLength(token.address, 0)).to.equal(1);
      expect(await ex.tokenOrderLength(token.address, 1)).to.equal(1);
      expect(await ex.tokenOrderLength(token.address, 2)).to.equal(1);
      expect(await ex.sellerOrderLength(owner.address)).to.equal(1);
      expect(await ex.sellerOrderLength(addr1.address)).to.equal(1);
      expect(await ex.sellerOrderLength(addr2.address)).to.equal(1);

      expect(await token.balanceOf(owner.address)).to.equal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(1);
      expect(await token.balanceOf(addr2.address)).to.equal(0);

      await token.connect(addr1).approve(ex.address, 11);
      await ex.connect(addr1).fixedPrice(token.address, 11, 50, 600);

      expect(await ex.sellerOrderLength(addr1.address)).to.equal(2);

      expect(await token.balanceOf(addr1.address)).to.equal(0);
      expect(await token.balanceOf(ex.address)).to.equal(4);

    });

  });

  describe("Cancel Order", function () {
    it("Cancel", async function () {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr2).approve(ex.address, 2);
      await token.connect(addr1).approve(ex.address, 11);

      await ex.fixedPrice(token.address, 0, 50, 500);
      const hash0 = await _hash(token.address, 0, owner.address);

      await ex.connect(addr1).englishAuction(token.address, 1, 20, 600);
      const hash1 = await _hash(token.address, 1, addr1.address);

      await ex.connect(addr2).dutchAuction(token.address, 2, 100, 50, 550);
      const hash2 = await _hash(token.address, 2, addr2.address);

      await ex.connect(addr1).englishAuction(token.address, 11, 20, 400);
      const hash3 = await _hash(token.address, 11, addr1.address);

      await expect(
        ex.connect(addr3).cancelOrder(hash0)
      ).to.be.revertedWith("Access denied");

      expect(await token.balanceOf(addr2.address)).to.equal(0);
      expect(await token.balanceOf(ex.address)).to.equal(4);
      expect(await token.ownerOf(2)).to.equal(ex.address);

      await ex.connect(addr2).cancelOrder(hash2);
      expect(await token.balanceOf(addr2.address)).to.equal(1);
      expect(await token.balanceOf(ex.address)).to.equal(3);
      expect(await token.ownerOf(2)).to.equal(addr2.address);

      await expect(
        ex.connect(addr3).buyItNow(hash2)
      ).to.be.revertedWith("Canceled order");

      await ex.connect(addr3).bid(hash1, {value : 30});

      await expect(
        ex.connect(addr1).cancelOrder(hash1)
      ).to.be.revertedWith("Bidding exist");

      await ex.connect(addr3).buyItNow(hash0, {value : 55});

      await expect(
        ex.cancelOrder(hash0)
      ).to.be.revertedWith("Already sold");

      await advanceBlockTo("401");
      expect(await token.ownerOf(11)).to.equal(ex.address);
      await expect(ex.bid(hash3)).to.be.revertedWith("It's over");
      await ex.connect(addr1).cancelOrder(hash3);
      expect(await token.ownerOf(11)).to.equal(addr1.address);
    });
  });

  describe("Bid Order", function () {
    it("Bid", async function() {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr2).approve(ex.address, 2);

      await ex.englishAuction(token.address, 0, 20, 500);
      const hash0 = await _hash(token.address, 0, owner.address);

      await ex.connect(addr1).fixedPrice(token.address, 1, 50, 500);
      const hash1 = await _hash(token.address, 1, addr1.address);

      await ex.connect(addr2).dutchAuction(token.address, 2, 100, 50, 500);
      const hash2 = await _hash(token.address, 2, addr2.address);

      await expect(ex.bid(hash1)).to.be.revertedWith("only for English Auction");
      await expect(ex.bid(hash2)).to.be.revertedWith("only for English Auction");
      await expect(ex.bid(hash0)).to.be.revertedWith("Can not bid to your order");

      await token.connect(addr1).approve(ex.address, 11);
      await ex.connect(addr1).englishAuction(token.address, 11, 20, 540);
      const hash3 = await _hash(token.address, 11, addr1.address);

      await ex.connect(addr1).cancelOrder(hash3);
      await expect(ex.bid(hash3)).to.be.revertedWith("Canceled order");

      await token.connect(addr1).approve(ex.address, 11);
      await ex.connect(addr1).englishAuction(token.address, 11, 20, 600);
      const hash4 = await _hash(token.address, 11, addr1.address);

      await expect(ex.bid(hash4, {value : 0})).to.be.revertedWith("low price bid");

      await expect(ex.connect(addr1).bid(hash0, {value : 10})).to.be.revertedWith("low price bid");
      await ex.connect(addr1).bid(hash0, {value : 40});
      await expect(ex.connect(addr2).bid(hash0, {value : 41})).to.be.revertedWith("low price bid");
      
      await advanceBlockTo("501");
      await expect(ex.connect(addr1).bid(hash0, {value : 70})).to.be.revertedWith("It's over");

    });

    it("Auction extension", async function() {
      await token.connect(addr1).approve(ex.address, 1);
      await ex.connect(addr1).englishAuction(token.address, 1, 20, 550);
      const hash = await _hash(token.address, 1, addr1.address);

      await expect(() => ex.connect(addr3).bid(hash, {value : 40})).to.changeEtherBalances([addr3, ex], [-40, 40]);
      await expect(() => ex.connect(addr2).bid(hash, {value : 50})).to.changeEtherBalances([addr2, addr3, ex], [-50, 40, 10]);
      
      await advanceBlockTo("540");
      await ex.bid(hash, {value : 70});

      await advanceBlockTo("551");
      await ex.connect(addr3).bid(hash, {value : 100});

      await advanceBlockTo("591");
      await expect(ex.connect(addr2).bid(hash, {value : 130})).to.be.revertedWith("It's over");
    });

  });

  describe("Claim Order", function () {
    it("Claim", async function() {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr2).approve(ex.address, 2);
      await token.connect(addr1).approve(ex.address, 11);

      await ex.englishAuction(token.address, 0, 20, 630);
      const hash0 = await _hash(token.address, 0, owner.address);

      await ex.connect(addr1).fixedPrice(token.address, 1, 50, 630);
      const hash1 = await _hash(token.address, 1, addr1.address);

      await ex.connect(addr2).dutchAuction(token.address, 2, 100, 50, 630);
      const hash2 = await _hash(token.address, 2, addr2.address);

      await ex.connect(addr1).englishAuction(token.address, 11, 20, 630);
      const hash3 = await _hash(token.address, 11, addr1.address);
      
      await ex.connect(addr1).bid(hash0, {value : 40});
      await ex.connect(addr3).bid(hash3, {value : 30});
      await expect(ex.claim(hash0)).to.be.revertedWith("Not yet");

      await advanceBlockTo("630");

      await expect(ex.connect(addr2).claim(hash0)).to.be.revertedWith("Access denied");
      await expect(ex.connect(addr1).claim(hash1)).to.be.revertedWith("This function is for English Auction");
      await expect(ex.connect(addr2).claim(hash2)).to.be.revertedWith("This function is for English Auction");
      
      await ex.setFeeAddress(addr3.address);
      expect(await token.ownerOf(0)).to.equal(ex.address);
      expect(await token.ownerOf(11)).to.equal(ex.address);
      await expect(() => ex.connect(addr1).claim(hash0)).to.changeEtherBalances([owner, addr3, ex], [38, 2, -40]);
      expect(await token.ownerOf(0)).to.equal(addr1.address);
      expect(await token.ownerOf(11)).to.equal(ex.address);
      await expect(() => ex.connect(addr1).claim(hash3)).to.changeEtherBalances([addr1, addr3, ex], [29, 1, -30]);
      expect(await token.ownerOf(0)).to.equal(addr1.address);
      expect(await token.ownerOf(11)).to.equal(addr3.address);

      await expect(ex.claim(hash0)).to.be.revertedWith("Already sold");
    });
  });

  describe("Buy It Now Order", function () {
    it("BIN_Fixed Price", async function() {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr1).approve(ex.address, 11);
      await token.connect(addr2).approve(ex.address, 2);

      await ex.englishAuction(token.address, 0, 20, 680);
      const hash0 = await _hash(token.address, 0, owner.address);

      await ex.connect(addr1).fixedPrice(token.address, 1, 50, 660);
      const hash1 = await _hash(token.address, 1, addr1.address);

      await ex.connect(addr1).fixedPrice(token.address, 11, 50, 680);
      const hash2 = await _hash(token.address, 11, addr1.address);

      await ex.connect(addr2).fixedPrice(token.address, 2, 60, 680);
      const hash3 = await _hash(token.address, 2, addr2.address);

      await advanceBlockTo("661");
      await expect(ex.connect(addr2).buyItNow(hash1)).to.be.revertedWith("It's over");
      await expect(ex.connect(addr2).buyItNow(hash0)).to.be.revertedWith("It's a English Auction");

      await expect(ex.connect(addr2).buyItNow(hash2, {value : 40})).to.be.revertedWith("price error");

      expect(await token.ownerOf(11)).to.equal(ex.address);
      await expect(() => ex.connect(addr2).buyItNow(hash2, {value : 50})).to.changeEtherBalances([owner, addr1, addr2], [2, 48, -50]);
      expect(await token.ownerOf(11)).to.equal(addr2.address);

      await expect(ex.connect(addr2).buyItNow(hash2, {value : 40})).to.be.revertedWith("Already sold");

      expect(await token.ownerOf(2)).to.equal(ex.address);
      await expect(() => ex.connect(addr1).buyItNow(hash3, {value : 77})).to.changeEtherBalances([owner, addr1, addr2], [3, -60, 57]);
      expect(await token.ownerOf(2)).to.equal(addr1.address);


      await ex.connect(addr1).cancelOrder(hash1);
      await token.connect(addr1).approve(ex.address, 1);
      await ex.connect(addr1).fixedPrice(token.address, 1, 20, 680);
      const hash4 = await _hash(token.address, 1, addr1.address);

      await expect(() => ex.connect(addr1).buyItNow(hash4, {value : 50})).to.changeEtherBalances([owner, addr1], [1, -1]);

    });

    it("BIN_Dutch Auction", async function() {
      await token.approve(ex.address, 0);
      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr1).approve(ex.address, 11);
      await token.connect(addr2).approve(ex.address, 2);

      await ex.dutchAuction(token.address, 0, 20, 0, 690);  //682
      const hash0 = await _hash(token.address, 0, owner.address);

      await ex.connect(addr1).dutchAuction(token.address, 1, 100, 50, 732); //683
      const hash1 = await _hash(token.address, 1, addr1.address);

      await ex.connect(addr1).dutchAuction(token.address, 11, 500, 150, 750); //684
      const hash2 = await _hash(token.address, 11, addr1.address);

      await ex.connect(addr2).dutchAuction(token.address, 2, 300, 150, 734);  //685
      const hash3 = await _hash(token.address, 2, addr2.address);

      await advanceBlockTo("691");
      await expect(ex.connect(addr2).buyItNow(hash0)).to.be.revertedWith("It's over");

      await expect(ex.connect(addr2).buyItNow(hash1, {value : 50})).to.be.revertedWith("price error");

      await advanceBlockTo("702");
      expect(await token.ownerOf(1)).to.equal(ex.address);
      
      await expect(() => ex.connect(addr2).buyItNow(hash1, {value : 80})).to.changeEtherBalances([owner, addr1, addr2], [4, 76, -80]);
      expect(await token.ownerOf(1)).to.equal(addr2.address);

      await expect(ex.connect(addr3).buyItNow(hash1, {value : 90})).to.be.revertedWith("Already sold");

      expect(await token.ownerOf(2)).to.equal(ex.address);
      await expect(() => ex.connect(addr1).buyItNow(hash3, {value : 250})).to.changeEtherBalances([owner, addr1, addr2], [12, -240, 228]);
      expect(await token.ownerOf(2)).to.equal(addr1.address);

      expect(await token.ownerOf(11)).to.equal(ex.address);
      await expect(() => ex.connect(addr1).buyItNow(hash2, {value : 400})).to.changeEtherBalances([owner, addr1], [19, -19]);
      expect(await token.ownerOf(11)).to.equal(addr1.address);
      });

  });

  describe("Some contracts can't be receive ETH", function () {
    it("transfer problem", async function() {
      const CA1 = await ethers.getContractFactory("TransferTest1");
      const CA2 = await ethers.getContractFactory("TransferTest2");

      const ca1 = await CA1.connect(addr3).deploy(ex.address);
      const ca2 = await CA2.connect(addr3).deploy(ex.address);

      await token.approve(ex.address, 0);
      await ex.englishAuction(token.address, 0, 20, 1000);
      const hash = await _hash(token.address, 0,owner.address);
      await ex.connect(addr1).bid(hash, {value:50});

      await ca1.connect(addr3).bid(hash, {value:100});
      expect(await ex.getCurrentPrice(hash)).to.equal(100);

      await expect(() => ex.connect(addr1).bid(hash, {value:200})).to.changeEtherBalances([ca1, addr1, ex], [100, -200, 100]);
    
      await ca2.connect(addr3).bid(hash, {value:500});
      expect(await ex.getCurrentPrice(hash)).to.equal(500);

      await expect(() => ex.connect(addr1).bid(hash, {value:1000})).to.changeEtherBalances([ca2, addr1, ex], [0, -1000, 1000]);  //ca2 can't receive ETH since it has some code in receive fx.

      await token.connect(addr1).approve(ex.address, 1);
      await token.connect(addr1).approve(ex.address, 11);

      await ex.connect(addr1).fixedPrice(token.address, 1, 1000, 1000);
      const hash1 = _hash(token.address, 1, addr1.address);
      await ex.connect(addr1).fixedPrice(token.address, 11, 1000, 1000);
      const hash2 = _hash(token.address, 11, addr1.address);

      await ex.setFeeAddress(ca1.address);
      expect (await ex.feeAddress()).to.equal(ca1.address);

      await expect(() => ex.connect(addr2).buyItNow(hash1, {value:1000})).to.changeEtherBalances([ca1, addr1], [50, 950]);

      await ex.setFeeAddress(ca2.address);
      expect (await ex.feeAddress()).to.equal(ca2.address);

      await expect(() => ex.connect(addr2).buyItNow(hash2, {value:1000})).to.changeEtherBalances([ca2, addr1], [0, 950]);
      
    })
  });
  
});