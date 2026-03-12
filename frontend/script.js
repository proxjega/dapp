let web3;         // sending
let httpWeb3;     // calling
let wsWeb3;       // events

let contract;     // send
let contractRead; // call
let contractWS;   // events
let activeAccount;

async function init() {
    // 1. MetaMask provider — send only
    web3 = new Web3(window.ethereum);

    // 2. HTTP provider — call
    httpWeb3 = new Web3("https://sepolia.infura.io/v3/fafad0ce2b5d464290c02a82f7781499");

    // 3. WebSocket provider — events only
    wsWeb3 = new Web3("wss://sepolia.infura.io/ws/v3/fafad0ce2b5d464290c02a82f7781499");

    const RealEstateJSON = await fetch("../build/contracts/RealEstate.json").then(r => r.json());
    const abi = RealEstateJSON.abi;
    const address = "0xaD175D6b0f6aeeae63EF8c0bae72Dc8324286208";

    // Contract for sending transactions via MetaMask
    contract = new web3.eth.Contract(abi, address);

    // Contract for read-only calls
    contractRead = new httpWeb3.eth.Contract(abi, address);

    // Contract for event subscriptions
    contractWS = new wsWeb3.eth.Contract(abi, address);

    contractWS.events.offerCreated({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, assignedAgent } = event.returnValues;
            const propStatus = document.getElementById("propStatus");
            propStatus.textContent = `New offer created! ID: ${offerNum}, Agent: ${assignedAgent}`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.priceProposed({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, price } = event.returnValues;
            const propStatus = document.getElementById("acceptStatus");
            propStatus.textContent = `Price proposed in offer ${offerNum}: ${price}`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.priceAccepted({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, price } = event.returnValues;
            const propStatus = document.getElementById("propStatus");
            propStatus.textContent = `Offer: ${offerNum}: Your price (${price}) was accepted!`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.priceDeclined({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, price } = event.returnValues;
            const propStatus = document.getElementById("propStatus");
            propStatus.textContent = `Offer: ${offerNum}: Your price (${price}) was declined!`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.buyerFound({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, buyer } = event.returnValues;
            const propStatus = document.getElementById("acceptOfferStatus");
            propStatus.textContent = `Buyer ${buyer} was assigned for offer ${offerNum}`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.buyerAccepted({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, buyer, price } = event.returnValues;
            const propStatus = document.getElementById("withdrawStatus");
            propStatus.textContent = `Buyer ${buyer} accepted price ${price} in offer ${offerNum}`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.buyerDeclined({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, buyer, price } = event.returnValues;
            const propStatus = document.getElementById("withdrawStatus");
            propStatus.textContent = `Buyer ${buyer} declined offer ${offerNum}`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })

    contractWS.events.paymentSent({ fromBlock: 'latest' })
        .on('data', event => {
            const { offerNum, buyer, price } = event.returnValues;
            const propStatus = document.getElementById("withdrawStatus");
            propStatus.textContent = `Payment for ${offerNum} is sent by buyer`;
            console.log("Offer created event:", offerNum, assignedAgent);
        })
}


// ensure this runs after DOM is loaded
window.addEventListener("DOMContentLoaded", loadAccounts);

async function loadAccounts() {
    let accounts;
    if (window.ethereum) {
        try {
            // Request access to MetaMask accounts
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('MetaMask accounts:', accounts);
            
            // Use the first account as default
            activeAccount = accounts[0];
        } catch (err) {
            console.error('User denied account access or error occurred:', err);
        }
    } else {
        console.error('MetaMask not found');
    }

  const list = document.getElementById("accountList");
  const toggle = document.getElementById("accountDropdown");
  list.innerHTML = "";

  accounts.forEach(acc => {
    const li = document.createElement("li");
    li.innerHTML = `<a class="dropdown-item account-item" href="#" data-acc="${acc}">${acc}</a>`;
    list.appendChild(li);
  });

  // set default
  activeAccount = accounts[0];
  toggle.textContent = shorten(activeAccount);

  // delegated handler for selecting account
  list.addEventListener("click", function (ev) {
    const a = ev.target.closest("a.account-item");
    if (!a) return;
    ev.preventDefault();
    activeAccount = a.dataset.acc;
    toggle.textContent = shorten(activeAccount);

    // copy to clipboard
    navigator.clipboard.writeText(activeAccount)
      .then(() => console.log("Copied account:", activeAccount))
      .catch(err => console.error("Failed to copy:", err));

    // close dropdown
    const inst = bootstrap.Dropdown.getInstance(toggle) || new bootstrap.Dropdown(toggle);
    inst.hide();
  });

    init();
}

// helper
function shorten(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// helper
function getRevertReason(err) {
    // Check if err.cause exists (Ganache / Web3 throws nested error)
    if (err && err.cause && typeof err.cause.message === "string") {
        const match = err.cause.message.match(/reverted: (.*)/);
        if (match && match[1]) return match[1];
    }

    // Fallback: try err.message
    if (err && typeof err.message === "string") {
        const match = err.message.match(/reverted: (.*)/);
        if (match && match[1]) return match[1];
    }

    return "Transaction failed";
}


// seller functions
async function createOffer() {
    const statusEl = document.getElementById("createStatus");
    const hashInput = document.getElementById("hashInput").value;
    const agentInput = document.getElementById("agentInput").value;
    const sender = activeAccount;

    if (!hashInput || !agentInput) {
        statusEl.textContent = "Please enter both a hash and agent address.";
        return;
    }

    try {
        let bytes32Hash;
        if (hashInput.startsWith("0x") && hashInput.length === 66) {
            bytes32Hash = hashInput;
        } else {
            bytes32Hash = web3.utils.keccak256(hashInput); // hash arbitrary string to bytes32
        }

        // Use the currently selected account as msg.sender
        console.log(contract)
        await contractRead.methods.createOffer(bytes32Hash, agentInput).call({ from: sender, gas: 200000});
        await sleep(1000)
        await contract.methods.createOffer(bytes32Hash, agentInput).send({ from: sender, gas: 200000});
        await sleep(1000)
        let id = await contractRead.methods.getLastOfferId().call({from: sender});
        statusEl.textContent = `Offer created successfully! Your offerID: ${id}`;
        document.getElementById("hashInput").value = "";
        document.getElementById("agentInput").value = "";
    } catch (err) {
        console.error(err);
        statusEl.textContent = "Error creating offer: " + err.message;
    }
}

async function loadOffer() {
    const Id = document.getElementById("seeOfferId").value;
    const offerData = document.getElementById("offerData");
    if (!Id) {
        offerData.textContent = "Enter a valid offer ID";
        return;
    }
    try {
        const sender = activeAccount;
        console.log(contract)
        let data = await contractRead.methods.getOffer(Id).call();
         // Format output
        let output = `Offer ${Id} info:\n`;
        for (const key in data) {
            // skip numeric keys (they are duplicates of array-like structure)
            if (!isNaN(Number(key))) continue;
            output += `${key}: ${data[key]}\n`;
        }
        offerData.textContent = output;
        document.getElementById("seeOfferId").value = "";
    } catch (err) {
        console.error(err);
         // Extract the revert reason if available
        let message = getRevertReason(err)
        console.log(message)
        offerData.textContent = message;
    }
}

async function acceptProposedPrice(accept) {
    const Id = document.getElementById("acceptOfferId").value;
    const acceptResultEl = document.getElementById("acceptStatus");
     if (!Id) {
        acceptResultEl.textContent = "Enter a valid offer ID";
        return;
    }
    const sender = activeAccount;

    try {
        await contractRead.methods.acceptProposedPrice(Id, accept).call({ from: sender});
        await contract.methods.acceptProposedPrice(Id, accept).send({ from: sender});
        if (accept) {
            acceptResultEl.textContent = "Price accepted succesfully!";
        }
        else {
            acceptResultEl.textContent = "Price declined succesfully!";
        }
        document.getElementById("acceptOfferId").value = "";
    }
    catch (err) {
        console.error(err);
        let message = getRevertReason(err)
        acceptResultEl.textContent = message;
    }

}

// agent functions
async function proposePrice() {
    const Id = document.getElementById("propOfferId").value;
    const price = document.getElementById("propPrice").value;
    const resultEl = document.getElementById("propStatus");
    const sender = activeAccount;
    if (!Id || !price) {
        resultEl.textContent = "Enter valid ID and price";
        return;
    }
    try {
        await contractRead.methods.proposePrice(Id, price).call({ from: sender});
        await contract.methods.proposePrice(Id, price).send({ from: sender});
        resultEl.textContent = "Price proposed!";
        document.getElementById("propOfferId").value="";
        document.getElementById("propPrice").value="";
    }
    catch (err) {
        let message = getRevertReason(err)
        console.log(message)
        resultEl.textContent = message;
    }
}
async function withdrawFunds() {
    const statusEl = document.getElementById("withdrawStatus")
    const sender = activeAccount;
    try {
        const amount = await contractRead.methods.payouts(sender).call({ from: sender});
        await contractRead.methods.getFunds().call({ from: sender});
        await contract.methods.getFunds().send({ from: sender});
        statusEl.textContent = `Withdrew ${amount} wei successfully`;
    }
    catch (err) {
        console.log(err)
        let message = getRevertReason(err)
        console.log(message)
        statusEl.textContent = message;
    }
}

async function findBuyer() {
    const Id = document.getElementById("findOfferId").value;
    const buyerAdress = document.getElementById("buyerAddress").value;
    const resultEl = document.getElementById("findStatus")
    const sender = activeAccount;
    if (!Id || !buyerAdress) {
        resultEl.textContent = "Please enter both ID and buyer address!"
        return;
    }
    try {
        await contractRead.methods.findBuyer(Id, buyerAdress).call({ from: sender});
        await contract.methods.findBuyer(Id, buyerAdress).send({ from: sender});
        resultEl.textContent = "Buyer notified"
        document.getElementById("findOfferId").value="";
        document.getElementById("buyerAddress").value="";
    }
    catch (err) {
        console.log(err)
        let message = "Error assigning buyer:<br>Client Error:" + err.message + "<br> Blockchain error:"+ getRevertReason(err)
        console.log(message)
        resultEl.innerHTML = message;
    }
}

// buyer functions
async function acceptOffer(accept) {
    const Id = document.getElementById("acceptOfferId").value;
    const acceptResultEl = document.getElementById("acceptOfferStatus");
    if (!Id) {
        acceptResultEl.textContent = "Enter a valid offer ID";
        return;
    }
    const sender = activeAccount;

    try {
        await contractRead.methods.acceptOffer(Id, accept).call({ from: sender});
        await contract.methods.acceptOffer(Id, accept).send({ from: sender});
        if (accept) {
            acceptResultEl.textContent = "Offer accepted succesfully!";
        }
        else {
            acceptResultEl.textContent = "Offer declined succesfully!";
        }
        document.getElementById("acceptOfferId").value="";
    }
    catch (err) {
        console.error(err);
        let message = getRevertReason(err)
        acceptResultEl.textContent = message;
    }
}

async function  Pay(){
    const Id = document.getElementById("payOfferId").value;
    const resultEl = document.getElementById("payStatus");
    const sender = activeAccount;
    const amount = document.getElementById("payAmount").value;
    if (!Id || !amount) {
        resultEl.textContent = "Please enter both ID and amount";
        return;
    }
    try {
        await contractRead.methods.Pay(Id).call({ from: sender, value: amount});
        await contract.methods.Pay(Id).send({ from: sender, value: amount});
        resultEl.textContent = "Payment succesfull!";
    }
    catch (err) {
        console.error(err);
        let message = getRevertReason(err)
        resultEl.textContent = message;
    }

}


