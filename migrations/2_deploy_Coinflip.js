//definir notre contract
//const SafeMath = artifacts.require('SafeMath');
const Proxy = artifacts.require('CoinflipProxy'); //charge contrat Proxy
const CoinflipMainV3 = artifacts.require('CoinflipMainV3');
const CoinflipMainV1 = artifacts.require('CoinflipMainV1');
const CoinflipMainV2 = artifacts.require('CoinflipMainV2');
//https://github.com/trufflesuite/truffle/issues/1655

module.exports = async function(deployer, networks, accounts){

     var instanceProxy,instanceCoinflipV1,instanceCoinflipV2, instanceCoinflipV3, instance;

    /////////////////////////////////TESTNET : ROPSTEN NETWORK///////////////////
    if (networks == "ropsten-fork" || networks == "ropsten") {
      //ropsten-fork for option --dry-run (simulation)
      /////////////////////////////////DEPLOYMENT V3 via PROXY///////////////////
      //metamask projects : acc 0, 1,2,3 funded with eth ropsten
      console.log("Deployment CoinflipV3 via Proxy...");
      await deployer.deploy(CoinflipMainV3,{ from : accounts[0]});

      instanceCoinflipV3 = await CoinflipMainV3.deployed();
      console.log("coinflipV3 address : " + instanceCoinflipV3.address);

      await deployer.deploy(Proxy,instanceCoinflipV3.address,{from : accounts[0]});
      instanceProxy = await Proxy.deployed({from : accounts[0]});
      console.log("Proxy address : " + instanceCoinflipV3.address);

      instance = await CoinflipMainV3.at(instanceProxy.address);
      await instance.initialize(accounts[0]);
      //await instance.deposit({value: web3.utils.toWei("0.1","ether"), from: accounts[0]});
      console.log("instance address : " + instance.address + " funded with " + "0.1 ether");

    } else {
    /////////////////////////////////DEVELOPMENT : LOCAL NETWORK/////////////////
    //=> metamask & ganache
    /////////////////////////////////DEPLOYMENT V1 via PROXY///////////////////
      console.log("Deployment CoinflipV1 via Proxy...");
      await deployer.deploy(CoinflipMainV1,{from : accounts[0]});
      instanceCoinflipV1 = await CoinflipMainV1.deployed();
      console.log("coinflipV1 address : " + instanceCoinflipV1.address);

      await deployer.deploy(Proxy,instanceCoinflipV1.address,{from : accounts[0]});
      instanceProxy = await Proxy.deployed({from : accounts[0]});
      console.log("Proxy address : " + instanceCoinflipV1.address);

      var instance = await CoinflipMainV1.at(instanceProxy.address);
      await instance.initialize(accounts[0]);
      console.log("instance address : " + instance.address);

      /////////////////////////////////UPGRADING proxy TO V2///////////////////
      console.log("Upgrading to CoinflipV2...");
      await deployer.deploy(CoinflipMainV2,{from : accounts[0]});
      instanceCoinflipV2 = await CoinflipMainV2.deployed();
      console.log("coinflipV2.address : " + instanceCoinflipV2.address);

      instanceProxy = await Proxy.deployed({from : accounts[0]});
      await instanceProxy.upgrade(instanceCoinflipV2.address,{from : accounts[0]});
      instance = await CoinflipMainV2.at(instanceProxy.address);
      await instance.initialize(accounts[0]);
    }
}

//MEMO commandes
//truffle init / npm init
//truffle compile --all
//truffle migrate --reset --network ropsten --verbose-rpc
//truffle migrate --reset / truffle migrate --reset --network develop
//truffle develop => acces console then : migrate... / test...
//provide wallet and 10 accounts
//truffle console => acces ganache console then : migrate... / test...
//usage of ganache accounts
// python -m http.server => to run the web server with http://127.0.0.1:8000/

//video windows + G
