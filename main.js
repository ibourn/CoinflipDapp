var web3 = new Web3(Web3.givenProvider);
var contractInstance;
var network;
var pause;
var adduser, addowner;
var ownerIn=false;
//ADDRESS of deployment on ropsten : 0xbf1b63292a9893a78dBB7b209e048987D5E5fEb9
//old 0x25B1F3366af2Ff2E81E2B7E4D7D1de17bFB77e4f
//ADD THE ADDRESS OF PROXY HERE IF Changed :
var addContract = "0xbf1b63292a9893a78dBB7b209e048987D5E5fEb9";

//////////////////////////PROCESS TO CANCEL Tx//////////////////////
//if there's a spending Tx on ropsten => deployment stucked
//put higher fees >10%
// web3.eth.sendTransaction({
// from: add,//ATTENTION "0x...." & lowercase
// to: add,
// value: 0,
// gasPrice: "0x...",//amount 33gwei =>wei
// gasLimit: "0x...",
// gas: "0x...",
// nonce: "0x.."//nonce of tx to cancel
// }, function(error, hash){
// console.log("transaction : hash "+ hash);
// console.error;
// });

$(document).ready(function() {
    //get the network
    web3.eth.net.getNetworkType().then(function(res){
      display("#network", res, "fetch");
    });

    //get the user access autorisation & creat instance to interact with
    window.ethereum.enable().then(function(accounts){
        adduser = accounts[0];
        console.log("User address : " + adduser);

        contractInstance = new web3.eth.Contract(abi, addContract, {from: adduser});
        console.log("Contract address : " + contractInstance.address);

        fetchAndDisplay();

        listenToGeneralEvents();
    });

    //-----------------Triggered if metamask account changes
    window.ethereum.on('accountsChanged', function (accounts) {
      //MEMO pas sure que la manip soit approriée mais sinon msg erreur add from non valide
      window.ethereum.enable().then(function(accounts){
          adduser = accounts[0];
          console.log("User address changed to : " + adduser);
          contractInstance = new web3.eth.Contract(abi, addContract, {from: adduser});
          console.log("Contract address : " + contractInstance.address);

          fetchAndDisplay();

          listenToGeneralEvents();
      });
    })

    //-----------------Page events
    $("#bet_btn").click(flip);
    $("#claim_btn").click(claimRewards);
    $("#name_btn").click(setName);

    $("#owner_btn").click(ownerAccess);
    $("#pause_btn").click(setPause);
    $("#unpause_btn").click(setUnpause);
    $("#min_btn").click(updateMinimumBet);
    $("#max_btn").click(updateMaximumBet);
    $("#mult_btn").click(updateJackpotFactor);
    $("#msg_btn").click(setMsgToChain);
    $("#deposit_btn").click(deposit);
    $("#emergencywithdraw_btn").click(emergencyWithdrawAll);
    $("#emergencyclaim_btn").click(emergencyClaimAllRewards);

    $("#owner_btn").click(ownerAccess);
});

//------------------ getters => display

function fetchAndDisplay(){
  ownerAccessManager();

  fetchAndDisplayUserBalance();

  fetchAndDisplayPendingBet();

  fetchAndDisplayBalance();

  fetchAndDisplayReward();

  fetchAndDisplayPauseState();

  contractInstance.methods.getMsgToChain().call().then(function(res){
    display("#msg_output", res, "pending");
  });

  contractInstance.methods.getSettings().call().then(function(res){
   display("#min_span", res.min, "fetch");
  });

  contractInstance.methods.getSettings().call().then(function(res){
   display("#max_span",res.max, "fetch");
  });

  contractInstance.methods.getSettings().call().then(function(res){
   display("#reward_factor",res.fact, "fetch");
   console.log("fetch : FACTOR : " + res);
  });

  contractInstance.methods.getName(adduser).call().then(function(res){
    display("#name_output", ((res != "") ? res : adduser), "fetch");
  });
}

//MEMO not test yet
function fetchAndDisplayPendingBet(){
  contractInstance.methods.getUserPendingBetState(adduser).call().then(function(res){
   if(res) {
     pendingFlip();
   }
  });
}

function fetchAndDisplayUserBalance(){
  web3.eth.getBalance(adduser).then(function(res){
  display("#balance_user", res, "fetch")});
}

function fetchAndDisplayBalance(){
  contractInstance.methods.getContractBalance().call().then(function(res){
   display("#balance_output", res, "fetch");
  });
}

function fetchAndDisplayReward(){
    contractInstance.methods.getTotalReward().call({from : adduser}).then(function(res){
     display("#reward_output", res, "fetch");
   });
}

