pragma solidity 0.5.2;

import "./CoinflipBase.sol";
import "./provableAPI.sol";
//import "./SafeMath.sol";

contract CoinflipMainV2 is CoinflipBase, usingProvable {

  //----------------Variables

  //----------------Modifiers


  //----------------Event
  event evtBetOpened(address _user, string _msg, uint256 _id, uint256 _amount);
  event evtBetQuery(address _user, string _msg);
  event evtBetResume(address _user, string  _msg, uint256 _randomResult);
  event evtBetResult(address _user, bool _isWon);
  event evtBetClosed(address _user, string _status, uint256 _id);//, uint256 _amount, uint256 _jackpot, bool _isWon);

  //----------------Constructor
  constructor() public {
  }

  //----------------Getters :
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

    uint256 lastBetId = _listOfBets.push(newBet) - 1; // = _listOfBets.length - 1
    _Accounts[msg.sender]._uintAccount['lastBetOfUserId'] = lastBetId;
    _Accounts[msg.sender]._accountBets.push(lastBetId);
    _Accounts[msg.sender]._hasBetOpen = true;

    emit evtBetOpened(msg.sender, "New bet taken : initialization...", lastBetId, msg.value);

    //RANDOMNUMBER => emulate query to oracle process
    //fake ticket id as queryId, result and proof
    uint256 ident = (_Accounts[msg.sender]._accountBets.length * 10000) + (now % 10000);
    bytes32 queryId = bytes32(keccak256(abi.encodePacked(ident)));

    uint256 temp = ident % 2;
    string memory result = (temp == 0) ? "0" : "1";

    bytes memory proof = "testproof";

    _Queries[queryId] = msg.sender;
     emit evtBetQuery(msg.sender, "Provable query was sent, standing by for answer...");

    __callback(queryId, result, proof);
  }

  //__callback function called by oracle => resume the process
  function resumeFlip(uint256 _result, address _user) private {
    //get the bet opened matching the answer
    uint256 betId = _Accounts[_user]._uintAccount['lastBetOfUserId'];

    uint256 jackpot = _listOfBets[betId]._jackpotFactor * _listOfBets[betId]._amountBet;
    _Accounts[_user]._uintAccount['totalLost'] += _listOfBets[betId]._amountBet;

    bool betIsWon = _result == 1;

    //EVALUATION => set the new states
    if(betIsWon) {
      _listOfBets[betId]._isWin = true;
      _uintStorage['totalRewardToClaim'] += jackpot;
      _Accounts[_user]._uintAccount['totalWon'] += jackpot;
      _Accounts[_user]._uintAccount['rewardToClaim'] += jackpot;

      if (_Accounts[_user]._firstBetToClaimId == 0) {
        _Accounts[_user]._firstBetToClaimId = _Accounts[_user]._accountBets.length;   //not -1, 0 is flag
      }
      emit evtBetResult(_user, true);
    }
    else {
      _listOfBets[betId]._isClaimed = true;

      emit evtBetResult(_user, false);
    }
    ////CLOSE THE BET
    _Accounts[_user]._hasBetOpen = false;
    _listOfBets[betId]._isClosed = true;

    emit evtBetClosed(_user, "Bet completed and closed", betId);//, _listOfBets[betId]._amountBet, jackpot, _listOfBets[betId]._isWin);
  }

  //oracle callback function
  function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
      require(msg.sender == provable_cbAddress());

      address user =  _Queries[_queryId];
      //MEMO :
      //these lines made the deployment not possible : run out of gas
      //test : decreasing the bytecode / settings gas / different versions of nodes via nvm
      //the only way to deploy was to remove them => so aborte not necessary
      //if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0) {
           //error when processing the oracle
      //     abortFlip(user);
      //}
      //else {
          //success => data conversion to uint256 (data on BC are bytes)
          uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result)));
          //test parity (rule of the game)
          uint256 result = randomNumber % 2;

          //emit evtTesting("bet callback, number : ",randomNumber);
          emit evtBetResume(user, "Result received, evaluation of the bet...", randomNumber);
          resumeFlip(result, user);
      //}
  }

  //MEMO : see __callback
  //Todo : instead of abort cause of an error => enable aborted flip by user
  // function abortFlip(address _user) private {
  //   uint256 betId = _Accounts[_user]._uintAccount['lastBetOfUserId'];
  //   uint256 amountToRefund = _listOfBets[betId]._amountBet;
  //
  //   _listOfBets[betId]._isClaimed = true;
  //   _Accounts[_user]._hasBetOpen = false;
  //   _listOfBets[betId]._isClosed = true;
  //
  //   withdraw(amountToRefund, _user);
  //   emit evtBetClosed(_user, "Aborted, refund in progress...", betId);//, amountToRefund, 0, false);
  // }

}
