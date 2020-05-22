pragma solidity 0.5.2;

import "./CoinflipStorage.sol";

//MEMO
//events permettent aussi de déboguer les instructions dans fonctions en development

//basic functions of the contract, child of storage to know the variable and allow access
contract CoinflipBase is CoinflipStorage {

  //----------------Modifiers
  //check if minimumBet <= bet <= maximumBet & available balance (balance - rewards to claim)
  //check if no bet is already open for user
  modifier isValidBet(uint256 _amount, address _user) {
      uint256 maxJackpot = (getContractBalance() - _uintStorage['totalRewardToClaim']) / 2;//address(this).balance / 2;
      require(_amount <= _uintStorage['maximumBet'], "bet > maximum");
      require(_amount >= _uintStorage['minimumBet'], "bet < minimum");
      require(_amount <= maxJackpot, "balance needs more funds, too much rewards to claim");
      require(_Accounts[_user]._hasBetOpen == false, "user has already a bet open");
      _;
  }

  //----------------Event
  //  event funded(address user, uint amount);
  event evtNameSet(address _user, string _name);
  //value of param : minimumBet, maximumBet, jackpotFator
  event evtSettingsUpdated(string _param, uint256 _value);
  event evtPauseSet(string _param, bool _value);
  //value of type : deposit, emergencyWithdrawAll, emergencyClaimAllRewards,
  //claimRewards, withdrawReward, withdraw
  event evtFundingOperation(string _type, address _origin, uint256 _newValue);
  event evtMsgToChain(string _msg);


  //----------------Constructor
  constructor() public {
    initialize(msg.sender);
  }

  //----------------Init
  function initialize(address _firstOne) public{
    //require(!_boolStorage['initialized'], "from V2 : contract already initialized");
    if(!_boolStorage['initialized']) {
      _owner = _firstOne;
      _boolStorage["initialized"] = true;
      _paused = false;
      _uintStorage['minimumBet'] = 10**15;//10 finney;//0.001ether
      _uintStorage['maximumBet'] = 10**17;//1000 finney;//0.1ether
      _uintStorage['jackpotFactor'] = 3;
    }
  }

  //----------------Getters
  function getContractBalance() public view returns (uint) {
      return address(this).balance;
  }

  //return reward of all the users
  function getTotalRewardToClaim() public view returns (uint) {
      return _uintStorage['totalRewardToClaim'];
  }

  //return reward of the user
  function getTotalReward() public view returns(uint256) {
    return _Accounts[msg.sender]._uintAccount['rewardToClaim'];
  }

  function getSettings() public view returns(uint256 min, uint256 max, uint256 fact) {
    return (_uintStorage['minimumBet'], _uintStorage['maximumBet'], _uintStorage['jackpotFactor']);
  }

  function getName(address _user) public view returns(string memory) {
    return _Accounts[_user]._name;
  }

  function getPauseState() public view returns(bool) {
    return _paused;
  }

  function getOwnerAdd() public view returns(address) {
    return _owner;
  }

  function getMsgToChain() public view returns(string memory) {
    return _MsgToChain;
  }
  //----------------Setters & Updaters
  //pause/unpause the functions
  function pause() public onlyOwner whenNotPaused{
    _paused = true;
    emit evtPauseSet("pause", _paused);
  }
  function unPause() public onlyOwner whenPaused{
    _paused = false;
    emit evtPauseSet("pause", _paused);
  }

  function setName(string memory _n) public {
    addAccount();
    _Accounts[msg.sender]._name = _n;

    emit evtNameSet(msg.sender, _n);
  }

  //add an account if user is not known
  function addAccount() internal {
    if (!_Accounts[msg.sender]._isKnown) {
      _listOfAccounts.push(msg.sender);
      _Accounts[msg.sender]._isKnown = true;
      }
  }

  function updateMinimumBet(uint256 _newMinimum) public onlyOwner {
    require(_newMinimum < _uintStorage['maximumBet'], "minimum should be less than maximum");
    _uintStorage['minimumBet'] = _newMinimum;
    emit evtSettingsUpdated("minimumBet", _newMinimum);
  }

  function updateMaximumBet(uint256 _newMaximum) public onlyOwner {
    require(_newMaximum > _uintStorage['minimumBet'], "maximum should be more than minimum");
    _uintStorage['maximumBet'] = _newMaximum;
    emit evtSettingsUpdated("maximumBet", _newMaximum);
  }

  function updateJackpotFactor(uint256 _newFactor) public onlyOwner {
    _uintStorage['jackpotFactor'] = _newFactor;
    emit evtSettingsUpdated("jackpotFactor", _newFactor);
  }

  function setMsgToChain(string memory _msg) public onlyOwner whenPaused{
    _MsgToChain = _msg;
    emit evtMsgToChain(_msg);
  }

  //----------------Functions : funding
  //Fund the Contract
  function deposit() public payable onlyOwner {
      require(msg.value != 0);
      emit evtFundingOperation("deposit",msg.sender, msg.value);
  }

  //Withdraw all to the owner
  function emergencyWithdrawAll() public onlyOwner whenPaused {
      withdraw(address(this).balance, msg.sender);
      emit evtFundingOperation("emergencyWithdrawAll",msg.sender, address(this).balance);
    //  return address(this).balance;
  }

  //Withdraw the rewards not claimed to all the users
  //loop all the users and claim
  function emergencyClaimAllRewards() public onlyOwner whenPaused {
    //call to .length overflow if array is empty => in this case revert)
    require(_listOfAccounts.length > 0, "size of _listOfAccounts not consistent");
    uint256 totalOfAccounts = _listOfAccounts.length;

    for(uint256 i = 0; i < totalOfAccounts; i++) {
      address accountId = _listOfAccounts[i];
      if (_Accounts[accountId]._uintAccount['rewardToClaim'] > 0) {
        withdrawReward(accountId);
      }
    }
    emit evtFundingOperation("emergencyClaimAllRewards",msg.sender, 0);
  }

  //claim rewards of one user =>call from front end
  function claimRewards() public whenNotPaused {
      withdrawReward(msg.sender);
  }

  //claim rewards of one user =>call from emergencyClaimAllRewards or claimRewards
  function withdrawReward(address _user) private {
      //gather the reward in bets from user to compare the amount in the account
      require(_listOfBets.length > 0, "size of _listOfBets not consistent");
      require(_Accounts[_user]._accountBets.length > 0, "size of _accountBets not consistent");

      uint256 rewardsToClaim = 0;
      uint256 firstBetToClaimId = 0;
      uint256 totalBetsOfUser = _Accounts[_user]._accountBets.length;
      uint256 nbrOfBetsStored = _listOfBets.length - 1;

      if (_Accounts[_user]._firstBetToClaimId > 0) {
        firstBetToClaimId = _Accounts[_user]._firstBetToClaimId - 1;
        for(uint256 i = firstBetToClaimId; i < totalBetsOfUser; i++) {
          uint256 betToCheckId = _Accounts[_user]._accountBets[i];
          if(betToCheckId <= nbrOfBetsStored) {
              if (!_listOfBets[betToCheckId]._isClaimed){
                _listOfBets[betToCheckId]._isClaimed = true;
              }
          }
        }
        _Accounts[_user]._firstBetToClaimId = 0;
      }
      //faire assert rew=0 et tot
      rewardsToClaim = _Accounts[_user]._uintAccount['rewardToClaim'];
      _uintStorage['totalRewardToClaim'] -= rewardsToClaim;
      _Accounts[_user]._uintAccount['rewardToClaim'] = 0;

      emit evtFundingOperation("claimRewards", _user, rewardsToClaim);
      withdraw(rewardsToClaim, _user);
  }

  //withdraw generic
  function withdraw(uint256 _amount, address _user) internal {
      require(_amount <= getContractBalance(), "amount to withdraw > balance");//address(this).balance, "rewards > balance");
      //cast adr to payable in solidity 0.5 : address(uint160(addr1))
      address payable addrOfUser = address(uint160(_user));
      uint256 balanceAftreTransfer = getContractBalance() - _amount;

      addrOfUser.transfer(_amount);
      assert(getContractBalance() == balanceAftreTransfer);

      emit evtFundingOperation("withdraw", _user, _amount);
  }

}
