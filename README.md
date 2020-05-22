# CoinflipDapp

 ## Theme
  a betting dapp on ethereum.
  This dapp is for educational purpose so don't use it on the mainnet.

 ## The rules
  The user bet, a random number is taken : odd, the bet is won, even, it's lost. The initial reward is 2 times the amount of the bet.

 ## Motivation
  it's is one project as part of the [**Ivan On Tech Academy**](https://academy.ivanontech.com/)'s courses. A wonderful place to learn about crypto and  blockchain development with a great community!
  you can follow Ivan and his ["good morning crypto"](https://academy.ivanontech.com/live) each and every morning.

  Thanks to __@ivan-liljeqvist__ and __@filipmartinsson__ to make this knowledge accessible and simple.

  >I really enjoy following this course and developing a dapp. Looking for issues and additional knowledge as part of the process. Certainly a little step but it's a first for me! Perhaps a track for a future reconversion. However, much remains to be done : finish these courses with eth game developing, then eos and btc programming / learn, and validate with recognized certificates, web programming in order to be a full->stack dev.

 ## Presentation
  this is a long [video](https://vimeo.com/421694810) due to the waiting time for the transactions

 ## Goals of the project
  * to develop an ethereum smart contract and deploy it on ropsten testnet.
  * to make use of an oracle.
  * to create the front-end to interact with the contract

  the use of an oracle is relevant in this context to obtain a random number. Indeed, due to the consensus mechanism, one transaction validated can't have many different states in each node (if the random number is computed inside the contract in each nodes). So make this random number be computed off-chain via an oracle allows to have a same state in each node : one transaction to query a random number, and one another with the final treatment (the same random number is part of the transaction across the network).

  >__improvement :__ to follow up the course about security, i make the contract upgradeable using a proxy pattern. The goal is to split data and logic, then by making inherit the proxy from a storage contract we can make them persistent while allowing to modify the logic contract by providing its address to the proxy. This pattern is used with a delegatecall in the fallback function of proxy allowing to use logic's functions with the context of proxy.

  #### learning gained :
    * language :
     * ethereum programming language : solidity
     * approach of assembly code (low level language) for the delegate call allowing the proxy
      to use functions from logic contract with his context (scope) and his storage.
     * management of oracle and events

    * tools and environment :
     * remix ide
     * atom : text editor
     * node : JavaScript runtime built on Chrome's V8 engine (and nvm to manage the node versions)  
     * truffle : development environment, testing framework... using the Ethereum Virtual Machine
     * ganache : to fire up a personal Ethereum blockchain
     * unit testing with mocha and truffle-assertions

   #### personal learning experience aside :
    * web programming language : html, css and the framework bootsrap4
    * front and back end language : javascript and the library jquery
    * github : hosting for software development version control (i miss this point cause i created
       2 repo instead of a branch)

 ## Getting Started
  first get a wallet and some fake eth :
  * install : [Metamask](https://metamask.io/) - your ethereum wallet
  * choose the ropsten network
  * get some testnet eth : https://faucet.metamask.io/

  ### For users :
  in the directory of the dapp open a console and run : `python -m http.server` / in your browser : http://127.0.0.1:8000/

  ### For development :
  #### Prerequisites :
  install : [nodejs](https://nodejs.org/en/)
  via the powershell go in the dapp directory : `cd C:\xxxx\CoinflipDapp (windows)`
  run : `npm install truffle -g`
  in metamask specify a new port for ganache : 7545 or select the network ropsten
  in the dapp directory run : `compil --all`

  **local network**  | **ropsten**
  ------------------------------------|------------------------------------
  download :[ganache](https://www.trufflesuite.com/ganache) & launch ganache then : => contracts => add the truffle-config.js and save |  run : `npm @truffle/hdwallet-provider` and =>copy the seed of your metamask wallet in a file ".secret"
  run : `migrate --reset` | run `migrate --reset --network ropsten`
  =>note the address of the proxy contract and put it in the variable addContract in the main.js
  =>import the accounts private keys from ganache in metamask (account[0] is the owner of the contract)  

  run : `python -m http.server` (your local web server) / access your dapp in the browser at : http://127.0.0.1:8000/

  and play!

  #### to upgrade the contract :
  * in the 2_deploy_Coinflip.js file find the part "upgrade" and recopy the same process with the new
  * contract then deploy with `migrate --reset`(according to the network used)
  * copy/paste the abi of the new contract from build directory to abi.js
  * copy the address of proxy from ganache to the variable addContract in main.js
  * and launch the python server

  ### troubleshooting :
   * on windows for the powershell you need to modify the security to allow scripts :
   'set-ExecutionPolicy remoteSigned' ('set-ExecutionPolicy Restricted')
   * for testing purpose :
     * install truffle-assertions (the tests are not runnable as visibilty has been modified)
     * following the version of node : comment lines 868, 869 in the runner.js of mocha to avoid an issue with REPL

 ## additional documentation
 [w3schools](https://www.w3schools.com/),
 [ethereum forum](https://ethereum.stackexchange.com/),
 [solidity doc](https://solidity.readthedocs.io/en/develop/index.html),
 [web3js doc](https://web3js.readthedocs.io/en/v1.2.6/index.html),
 [provableAPI doc](https://docs.provable.xyz/#ethereum)

 ## Built With
  * solidity 0.5.2
  * node v11.12.0
  * Truffle v5.1.26
  * Web3.js v1.2.1
  * [provableAPI](https://github.com/provable-things/ethereum-api)

 ## Author
  * **ibourn** - *Initial work*

 ## License
  none
