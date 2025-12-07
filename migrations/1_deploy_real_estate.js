const RealEstate = artifacts.require("RealEstate");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(RealEstate, { from: accounts[0] });
};