require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require('dotenv').config()

// import "@nomiclabs/hardhat-truffle5";
// import "@nomiclabs/hardhat-ethers";
// import "@nomiclabs/hardhat-etherscan";
// import "@nomiclabs/hardhat-web3";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// module.exports = {
//   solidity: "0.8.3",
// };

// import { getDeployParams, GetEnv, EnvNames } from './scripts/utils'

// const env = GetEnv()

module.exports = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
      gas: 10000000,
    },
    local: {
      url: 'http://127.0.0.1:8545',
      blockGasLimit: 10000000,
      gas: 10000000,
      network_id: '*', // eslint-disable-line camelcase
    },
    // bsctestnet: {
    //   url: `${env[EnvNames.RPC_URL_BSCTESTNET]}`,
    //   accounts: [`0x${env[EnvNames.OWNER_WALLET_PK]}`],
    //   chainId: 97,
    // },
    // rinkeby: {
    //   url: `${env[EnvNames.RPC_URL_RINKEBY]}`,
    //   accounts: [`0x${env[EnvNames.OWNER_WALLET_PK]}`],
    //   chainId: 4,
    // },
    // deploy: getDeployParams(),
  },
  gasReporter: {
    chainId: 1,
    enabled: !!process.env.REPORT_GAS === true,
    currency: 'USD',
    gasPrice: 21,
    showTimeSpent: true,
  },
}
