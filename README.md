🚀 PyChain – Blockchain Supply Chain with Escrow

PyChain is a decentralized supply chain DApp built using Ethereum, Solidity, and React, designed as an extension to Paytm for Business to enable secure, transparent, and trustless transactions between merchants.

❗ Problem

Traditional supply chains face major challenges:

1. Lack of transparency in product movement
2. Trust issues between participants
3. Payment risks (pay-before-delivery or deliver-without-payment)
4. No automated dispute resolution
5. Limited product authenticity verification
   
💡 Solution

PyChain introduces a blockchain + escrow-based system to solve these issues:

🔗 On-chain product tracking → full lifecycle visibility
💰 Escrow payments → funds released only after delivery
👥 Role-based flow → Manufacturer → Distributor → Wholesaler → Retailer
🔐 Trustless transactions → no intermediaries needed
📦 Customer verification → authenticity and ownership tracking
🎯 Business Relevance

Proposed as an extension to Paytm for Business, enabling:

1. Secure B2B transactions
2. Delivery-linked payments
3. Transparent supply chain for merchants
   
🏗️ Tech Stack

1. Blockchain: Solidity
2. Framework: Hardhat
3. Frontend: React + Tailwind
4. Web3: Ethers.js
5. Wallet: MetaMask
6. Network: Sepolia
   
⚙️ How to Run

git clone https://github.com/YOUR_USERNAME/pychain.git
cd pychain
npm install
cd frontend
npm install
npm run dev

Deploy contracts:

npx hardhat run scripts/deploy.js --network sepolia

⚡ Key Features

1. Smart contract-based product lifecycle
2. Escrow-secured payments
3. Automatic contract address sync with frontend
4. Wallet + network validation
5. Role-based permissions

🔥 One-line Summary

A blockchain-based supply chain system with escrow payments, proposed as an extension to Paytm for Business to enable secure and trustless merchant transactions.

👨‍💻 Author

Krishiv Dawra
GitHub: https://github.com/KrishivDawra/Pychain.git
Deployment: https://pychain.vercel.app/
Live Working Demo: https://drive.google.com/file/d/1qvfSR7NZ-TApYbDBvUc6IrdmwXNu9p4c/view?usp=sharing

⭐ Star this repo if you like it!
