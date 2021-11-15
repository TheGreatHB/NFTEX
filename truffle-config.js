const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();
module.exports = {
  compilers: {
    solc: {
      version: "0.8.3"
    }
  },
  plugins: ["truffle-contract-size"],
  networks: {
    bsctestnet: {
      provider: () => new HDWalletProvider(process.env.BSC_MNEMONIC, process.env.BSC_TESTNET),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: false
    },
    bsc: {
      provider: () => new HDWalletProvider(process.env.BSCMAINNET_MNEMONIC, `https://bsc-dataseed1.binance.org`),
      network_id: 56,
      confirmations: 10,
      timeoutBlocks: 200,
      ///gas: 5000000,
     // gasPrice: 135000000000,
      skipDryRun: false
    },
    localhost: {
      from: '0xA83B070a68336811e9265fbEc6d49B98538F61EA',
      host: 'localhost',
      port: 8545,
      network_id: '10' // Match any network id
    },
    development: {
      from: '0x95897149fB3e570F2Abe0Ad614768E891Cf5FAab',
      host: 'localhost' ,
      port: 8545,
      network_id: '*' // Match any network id
    },
    ancon: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.ANCON),
      network_id: '*',
      gas: 7000000,
      gasPrice: 30000000
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.URL),
      network_id: 4,
      gas: 7000000,
      gasPrice: 30000000000
    },
    
    kovan: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.URL),
      network_id: 42,
      gas: 7000000,
      gasPrice: 30000000000
    },

    ropsten: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.URL),
      network_id: 3,
      gas: 5000000,
     // timeoutBlocks: 3,
      gasPrice:  65000000000
    }
  }
};
