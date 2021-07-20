const TalaToken = artifacts.require('TalaToken');
const TalaPool = artifacts.require('TalaPool');

const chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("TalaPool", accounts => {

    const [deployerAccount, recipient, anotherAccount] = accounts;

    it("is possible to get and set rewardRate", async () => {
        let rate = 99;
        let poolInstance = await TalaPool.deployed();

        // test access permissions to getRewardRate
        expect(poolInstance.getRewardRate.call({from: anotherAccount})).to.eventually.be.rejected;
        expect(poolInstance.getRewardRate.call({from: deployerAccount})).to.eventually.be.fulfilled;

        // test access permissions to setRewardRate
        expect(poolInstance.setRewardRate(rate, {from: anotherAccount})).to.eventually.be.rejected;
        return expect(poolInstance.setRewardRate(rate, {from: deployerAccount})).to.eventually.be.fulfilled.then( function () {
            expect(poolInstance.getRewardRate.call({from: deployerAccount})).to.eventually.be.a.bignumber.equal(new BN(rate)); 
        });
    });

    it("is possible to stake in contract and withdraw back", async () => {
        let stakeOf = 5;
        let tokenInstance = await TalaToken.deployed();
        let poolInstance = await TalaPool.deployed();
        let deployerBalance = await tokenInstance.balanceOf(deployerAccount);

        // test 0 allowance, rejection
        expect(poolInstance.depositStake(stakeOf)).to.eventually.be.rejected;
        // test increase allowance
        return expect(tokenInstance.increaseAllowance(poolInstance.address, stakeOf)).to.eventually.be.fulfilled.then( function () {
            // test deposit of stake
            expect(poolInstance.depositStake(stakeOf)).to.eventually.be.fulfilled.then( function () {
                // test stake and account balances
                expect(poolInstance.stakeBalance()).to.eventually.be.a.bignumber.equal(new BN(stakeOf));
                expect(tokenInstance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(new BN(deployerBalance).subn(stakeOf));
                // test stake withdrawal
                expect(poolInstance.withdrawStake(stakeOf)).to.eventually.be.fulfilled.then( function () {
                    // test stake and account balances
                    expect(poolInstance.stakeBalance()).to.eventually.be.a.bignumber.equal(new BN(0));
                    expect(tokenInstance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(new BN(deployerBalance));
                });
            });
        });
    });

    it("is possible to deposit stake and claim reward", async () => {
        let stakeOf = 5;
        let tokenInstance = await TalaToken.deployed();
        let deployerBalance = await tokenInstance.balanceOf(deployerAccount);
        let supply = await tokenInstance.totalSupply();
        let poolInstance = await TalaPool.deployed();

        // test permission for TalaPool to mint
        expect(poolInstance.claimReward.call({from: TalaPool.address})).to.eventually.be.fulfilled;

        return expect(tokenInstance.increaseAllowance(poolInstance.address, stakeOf)).to.eventually.be.fulfilled.then( function () {
            // test deposit of stake
            expect(poolInstance.depositStake(stakeOf)).to.eventually.be.fulfilled.then( function () {
                // test stake reward in contract is > 0
                expect(poolInstance.rewardBalance()).to.eventually.be.a.bignumber.above(new BN(0));
                // test claim reward
                expect(poolInstance.claimReward()).to.eventually.be.fulfilled.then( function () {
                    expect(tokenInstance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.above(new BN(deployerBalance));
                    expect(tokenInstance.totalSupply()).to.eventually.be.a.bignumber.above(new BN(supply));
                });
            });
        });
    });

});
