// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RealEstate {

  struct Offer{
      address seller;
      address buyer;
      address agent;
      bytes32 housingInfoHash;
      uint32 price;
      bool isActive;
      bool hasPrice;
  }

  event offerCreated(uint offerNum, address assignedAgent);
  event priceOffered(uint offerNum, uint32 price);
  event priceAccepted(uint offerNum, uint32 price);
  event priceDeclined(uint offerNum, uint32 price);
  event buyerFound(uint offerNum, address buyer);

  mapping (uint => Offer) public offers;
  uint offerNumber = 0;
  function createOffer(bytes32 hash, address assignedAgent) public {
    offerNumber+=1;
    Offer memory offer;
    offer.seller = msg.sender;
    offer.buyer = address(0);
    offer.agent = assignedAgent;
    offer.housingInfoHash = hash;
    offer.price = 0;
    offer.isActive = true;
    offer.hasPrice = false;
    offers[offerNumber] = offer;
    emit offerCreated(offerNumber, assignedAgent);
  }

  function proposePrice(uint offerNum, uint32 price) public {
    require(msg.sender == offers[offerNum].agent);
    require(offers[offerNum].isActive == true);
    require(offers[offerNum].hasPrice == false);
    offers[offerNum].price = price;
    emit priceOffered(offerNum, price);
  }

  function acceptProposedPrice(uint offerNum, bool accept) public {
    require(msg.sender == offers[offerNum].seller);
    require(offers[offerNum].hasPrice == false);
    require(offers[offerNum].price != 0);
    if (accept) {
      offers[offerNum].hasPrice = true;
      emit priceAccepted(offerNum, offers[offerNum].price);
    }
    else{
      emit priceDeclined(offerNum, offers[offerNum].price);
    }
  }

  function findBuyer(uint offerNum, address foundBuyer) public{
    require(msg.sender == offers[offerNum].agent);
    require(offers[offerNum].hasPrice == true);
    offers[offerNum].buyer = foundBuyer;
  }
}
