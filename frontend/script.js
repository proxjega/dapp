 const contractAddress = "YOUR_CONTRACT_ADDRESS";
    const abi = [
      "function createOffer(bytes32 hash, address assignedAgent) public",
      "function getOffer(uint id) public view returns (tuple(address seller, address buyer, address agent, bytes32 housingInfoHash, uint price, bool isActive, bool priceConfirmed, bool buyerAccepted))"
    ];

    let provider;
    let signer;
    let contract;

    async function init() {
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new ethers.Contract(contractAddress, abi, signer);
      }
    }
    init();

    async function createOffer() {
      try {
        const hash = document.getElementById("hashInput").value;
        const agent = document.getElementById("agentInput").value;

        const tx = await contract.createOffer(hash, agent);
        document.getElementById("createStatus").innerText = "Transaction sent: " + tx.hash;
        await tx.wait();
        document.getElementById("createStatus").innerText = "Offer created successfully.";
      } catch (err) {
        document.getElementById("createStatus").innerText = "Error: " + err.message;
      }
    }

    async function loadOffer() {
      try {
        const id = document.getElementById("offerIdInput").value;
        const offer = await contract.getOffer(id);
        document.getElementById("offerData").textContent = JSON.stringify(offer, null, 2);
      } catch (err) {
        document.getElementById("offerData").textContent = "Error: " + err.message;
      }
    }