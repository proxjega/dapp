// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RealEstate {

  struct Offer{
      address seller;
      address buyer;
      address agent;
      uint32 area;
      uint16 roomNumber;
      string housingAdress;
      uint32 price;
      bool isActive;
      bool hasPrice;
  }

  event offerCreated(Offer offer);
  event priceOffered(uint32 price);

  mapping (uint => Offer) public offers;
  uint offerNumber = 0;
  function createOffer(uint32 housingArea, uint16 housingRoomNumber, string memory housingAdress, address assignedAgent) public {
    offerNumber+=1;
    Offer memory offer;
    offer.seller = msg.sender;
    offer.buyer = address(0);
    offer.agent = assignedAgent;
    offer.area = housingArea;
    offer.roomNumber = housingRoomNumber;
    offer.housingAdress = housingAdress;
    offer.isActive = true;
    offer.hasPrice = false;
    offers[offerNumber] = offer;
    emit offerCreated(offer);
  }

  function proposePrice(uint offerNum, uint32 price) public {
    require(msg.sender == offers[offerNum].agent);
    require(offers[offerNum].isActive == true);
    require(offers[offerNum].hasPrice == false);
    offers[offerNum].price = price;
    emit priceOffered(price);
  }

  function acceptProposedPrice(uint offerNum, bool accept) public {
    require(msg.sender == offers[offerNum].agent);
  }
}