function fetchAndDisplayPauseState(){
  //call appel methode via l enoeud sans transaction (renvoi erroe, resultat)
  contractInstance.methods.getPauseState().call().then(function(res){
    pauseStateManager(res);
  });
}

//------------------ states manager
function ownerAccessManager(){
  contractInstance.methods.getOwnerAdd().call().then(function(res){
    addowner = res.toLowerCase();
    console.log("Owner address : " + addowner);

    if (addowner == adduser) {
      console.log("addowner == adduser" + (addowner == adduser));
      $("#owner_btn").removeAttr("disabled");//, "disabled");
    } else {
      $("#owner_btn").attr("disabled", "disabled");
    }
  });
}

function pauseStateManager(state){
    if (state) {
      $("#unpause_btn").removeClass("disabled");//.removeAttr("disabled");
      $("#pause_btn").addClass("disabled");//.attr("disabled", "disabled");
    } else {
      $("#unpause_btn").addClass("disabled");//.attr("disabled", "disabled");
      $("#pause_btn").removeClass("disabled");////.removeAttr("disabled");
    }
}

function settingEventManager(error, event) {
  if(!error) {
    switch(event.returnValues._param) {
      case "minimumBet" :
        display("#min_span", event.returnValues._value, "set");
        break;
      case "maximumBet" :
        display("#max_span", event.returnValues._value, "set");
        break;
      case "jackpotFator" :
        display("#reward_factor", event.returnValues._value, "set");
        break;
      case "pause" :
        pauseStateManager(event.returnValues._value);
        break;
    }
  } else {
    console.log(error);
  }
}

//To do : add a param in event to get the new value and don't have to call via fetch
//centralize funding events management here
function fundingEventManager(error, event) {
  if(!error) {
    switch(event.returnValues._param) {
      case "deposit" :
        fetchAndDisplayBalance();
        console.log(event);
        break;
      case "emergencyWithdrawAll" :
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
        console.log(event);
        break;
      case "emergencyClaimAllRewards" :
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
        console.log(event);
        break;
      case "claimRewards" :
        console.log(event);
        break;
      case "withdrawReward" :
        console.log(event);
        break;
      case "withdraw" :
        console.log(event);
        break;
    }
  } else {
    console.log(error);
  }
}

//------------------ main display

//src : reset => "" via val / fetching and pending : display text
function display(id, res, src) {
  if (src != "reset") {
    switch (id) {
      case "#min_span" :
        $("#min_span").text(web3.utils.fromWei(res.toString(),"ether") + " ");
        break;
      case "#max_span" :
        $("#max_span").text(" " + web3.utils.fromWei(res.toString(),"ether"));
        break;
      case "#reward_factor" :
        $("#reward_factor").text(res - 1);
        break;
      case "#balance_output" :
        $("#balance_output").text(web3.utils.fromWei(res.toString(),"ether") + " eth");
        break;
      case "#reward_output" :
        $("#reward_output").text(web3.utils.fromWei(res.toString(),"ether"));
        break;
      case "#balance_user" :
        $("#balance_user").text(web3.utils.fromWei(res.toString(),"ether"));
        break;
      case "#msg_output" :
        $("#msg_output").text("   " + res);
        break;
      default:
        $(id).text(res);
    }
  } else {
    $(id).val(res);
  }
    console.log(src + " " + id + " to " + res);
}

//------------------ display dismissible box
function appendAlert(id, txt, success) {
  var element = "";
  var elementAlerte1 = "<div class=\"alert alert-";
  var elementAlerte2 = " alert-dismissible\">" +
  "<a href=\"#\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">" +
  "&times;</a><strong>";
  var elementType1 = success ? "success" : "warning";
  var elementType2 = success ? "Success!" : "Warning!" + "</strong>";

  element = elementAlerte1 + elementType1 + elementAlerte2 + elementType2 + txt + "</div>";

  $(id).append(element);
  console.log(element);
}

//------------------ general events listeners

function listenToGeneralEvents(){
  contractInstance.events.evtSettingsUpdated(function(error, event){
    settingEventManager(error, event);
  });

  contractInstance.events.evtPauseSet(function(error, event){
    settingEventManager(error, event);
  });

  contractInstance.events.evtFundingOperation(function(error, event){
    fundingEventManager(error, event);
  });

  contractInstance.events.evtMsgToChain(function(error, event){
    display("#msg_output", event.returnValues._msg, "pending");
  });
}



//------------------ user functions
function ownerAccess() {
  if (!ownerIn) {
    $("#image").hide(()=>{ownerIn = true;});
  } else {
    $("#image").show(()=>{ownerIn = false;});
  }
}

