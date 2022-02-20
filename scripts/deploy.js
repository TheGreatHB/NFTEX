// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  [owner, addr1, addr2, addr3] = await ethers.getSigners();

  console.log('Owner', owner.address)
  // We get the contracts to deploy
  const NFTEX = await ethers.getContractFactory("NFTEX");
  const AnconNFT = await ethers.getContractFactory("AnconNFT");
  // const AnconToken = await ethers.getContractFactory("ANCON");

  console.log("Deploying NFTEX...");
  const ex = await NFTEX.connect(owner).deploy('0x2cFBD78C66f8c17B0104F31BDC6bA58941cab6A1', 500);

  /* console.log("Deploying Ancon Token...");
  const anconToken = await AnconToken.connect(owner).deploy(); */

  console.log("Deploying AnconNFT...");
  const anconNFT = await AnconNFT.connect(owner).deploy(
    "AnconTestNFT",
    "AT",
    '0x2cFBD78C66f8c17B0104F31BDC6bA58941cab6A1',
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
  );

  await ex.deployed();
  // await anconToken.deployed();
  await anconNFT.deployed();

  console.log("NFTEX contract deployed to:", ex.address);
  /* console.log("Ancon Token contract deployed to:", anconToken.address);*/
  console.log("AnconNFT contract deployed to:", anconNFT.address); 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
