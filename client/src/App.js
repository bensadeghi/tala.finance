import React, { Component } from "react";
import TalaToken from "./contracts/TalaToken.json";
import CrowdSale from "./contracts/CrowdSale.json";
import TalaPool from "./contracts/TalaPool.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded:false, totalSupply:0, userTala:0, userETH:0, rate:0, buyAmountETH:0.1 , deposit:0, withdraw:0, stakeBalance:0, rewardBalance:0};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();
      this.toWei = this.web3.utils.toWei;
      this.fromWei = this.web3.utils.fromWei;

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instances.
      this.networkId = await this.web3.eth.net.getId();
      this.tokenInstance = new this.web3.eth.Contract(
        TalaToken.abi,
        TalaToken.networks[this.networkId] && TalaToken.networks[this.networkId].address,
      );

      this.saleInstance = new this.web3.eth.Contract(
        CrowdSale.abi,
        CrowdSale.networks[this.networkId] && CrowdSale.networks[this.networkId].address,
      );

      this.poolInstance = new this.web3.eth.Contract(
        TalaPool.abi,
        TalaPool.networks[this.networkId] && TalaPool.networks[this.networkId].address,
      );

      // Set the state and run listener function
      this.listenToTokenTransfer();
      this.setState({ loaded: true }, () => {this.updateTokens(); this.updateRate()});

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert("Connect to MetaMask Wallet");
      console.error(error);
    }
  };

  updateRate = async () => {
    let rate = await this.saleInstance.methods.rate().call();
    this.setState({ rate: rate });
  }
  updateTokens = async () => {
    let totalSupply = this.fromWei(await this.tokenInstance.methods.totalSupply().call());
    let userTala = this.fromWei(await this.tokenInstance.methods.balanceOf(this.accounts[0]).call());
    let userETH = this.fromWei(await this.web3.eth.getBalance(this.accounts[0]));
    let stakeBalance = this.fromWei(await this.poolInstance.methods.stakeBalance().call({from:this.accounts[0]}));
    let rewardBalance = this.fromWei(await this.poolInstance.methods.rewardBalance().call({from:this.accounts[0]}));
    this.setState({
      totalSupply: totalSupply,
      userTala: userTala,
      userETH: userETH,
      stakeBalance: stakeBalance,
      rewardBalance: rewardBalance
    });
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  listenToTokenTransfer = () => {
    this.tokenInstance.events.Transfer({to: this.accounts[0]}).on("data", this.updateTokens);
    this.poolInstance.events.Deposit({from: this.accounts[0]}).on("data", this.updateTokens);
  }

  handleBuyTokens = async () => {
    if (this.state.buyAmountETH <=0) {
        return;
    } else if (Number(this.state.buyAmountETH) > this.state.userETH) {
        this.setState({buyAmountETH:0});
    } else {
      let buyAmountWei = this.toWei(String(this.state.buyAmountETH));
      await this.saleInstance.methods.buyTokens(this.accounts[0]).send({ from: this.accounts[0] , value: buyAmountWei});
      this.setState({buyAmountETH:0});
    }
  }

  handleDeposit = async () => {
    if (this.state.deposit <=0) {
        return;
    } else if (Number(this.state.deposit) > this.state.userTala) {
        this.setState({deposit:0});
    } else {
        let amountWei = this.toWei(String(this.state.deposit));
        let allowance = await this.tokenInstance.methods.allowance(this.accounts[0], this.poolInstance._address).call();
        if (Number(allowance) === 0 ) {
          await this.tokenInstance.methods.increaseAllowance(this.poolInstance._address, this.web3.utils.toBN("DD15FE86AFFAD91249EF0EB713F39EBEAA987B6E6FD2A0000000000000000000")).send({from: this.accounts[0]}); // approve 1e77
        }
        await this.poolInstance.methods.depositStake(amountWei).send({from: this.accounts[0]});
        this.setState({deposit:0});
    }
  }

  handleWithdraw = async () => {
    if (this.state.withdraw <=0) {
        return;
    } else if (Number(this.state.withdraw) > this.state.stakeBalance) {
        this.setState({withdraw:0});
    } else {
        let amountWei = this.toWei(String(this.state.withdraw));
        await this.poolInstance.methods.withdrawStake(amountWei).send({from: this.accounts[0]});
        this.setState({withdraw:0});
    }
  }

  handleClaim = async () => {
    await this.poolInstance.methods.claimReward().send({from: this.accounts[0]});
  }

  handleMax = async (event) => {
    const name = event.target.name;
    switch(name) {
      case "buyAmountETH":
        this.setState({buyAmountETH: this.state.userETH});
        break;
      case "deposit":
        this.setState({deposit: this.state.userTala});
        break;
      case "withdraw":
        this.setState({withdraw: this.state.stakeBalance});
        break;
      default:
        break;
    }
  }


  render() {
    if (!this.state.loaded) {
      // return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Tala Factory</h1>
        <p>Deployed on Ropsten Testnet <a href="https://faucet.dimensions.network/" target="_blank" rel="noopener noreferrer">(get test Ether)</a></p>
        <p>TALA Address: <a href="https://ropsten.etherscan.io/token/0x17064212fe45446289fa6a598b206dd599e79b07" target="_blank" rel="noopener noreferrer">0x17064212fe45446289fA6a598B206DD599e79B07</a></p>
        <h2>Swap ETH for TALA</h2>
        <h3>1 ETH = {this.state.rate} TALA</h3>
        <h4>Total Supply: {this.state.totalSupply} TALA</h4>
        <p>Your Wallet:</p>
        {this.state.userTala} TALA
        <p>{this.state.userETH} ETH</p>
        <input type="text" name="buyAmountETH" value={this.state.buyAmountETH} onChange={this.handleInputChange} />
        <button type="button" name="buyAmountETH" onClick={this.handleMax}>Max</button>
        <button type="button" onClick={this.handleBuyTokens}>Swap ETH</button>
        <br></br>
        <br></br>
        <h1>Tala Finance</h1>
        <h2>Stake TALA and Earn Rewards</h2>
        <p>Your Deposit Balance: {this.state.stakeBalance} TALA</p>
        <input type="text" name="deposit" value={this.state.deposit} onChange={this.handleInputChange} />
        <button type="button" name="deposit" onClick={this.handleMax}>Max</button>
        <button type="button" onClick={this.handleDeposit}>Deposit</button>
        <br></br>
        <input type="text" name="withdraw" value={this.state.withdraw} onChange={this.handleInputChange}/>
        <button type="button" name="withdraw" onClick={this.handleMax}>Max</button>
        <button type="button" onClick={this.handleWithdraw}>Withdraw</button>
        <p>Your Reward Balance: {this.state.rewardBalance} TALA</p>
        <button type="button" onClick={this.handleClaim}>Claim Reward</button>
        <br></br>
        <br></br>
      </div>
    );
  }
}

export default App;
