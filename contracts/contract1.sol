// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RealEstate {

  // Main offer structure
  struct Offer{
      address seller;
      address buyer;
      address agent;
      bytes32 housingInfoHash;
      uint price;
      bool isActive;
      bool priceConfirmed;
      bool buyerAccepted;
  }

  // events
  event offerCreated(uint offerNum, address assignedAgent);
  event priceOffered(uint offerNum, uint price);
  event priceAccepted(uint offerNum, uint price);
  event priceDeclined(uint offerNum, uint price);
  event buyerFound(uint offerNum, address buyer);
  event buyerAccepted(uint offerNum, address buyer, uint price);
  event buyerDeclined(uint offerNum, address buyer);
  event paymentSent(uint offerNum);

  // all offers
  mapping (uint => Offer) public offers;

  //pending payouts
  mapping (address => uint) public payouts;

  //starting offerID
  uint offerID = 0;

  // Create offer (seller should call this) hash - hash of housing info json, assignedAgent - agent that seller choses (another address)
  function createOffer(bytes32 hash, address assignedAgent) public {
    require(assignedAgent != address(0));
    // incerement offerID
    offerID+=1;
    // create Offer
    Offer memory offer;
    offer.seller = msg.sender;
    offer.buyer = address(0);
    offer.agent = assignedAgent;
    offer.housingInfoHash = hash;
    offer.price = 0;
    offer.isActive = true;
    offer.priceConfirmed = false;
    offer.buyerAccepted = false;
    // add to mapping
    offers[offerID] = offer;
    emit offerCreated(offerID, assignedAgent);
  }

  // get offer info
  function getOffer(uint id) public view returns (Offer memory) {
    require(id > 0 && id <= offerID);
    return offers[id];
}

  // propose price function. Called by agent.
  function proposePrice(uint offerNum, uint price) public {
    require(offerNum > 0 && offerNum <= offerID);
    require(offers[offerNum].isActive == true); //checks if the offer is active
    require(offers[offerNum].priceConfirmed == false); // checks if the price confirmed
    require(msg.sender == offers[offerNum].agent); //only agent call propose price
    require(offers[offerNum].price == 0); // so agent wont be able to propose price again
    require(price > 0);
    offers[offerNum].price = price;
    emit priceOffered(offerNum, price);
  }

  // Seller should call this and agree or disagree on the price
  function acceptProposedPrice(uint offerNum, bool accept) public {
    require(offerNum > 0 && offerNum <= offerID);
    require(offers[offerNum].isActive == true);
    require(offers[offerNum].priceConfirmed == false);

    require(msg.sender == offers[offerNum].seller); //only seller can call this
    require(offers[offerNum].price != 0);
    if (accept) {
      offers[offerNum].priceConfirmed = true; // if accepts - update offer state, emit event
      emit priceAccepted(offerNum, offers[offerNum].price);
    }
    else{
      offers[offerNum].priceConfirmed = false;
      offers[offerNum].price = 0;
      emit priceDeclined(offerNum, offers[offerNum].price);
    }
  }

  // agent should find buyer (off-chain) and add him to offer (on-chain)
  function findBuyer(uint offerNum, address foundBuyer) public{
    require(offerNum > 0 && offerNum <= offerID);
    require(foundBuyer != address(0));
    require(offers[offerNum].isActive == true);
    require(offers[offerNum].priceConfirmed == true);

    require(msg.sender == offers[offerNum].agent);
    require(offers[offerNum].buyerAccepted != true); //can be called again even until found buyer accepts offer
    offers[offerNum].buyer = foundBuyer;
    emit buyerFound(offerNum, foundBuyer);
  }

  function acceptOffer(uint offerNum, bool accept) public {
    require(offerNum > 0 && offerNum <= offerID);
    require(offers[offerNum].isActive == true);

    require(offers[offerNum].buyer != address(0));
    require(msg.sender == offers[offerNum].buyer);
    require(offers[offerNum].priceConfirmed == true);
    if (accept == true) {
      offers[offerNum].buyerAccepted = true;
      emit buyerAccepted(offerNum, msg.sender, offers[offerNum].price);
    }
    else{
      offers[offerNum].buyerAccepted = false;
      offers[offerNum].buyer = address(0);
      emit buyerDeclined(offerNum, msg.sender);
    } 
  }

  function Pay(uint offerNum) public payable {
    // check offer state
    require(offerNum > 0 && offerNum <= offerID);
    require(offers[offerNum].isActive == true);
    require(offers[offerNum].priceConfirmed == true);
    require(offers[offerNum].buyerAccepted == true);

    //check sender address and value
    require(msg.sender == offers[offerNum].buyer);
    require(msg.value == offers[offerNum].price);

    // transfer funds into payout mapping (good practice: pull over push)
    payouts[offers[offerNum].seller] += msg.value * 95 / 100;
    payouts[offers[offerNum].agent] += msg.value * 5 / 100;
    
    // offer completed, disable it
    offers[offerNum].isActive = false;
    emit paymentSent(offerNum);
  }

  // everyone can withdraw their funds (good practice: pull over push)
  function getFunds() public {
    uint fund = payouts[msg.sender];
    require(fund!=0);
    payouts[msg.sender] = 0;
    (bool sent, ) = msg.sender.call{value: fund}("");
    require(sent);
  }
}
