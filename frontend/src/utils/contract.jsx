import { ethers } from "ethers";
import addresses from "./contract-address.json";

import SupplyChain from "../../../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import Escrow from "../../../artifacts/contracts/Escrow.sol/Escrow.json";

let provider;
let signer;

// 🔐 CONNECT WALLET (MetaMask)
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return null;
    }

    provider = new ethers.BrowserProvider(window.ethereum);

    // Request accounts
    await provider.send("eth_requestAccounts", []);

    // Get signer
    signer = await provider.getSigner();

    // ✅ Get address safely
    const address = await signer.getAddress();

    console.log("✅ Connected:", address);
    return { signer, address };
  } catch (err) {
    console.error("❌ Wallet connection error:", err);
    return null;
  }
};

// 🔁 GET PROVIDER (SAFE)
export const getProvider = async () => {
  if (!provider) {
    if (!window.ethereum) throw new Error("MetaMask not found");
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
};

// 🔁 GET SIGNER (SAFE)
export const getSigner = async () => {
  if (!signer) {
    const res = await connectWallet();
    if (!res) throw new Error("Wallet not connected");
    return res.signer;
  }
  return signer;
};

// 📦 GET SUPPLYCHAIN CONTRACT
export const getSupplyChain = async () => {
  const s = await getSigner();
  return new ethers.Contract(addresses.supplyChain, SupplyChain.abi, s);
};

// 💰 GET ESCROW CONTRACT
export const getEscrow = async () => {
  const s = await getSigner();
  return new ethers.Contract(addresses.escrow, Escrow.abi, s);
};

// 🔗 CONNECT SUPPLYCHAIN ↔ ESCROW (ONE-TIME)
export const linkContracts = async () => {
  try {
    const supplyChain = await getSupplyChain();
    const escrow = await getEscrow();

    // Read current addresses
    let currentEscrow, currentSupply;
    try { currentEscrow = await supplyChain.escrow(); } 
    catch { currentEscrow = ethers.AddressZero; }

    try { currentSupply = await escrow.supplyChain(); } 
    catch { currentSupply = ethers.AddressZero; }

    // Link if not already
    if (
      currentEscrow.toLowerCase() !== addresses.escrow.toLowerCase() ||
      currentSupply.toLowerCase() !== addresses.supplyChain.toLowerCase()
    ) {
      const tx1 = await supplyChain.setEscrow(addresses.escrow);
      await tx1.wait();

      const tx2 = await escrow.setSupplyChain(addresses.supplyChain);
      await tx2.wait();

      console.log("✅ Contracts linked successfully");
    } else {
      console.log("✅ Contracts already linked");
    }
  } catch (err) {
    console.error("❌ Linking contracts failed:", err);
  }
};

// 👤 GET CURRENT ACCOUNT
export const getCurrentAccount = async () => {
  try {
    const s = await getSigner();
    return await s.getAddress();
  } catch {
    return null;
  }
};