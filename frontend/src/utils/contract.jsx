import { ethers } from "ethers";
import addresses from "./contract-address.json";

import SupplyChain from "../../../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import Escrow from "../../../artifacts/contracts/Escrow.sol/Escrow.json";

let provider;
let signer;

// 🔐 Connect Wallet (MetaMask)
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return null;
    }

    provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access
    const accounts = await provider.send("eth_requestAccounts", []);

    if (!accounts || accounts.length === 0) {
      throw new Error("No account found");
    }

    signer = await provider.getSigner();

    return signer;
  } catch (err) {
    console.error("Wallet connection error:", err);
    return null;
  }
};

// 📦 Get SupplyChain Contract
export const getSupplyChain = async () => {
  if (!signer) {
    const s = await connectWallet();
    if (!s) throw new Error("Wallet not connected");
  }

  return new ethers.Contract(
    addresses.supplyChain,
    SupplyChain.abi,
    signer
  );
};

// 💰 Get Escrow Contract
export const getEscrow = async () => {
  if (!signer) {
    const s = await connectWallet();
    if (!s) throw new Error("Wallet not connected");
  }

  return new ethers.Contract(
    addresses.escrow,
    Escrow.abi,
    signer
  );
};