function flip(){
    var success;
    var evtBetResult = 0;
    var evtBetClosed = 0;
    var betInput = $("#bet_input").val();
    var userConfig = {
        from : adduser,
        value: web3.utils.toWei(betInput,"ether")
    }

    //---------------SCENARIO
    //---------------user actives flip button =>
    //--------disable the button as only one bet is allow
    $("#bet_btn").attr("disabled", "disabled");
    //--------display an animation to wait the end of the process
    $("#bet_btn").html("<span id='bet_spin' " +
      "class='spinner-border spinner-border-sm'></span>Processing...");
    //---------indication of step : bet taken, waiting for Tx
    display("#evt_output", "Waiting for your transaction...", "pending");


    contractInstance.methods.flip().send(userConfig)
    .on("transactionHash", function(hash){
        console.log("flip hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("flip conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("flip rcpt : " + receipt);
    })
    .on('error', function(error){
      //---------------error occured with Tx => stop the scenario
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
        //-------------display for 3 sec a msg for Tx error
        display("#evt_output", "Something went wrong, no bet taken", "pending");
        setTimeout(function(){
          display("#evt_output", "", "pending");
        }, 3000);

        console.error;
    })


    //---------------listen to the events and filter the user
    //---------indication of step : Tx received, bet initialized
    contractInstance.events.evtBetOpened(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    })
    //---------indication of step : Query to oracle, waiting the answer
    contractInstance.events.evtBetQuery(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    });
    //---------indication of step : result received, evalutaion
    contractInstance.events.evtBetResume(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        display("#evt_output", event.returnValues._msg, "pending");
      }
    });
    //---------indication of step : bet won or lost
    contractInstance.events.evtBetResult(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        var resultOfBet = (event.returnValues._isWon) ?
        "  Hip hip hooray! YOU WON! Your reward increased... will you succeed in emptying the contract? " :
        "  Bet lost! Sorry, it's even money... try again! Take one more chance! ";
        display("#evt_output", resultOfBet, "pending");
        evtBetResult += 1;
        if (evtBetResult == 1) {
          appendAlert("#colUser", resultOfBet , event.returnValues._isWon);
        }
      }
    });

    //---------------contract send event : bet closed for this user=>
    //--------enable the button and reset the button state
    contractInstance.events.evtBetClosed(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
    //---------indication of step : reset the information field
        setTimeout(function(){
          display("#evt_output", "", "pending");
        }, 3000);
        //display("#evt_output", "", "pending");
    //---------indication of step : bet closed or aborted
        evtBetClosed += 1;
        success = !(event.returnValues._status == "Aborted, refund in progress...");
        if (evtBetClosed == 1) {
          appendAlert("#colUser", event.returnValues._status ,success);
        }
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
       }
    });
    display("#bet_input", "", "reset");

}

//MEMO not test yet
function pendingFlip(){
    //---------------SCENARIO
    //---------------there's a pending flip =>
    //--------disable the button as only one bet is allow
    $("#bet_btn").attr("disabled", "disabled");
    //--------display an animation to wait the end of the process
    $("#bet_btn").html("<span id='bet_spin' " +
      "class='spinner-border spinner-border-sm'></span>Processing...");
    //---------indication of step : bet taken, waiting for Tx
    display("#evt_output", "You have a pending bet...", "pending");

    //---------indication of step : bet won or lost
    contractInstance.events.evtBetResult(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        var resultOfBet = (event.returnValues._isWon) ?
        "  Hip hip hooray! YOU WON ! Your reward increased... " :
        "  Bet lost! Sorry, it's even money... try again! Take one more chance! ";
        display("#evt_output", resultOfBet, "pending");
        evtBetResult += 1;
        if (evtBetResult == 1) {
          appendAlert("#mainContainer", resultOfBet , event.returnValues._isWon);
        }
      }
    });

    //---------------contract send event : bet closed for this user=>
    //--------enable the button and reset the button state
    contractInstance.events.evtBetClosed(function(error, event){
      if(event.returnValues._user.toLowerCase() == adduser){
        $("#bet_btn").removeAttr("disabled", "enabled");
        $("#bet_btn").html("Flip the coin");
    //---------indication of step : reset the information field
        display("#evt_output", "", "pending");
    //---------indication of step : bet closed or aborted
        evtBetClosed += 1;
        success = !(event.returnValues._status == "Aborted, refund in progress...");
        if (evtBetClosed == 1) {
          appendAlert("#colUser", event.returnValues._status ,success);
        }
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
       }
    });

}


