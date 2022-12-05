const { ethers } = require('hardhat');
const { expect } = require('chai');

const CONTROLLER = '0x6847259b2B3A4c17e7c43C54409810aF48bA5210';
const CURVE_LOGIC = '0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8';
const STRATEGY_CMPD_DAI_V2 = '0xCd892a97951d46615484359355e3Ed88131f829D';

const DAI_ = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const CDAI = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
const PDAI = '0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87';

describe('[Challenge] Pickle', function () {
  let strategyCmpdDai;

  before(async function () {
    strategyCmpdDai = await ethers.getContractAt('IStrategyCmpdDaiV2', STRATEGY_CMPD_DAI_V2);
    const balance = await strategyCmpdDai.getSuppliedUnleveraged();
    console.log(`getSuppliedUnleveraged(): ${balance}`, balance);
  });

  it('Exploit', async function () {});

  after(async function () {});
});
