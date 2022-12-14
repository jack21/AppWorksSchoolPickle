require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        // url: process.env.ALCHEMY_URL,
        url: process.env.INFURA_URL,
        blockNumber: 11303122, // Pickle 被攻擊的 BlockNumber: 11303123
        enabled: true,
      },
    },
  },
};