function setName(){
  var input = $("#name_input").val();

    contractInstance.methods.setName(input).send()
    .on("transactionHash", function(hash){
        console.log("setName hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("setName conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("setName rcpt : " + receipt);
        appendAlert("#colUser"," New name set : " + input, true);

    })
    .on('error', console.error);

    //MEMO essai de ne pas avoir 3 fois la boite modale en filtrant le bloc ecouté
    //ça ne change rien
    //var latestBlock = web3.eth.blockNumber; //get the latest blocknumber
    //contractInstance.events.evtNameSet({fromBlock: latestBlock}, function(error, event){

    //----waiting the event of the new name set to display it
    contractInstance.events.evtNameSet(function(error, event){
      if (event.returnValues._user.toLowerCase() == adduser) {
        display("#name_output", event.returnValues._name, "set");
        //appendAlert("#colUser"," New name set : " + input, true); //pb : duplicate action 3 times
        display("#name_input", "", "reset");
      }
    })
    //.on('error', console.error);
}




function claimRewards(){
    contractInstance.methods.claimRewards().send()
    .on("transactionHash", function(hash){
        console.log("claim hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("claim conf " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("claim rcpt " + receipt);
        appendAlert("#colUser", " You claimed your reward! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on('error', console.error);
}


//-------------------owner functions
function updateMinimumBet(){
  var input = $("#min_input").val();
  var value = web3.utils.toWei(input,"ether");
    contractInstance.methods.updateMinimumBet(value).send()
    .on("transactionHash", function(hash){
        console.log("updateMin hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateMin conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateMin rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New minimum set : " + value, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#min_input", "", "reset");
}

function updateMaximumBet(){
    var input = $("#max_input").val();
    var value = web3.utils.toWei(input,"ether");

    contractInstance.methods.updateMaximumBet(value).send()
    .on("transactionHash", function(hash){
        console.log("updateMax hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateMax conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateMax rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New maximum set : " + value, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#max_input", "", "reset");
}

function updateJackpotFactor(){
    var input = $("#mult_input").val();
    var value = parseInt(input);

    contractInstance.methods.updateJackpotFactor(value).send()
    .on("transactionHash", function(hash){
        console.log("updateFact hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("updateFact conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("updateFact rcpt : " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New factor set : " + input, true);
    })
    .on("error",function(error){
        console.error;
    })
    display("#mult_input", "", "reset");
  }

function deposit(){
    var depositInput = $("#deposit_input").val();
    var depositValue = {
        value: web3.utils.toWei(depositInput,"ether")
    }
    contractInstance.methods.deposit().send(depositValue)
    .on("transactionHash", function(hash){
        console.log("deposit hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("deposit conf " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("deposit rcpt " + receipt);
        //----inform the owner
        appendAlert("#colOwner"," New deposit : " + web3.utils.fromWei(depositInput,"ether"), + " eth", true);
        fetchAndDisplayBalance();
    })
    .on("error",function(error){
        console.error;
    })
}

function emergencyWithdrawAll(){
    contractInstance.methods.emergencyWithdrawAll().send()
    .on("transactionHash", function(hash){
        console.log("emwithAll hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("emwithAll conf " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("emwithAll rcpt " + receipt);
        //----inform the owner
        appendAlert("#colOwner", " Emregency withdraw! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on("error",function(error){
        console.error;
    })


}

function emergencyClaimAllRewards(){
    contractInstance.methods.emergencyClaimAllRewards().send()
    .on("transactionHash", function(hash){
        console.log("emclaimAll hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("emclaimAll conf " +confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("emclaimAll rcpt " +receipt);
        //----inform the owner
        appendAlert("#colOwner", " Emregency claim! ", true);
        fetchAndDisplayBalance();
        fetchAndDisplayReward();
    })
    .on("error",function(error){
        console.error;
    })

}


function setPause(){
    contractInstance.methods.pause().send()
    .on("transactionHash", function(hash){
        console.log("pause hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("pause conf " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("pause rcpt " + receipt);
        //----inform the owner
        appendAlert("#colOwner", " Contract paused! ", true);
    })
    .on("error",function(error){
        console.error;
    });
}

function setUnpause(){
    contractInstance.methods.unPause().send()
    .on("transactionHash", function(hash){
        console.log("unpause hash " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("unpause conf " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("unpause rcpt " + receipt);
        //----inform the owner
        appendAlert("#colOwner", " Contract unpaused! ", true);
    })
    .on("error",function(error){
        console.error;
    });
}

function setMsgToChain(){
  var input = $("#msg_input").val();

    contractInstance.methods.setMsgToChain(input).send()
    .on("transactionHash", function(hash){
        console.log("setMsgToChain hash : " + hash);
    })
    .on("confirmation", function(confirmationNr){
        console.log("setMsgToChain conf : " + confirmationNr);
    })
    .on("receipt", function(receipt){
        console.log("setMsgToChain rcpt : " + receipt);
        appendAlert("#colUser"," New name set : " + input, true);

    })
    .on('error', console.error);

}
