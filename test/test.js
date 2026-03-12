const { expect } =  require('chai')

const RealEstate = artifacts.require("RealEstate");

contract("RealEstate", (accounts) => {
  const seller = accounts[0];
  const agent = accounts[1];
  const buyer = accounts[2];
  const random = accounts[3];

  let instance;

  beforeEach(async () => {
    instance = await RealEstate.new();
  });

  /* -------------------------------------------------------------------------- */
  /*                                POSITIVE TESTS                              */
  /* -------------------------------------------------------------------------- */

  it("1. Should create an offer", async () => {
    const hash = web3.utils.keccak256("test");
    const tx = await instance.createOffer(hash, agent, { from: seller });

    const offer = await instance.getOffer(1);
    expect(offer.seller).to.equal(seller);
    expect(offer.agent).to.equal(agent);
    expect(offer.housingInfoHash).to.equal(hash);
    expect(offer.isActive).to.equal(true);

    expect(tx.logs[0].event).to.equal("offerCreated");
  });

  it("2. Agent should propose a price", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });

    const tx = await instance.proposePrice(1, 1000, { from: agent });
    const offer = await instance.getOffer(1);

    expect((Number)(offer.price)).to.equal(1000);
    expect(tx.logs[0].event).to.equal("priceProposed");
  });

  it("3. Seller should accept proposed price", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });
    await instance.proposePrice(1, 1000, { from: agent });

    const tx = await instance.acceptProposedPrice(1, true, { from: seller });
    const offer = await instance.getOffer(1);

    expect(offer.priceConfirmed).to.equal(true);
    expect(tx.logs[0].event).to.equal("priceAccepted");
  });

 it("4. Full buyer flow: find buyer + buyer accepts + payment", async () => {
  const hash = web3.utils.keccak256("test");
  await instance.createOffer(hash, agent, { from: seller });
  await instance.proposePrice(1, web3.utils.toWei('1', 'ether'), { from: agent });
  await instance.acceptProposedPrice(1, true, { from: seller });

  await instance.findBuyer(1, buyer, { from: agent });
  await instance.acceptOffer(1, true, { from: buyer });

  const sellerBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(seller));

  await instance.Pay(1, { from: buyer, value: web3.utils.toWei('1', 'ether') });

  const payout = await instance.payouts(seller);
  expect(payout.toString()).to.equal(web3.utils.toWei('0.95', 'ether')); // 95%

  // Withdraw funds
  await instance.getFunds({ from: seller });

  const sellerBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(seller));
  expect(sellerBalanceAfter.gt(sellerBalanceBefore)).to.equal(true);
});


  /* -------------------------------------------------------------------------- */
  /*                                NEGATIVE TESTS                              */
  /* -------------------------------------------------------------------------- */

  it("5. Should NOT allow creating offer with zero agent address", async () => {
    const hash = web3.utils.keccak256("bad");
    try {
      await instance.createOffer(hash, "0x0000000000000000000000000000000000000000");
      expect.fail("Expected revert");
    } catch (err) {
      expect(err.reason).to.equal(undefined); // require without message
    }
  });

  it("6. Should NOT allow non-agent to propose price", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });

    try {
      await instance.proposePrice(1, 1000, { from: random });
      expect.fail("Expected revert");
    } catch (err) {
      expect(err.reason).to.equal("Only agent can call this!");
    }
  });

  it("7. Should NOT allow seller to accept price before agent proposes", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });

    try {
      await instance.acceptProposedPrice(1, true, { from: seller });
      expect.fail("Expected revert");
    } catch (err) {
      expect(err.reason).to.equal("There is no proposed price!");
    }
  });

  it("8. Should NOT allow anyone but buyer to accept offer", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });
    await instance.proposePrice(1, 1000, { from: agent });
    await instance.acceptProposedPrice(1, true, { from: seller });
    await instance.findBuyer(1, buyer, { from: agent });

    try {
      await instance.acceptOffer(1, true, { from: random });
      expect.fail("Expected revert");
    } catch (err) {
      expect(err.reason).to.equal("Only buyer can call this!");
    }
  });

  it("9. Should NOT allow payment with incorrect value", async () => {
    const hash = web3.utils.keccak256("test");
    await instance.createOffer(hash, agent, { from: seller });
    await instance.proposePrice(1, 1000, { from: agent });
    await instance.acceptProposedPrice(1, true, { from: seller });
    await instance.findBuyer(1, buyer, { from: agent });
    await instance.acceptOffer(1, true, { from: buyer });

    try {
      await instance.Pay(1, { from: buyer, value: 999 });
      expect.fail("Expected revert");
    } catch (err) {
      expect(err.reason).to.equal("Value of this transaction does not match the price");
    }
  });
});
