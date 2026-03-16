# Smart Contract and Decentralized Application

This project contains a fully working **Ethereum smart contract with business logic**, written in **Solidity**, connected to a **frontend decentralized application (DApp)**.  
The system was successfully **tested on a local Ethereum testnet using Truffle**, and later **deployed to the Ethereum Sepolia testnet**.

The repository includes the smart contract implementation, a simple web interface to interact with it, and the business workflow for a real estate transaction process.

## Instalation and setup

clone this repository

```bash
git clone https://github.com/proxjega/dapp.git
cd dapp
```

Install dependencies:

```bash
npm install
```

Run the frontend with a static server from the project root:

```bash
npx http-server .
```

Then open one of these pages in your browser:

- http://127.0.0.1:8080/frontend/seller.html
- http://127.0.0.1:8080/frontend/agent.html
- http://127.0.0.1:8080/frontend/buyer.html

## MetaMask and testnet accounts

1. Install the MetaMask browser extension.
2. In MetaMask, switch network to Sepolia.
3. Import or create Sepolia test accounts in MetaMask.
4. Use a Sepolia faucet to get test ETH for those accounts.
5. Reload the opened page. The DApp will request account access and load your MetaMask accounts.

### It is recommended to have at least 3 accounts (one account per role) to test this code. Also the operations with smart contract will require some test funds (can be obtained for free)

## Local Ganache + Truffle (deprecated)

It is still possible to run the project locally using Ganache CLI and Truffle, but this method is considered deprecated for this repository.

Example local flow:

```bash
# terminal 1
ganache-cli

# terminal 2
truffle migrate --network development
```

After migration, keep using a static server to open the frontend pages.

## Business Logic

There are 3 parties involved: **Seller, Real Estate Agent, and Buyer**.

![alt text](/data/contract.png)

- **Seller** – creates a sale offer and accepts or rejects the price proposed by the agent  
- **Agent** – evaluates the property, sends the price to the seller, finds a buyer, and offers the property to them  
- **Buyer** – accepts or rejects the offer and makes the payment  

If the buyer accepts the offer:
- The **Seller receives the payment**
- The **Agent receives a commission for the service**
- The **Buyer receives the property**

If the buyer rejects the offer:
- The buyer is rejected
- The agent must search for a new buyer.

#### The smart contract uses the "Pull over Push" pattern

When the buyer transfers the funds, the smart contract **does not automatically send them to the seller and agent**.  
Instead, the seller and agent must **withdraw their funds themselves** using the `getFunds` method.

## Smart Contract

The smart contract is written in **Solidity**.  
The complete implementation can be found in the **contracts** directory.

## Front End

A simple frontend built using **Bootstrap** and **web3.js**.  
It allows users to interact with all functions of the smart contract.

![alt text](data/image.png)

## Smart Contract Deployment

The smart contract was deployed to the **Ethereum Sepolia test network**.

https://sepolia.etherscan.io/address/0xaD175D6b0f6aeeae63EF8c0bae72Dc8324286208#writeContract

![alt text](data/sepolia.png)
