import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Accounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to Infura RPC...
      else {
        const provider = new Web3.providers.HttpProvider(
          "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // MetaMask key
        );
        const web3 = new Web3(provider);
        alert("Connect to MetaMask Wallet - Ropsten Testnet");
        console.log("No web3 instance injected, using Infura RPC.");
        resolve(web3);
      }
    });
  });

export default getWeb3;
