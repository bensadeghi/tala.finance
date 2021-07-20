const TalaToken = artifacts.require('TalaToken');

const chai = require("./setupchai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

require("dotenv").config({path: "../.env"});

contract("TalaToken", accounts => {

  const [deployerAccount, recipient, anotherAccount] = accounts;

  beforeEach(async() => {
     this.token = await TalaToken.new(process.env.INITIAL_TOKENS);
  })

  it("is possible to send tokens between accounts", async() => {
      const sendTokens = 1;
      let instance = this.token;
      let totalSupply = await instance.totalSupply();
      expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(totalSupply);
      return expect(instance.transfer(recipient, sendTokens)).to.eventually.be.fulfilled.then(function () {
          expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));
          expect(instance.balanceOf(recipient)).to.eventually.be.a.bignumber.equal(new BN(sendTokens));
      });
  });

  it("is not possible to send more tokens than available in total", async () => {
      let instance = this.token;
      let balanceOfDeployer = await instance.balanceOf(deployerAccount);
      expect(instance.transfer(recipient, new BN(balanceOfDeployer+1))).to.eventually.be.rejected;
      return expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(balanceOfDeployer);
  });

});
