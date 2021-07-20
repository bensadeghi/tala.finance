const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const TalaToken = artifacts.require('TalaToken');
const TalaPool = artifacts.require('TalaPool');
const CrowdSale = artifacts.require('CrowdSale');

module.exports = async function (deployer) {
    const INITIAL_TOKENS = 10;
    const addr = await web3.eth.getAccounts();

    // deploy contracts
    let tokenInstance = await deployer.deploy(TalaToken, INITIAL_TOKENS);
    let saleInstance  = await deployProxy(CrowdSale, [100, addr[0], TalaToken.address], {deployer});
    let poolInstance  = await deployProxy(TalaPool, [TalaToken.address], {deployer});

    // grant minter permissions
    let minterRole = await tokenInstance.MINTER_ROLE();
    await tokenInstance.grantRole(minterRole, saleInstance.address);
    await tokenInstance.grantRole(minterRole, poolInstance.address);

  //const instance = await deployProxy(TalaToken, [42], { deployer, initializer: 'store' });
  //const upgraded = await upgradeProxy(instance.address, BoxV2, { deployer, initializer: 'store' });
}