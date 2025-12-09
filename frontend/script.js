const web3 = new Web3("http://127.0.0.1:8545");

let contract;
let activeAccount;
async function init() {
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts);

    // load the compiled contract JSON (assuming you copied it to front-end folder)
    const RealEstateJSON = await fetch('../build/contracts/RealEstate.json').then(res => res.json());
    // get ABI
    const abi = RealEstateJSON.abi;

    // network ID from Ganache
    const networkId = (await web3.eth.net.getId()).toString();



    // create contract instance
    contract = await new web3.eth.Contract(abi, "0x5140F07E91aa7c08240E4FD9F67947c90933d0D0");
}

function getRevertReason(err) {
    // Check if err.cause exists (Ganache / Web3 throws nested error)
    if (err && err.cause && typeof err.cause.message === "string") {
        const match = err.cause.message.match(/revert (.*)/);
        if (match && match[1]) return match[1];
    }

    // Fallback: try err.message
    if (err && typeof err.message === "string") {
        const match = err.message.match(/revert (.*)/);
        if (match && match[1]) return match[1];
    }

    return "Transaction failed";
}


// ensure this runs after DOM is loaded
window.addEventListener("DOMContentLoaded", loadAccounts);

async function loadAccounts() {
  if (!window.ethereum) return;
  const accounts = await web3.eth.getAccounts();

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

async function createOffer() {
    const statusEl = document.getElementById("createStatus");
    const hashInput = document.getElementById("hashInput").value;
    const agentInput = document.getElementById("agentInput").value;

    if (!hashInput || !agentInput) {
        statusEl.textContent = "Please enter both a hash and agent address.";
        return;
    }

    try {
        // Convert the hash to bytes32 if it’s a string
        // If user already inputs a valid 0x-prefixed bytes32, skip this
        let bytes32Hash;
        if (hashInput.startsWith("0x") && hashInput.length === 66) {
            bytes32Hash = hashInput;
        } else {
            bytes32Hash = web3.utils.keccak256(hashInput); // hash arbitrary string to bytes32
        }

        // Use the currently selected account as msg.sender
        const sender = activeAccount;
        console.log(contract)
        await contract.methods.createOffer(bytes32Hash, agentInput).send({ from: sender, gas: 200000});
        let id = await contract.methods.getLastOfferId().call({from: sender});
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
    }
    try {
        // Use the currently selected account as msg.sender
        const sender = activeAccount;
        console.log(contract)
        let data = await contract.methods.getOffer(Id).call({ from: sender});
        let id = await contract.methods.getLastOfferId().call({from: sender});
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
