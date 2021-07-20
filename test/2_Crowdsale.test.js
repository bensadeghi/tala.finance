const TalaToken = artifacts.require('TalaToken');
const CrowdSale = artifacts.require('CrowdSale');

const chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("CrowdSale", accounts => {

    const [deployerAccount, recipient, anotherAccount] = accounts;

    it("should be possible to buy tokens", async () => {
        let amountEth = 10;
        let tokenInstance = await TalaToken.deployed();
        let saleInstance = await CrowdSale.deployed();
        let rate = await saleInstance.rate();
        let amountTala = amountEth * rate;
        let balanceTala = await tokenInstance.balanceOf(anotherAccount);
 
        // test buyToken() receive/fallback function
        return expect(tokenInstance.balanceOf(anotherAccount)).to.eventually.be.fulfilled.then(function () {
            expect(saleInstance.sendTransaction({from: anotherAccount, value: amountEth})).to.eventually.be.fulfilled.then(function () {
                expect(tokenInstance.balanceOf(anotherAccount)).to.eventually.be.a.bignumber.equal(balanceTala.add(new BN(amountTala)));
            });
        });
    });

});