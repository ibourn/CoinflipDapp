pragma solidity 0.5.2;

import "./CoinflipBase.sol";
import "./provableAPI.sol";
//import "./SafeMath.sol";

contract CoinflipMainV1 is CoinflipBase, usingProvable {

  //----------------Variables

  //----------------Modifiers

  //----------------Event : ADDs TO MATCH FRONT-END FOR v3
  event evtBetOpened(address _user, string _msg, uint256 _id, uint256 _amount);
  event evtBetQuery(address _user, string _msg);
  event evtBetResume(address _user, string  _msg, uint256 _randomResult);
  event evtBetResult(address _user, bool _isWon);
  event evtBetClosed(address _user, string _status, uint256 _id);//, uint256 _amount, uint256 _jackpot, bool _isWon);

  //----------------Constructor
  constructor() public {
  }

  //----------------Getters : ADDED TO MATCH FRONT-END FOR v3
  function getUserPendingBetState(address _user) public view returns(bool){
      return _Accounts[_user]._hasBetOpen;
  }

  //----------------Functions : main logic

  //Main function => initialize a bet / no result => waiting for oracle
  function flip() public payable isValidBet(msg.value, msg.sender) whenNotPaused {
    //check if user is known
    addAccount();
    //INITIALIZATION of a new flip
    Bet memory newBet;
    newBet._amountBet = msg.value;
    newBet._jackpotFactor = _uintStorage['jackpotFactor'];

    uint256 betId = _listOfBets.push(newBet) - 1; // = _listOfBets.length - 1
    _Accounts[msg.sender]._accountBets.push(betId);

    emit evtBetOpened(msg.sender, "New bet taken : initialization...", betId, msg.value);

    //RANDOMNUMBER
    uint256 result = runPseudoRandom();
    bool betIsWon = result == 1;

    uint256 jackpot = _listOfBets[betId]._jackpotFactor * _listOfBets[betId]._amountBet;
    //EVALUATION => set the new states
    if(betIsWon) {
      _listOfBets[betId]._isWin = true;
      _uintStorage['totalRewardToClaim'] += jackpot;
      _Accounts[msg.sender]._uintAccount['totalWon'] += jackpot;
      _Accounts[msg.sender]._uintAccount['rewardToClaim'] += jackpot;

      if (_Accounts[msg.sender]._firstBetToClaimId == 0) {
        _Accounts[msg.sender]._firstBetToClaimId = _Accounts[msg.sender]._accountBets.length;   //not -1, 0 is flag
      }
      emit evtBetResult(msg.sender, true);
    }
    else {
      _listOfBets[betId]._isClaimed = true;

      emit evtBetResult(msg.sender, false);
    }
    _Accounts[msg.sender]._uintAccount['totalLost'] += _listOfBets[betId]._amountBet;

    ////CLOSE THE BET
    _listOfBets[betId]._isClosed = true;

    emit evtBetClosed(msg.sender, "Bet completed and closed", betId);//, _listOfBets[betId]._amountBet, jackpot, _listOfBets[betId]._isWin);
  }

  //return the result : a random number : 0 or 1
  //V1 =>pseudo randmoness (testing parity of now timestamp)
  function runPseudoRandom() public view returns(uint256) {
      uint256 time = now;
      uint256 result = time % 2;

      assert(result == 0 || result == 1);
      return result;
  }


}
