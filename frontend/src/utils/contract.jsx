import { ethers } from "ethers";
import addresses from "./contract-address.json";

import SupplyChain from "../../../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import Escrow from "../../../artifacts/contracts/Escrow.sol/Escrow.json";

let provider = null;
let signer = null;

// 🔄 RESET CACHED WALLET OBJECTS
const resetConnection = () => {
  provider = null;
  signer = null;
};

// 👂 HANDLE METAMASK CHANGES
if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on("accountsChanged", () => {
    console.log("🔁 MetaMask account changed");
    resetConnection();
  });

  window.ethereum.on("chainChanged", () => {
    console.log("🔁 MetaMask chain changed");
    resetConnection();
    window.location.reload();
  });
}

// 🔐 CONNECT WALLET
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return null;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    console.log("✅ Connected wallet:", address);
    console.log("🌐 Chain ID:", network.chainId.toString());

    return {
      provider,
      signer,
      address,
      chainId: network.chainId.toString(),
    };
  } catch (err) {
    console.error("❌ Wallet connection error:", err);
    return null;
  }
};

// 🔁 GET PROVIDER
export const getProvider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  if (!provider) {
    provider = new ethers.BrowserProvider(window.ethereum);
  }

  return provider;
};

// 🔁 GET SIGNER
export const getSigner = async () => {
  const p = await getProvider();

  try {
    signer = await p.getSigner();
    return signer;
  } catch (err) {
    const res = await connectWallet();
    if (!res) throw new Error("Wallet not connected");
    return res.signer;
  }
};

// 👤 GET CURRENT ACCOUNT
export const getCurrentAccount = async () => {
  try {
    const s = await getSigner();
    return await s.getAddress();
  } catch (err) {
    console.error("❌ Could not get current account:", err);
    return null;
  }
};

// 🌐 GET CURRENT CHAIN ID
export const getCurrentChainId = async () => {
  try {
    const p = await getProvider();
    const network = await p.getNetwork();
    return network.chainId.toString();
  } catch (err) {
    console.error("❌ Could not get chain ID:", err);
    return null;
  }
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

// 🧪 DEBUG WALLET + NETWORK
export const debugWallet = async () => {
  try {
    const p = await getProvider();
    const s = await getSigner();
    const address = await s.getAddress();
    const network = await p.getNetwork();

    const info = {
      address,
      chainId: network.chainId.toString(),
    };

    console.log("🧪 Wallet Debug:", info);
    return info;
  } catch (err) {
    console.error("❌ Wallet debug failed:", err);
    return null;
  }
};

// 🧪 DEBUG CONTRACT LINKING
export const debugContracts = async () => {
  try {
    const supplyChain = await getSupplyChain();
    const escrow = await getEscrow();

    let currentEscrow = ethers.ZeroAddress;
    let currentSupply = ethers.ZeroAddress;

    try {
      currentEscrow = await supplyChain.escrowAddress();
    } catch (err) {
      console.warn("⚠️ Could not read SupplyChain escrowAddress()", err);
    }

    try {
      currentSupply = await escrow.supplyChain();
    } catch (err) {
      console.warn("⚠️ Could not read Escrow supplyChain()", err);
    }

    const info = {
      supplyChainAddress: addresses.supplyChain,
      escrowAddress: addresses.escrow,
      linkedEscrowInSupplyChain: currentEscrow,
      linkedSupplyChainInEscrow: currentSupply,
      isLinked:
        currentEscrow.toLowerCase() === addresses.escrow.toLowerCase() &&
        currentSupply.toLowerCase() === addresses.supplyChain.toLowerCase(),
    };

    console.log("🧪 Contract Debug:", info);
    return info;
  } catch (err) {
    console.error("❌ Contract debug failed:", err);
    return null;
  }
};

// 🔗 ONE-TIME ADMIN LINKING
export const linkContracts = async () => {
  try {
    const supplyChain = await getSupplyChain();
    const escrow = await getEscrow();

    let currentEscrow = ethers.ZeroAddress;
    let currentSupply = ethers.ZeroAddress;

    try {
      currentEscrow = await supplyChain.escrowAddress();
    } catch {
      currentEscrow = ethers.ZeroAddress;
    }

    try {
      currentSupply = await escrow.supplyChain();
    } catch {
      currentSupply = ethers.ZeroAddress;
    }

    const needsSupplyChainUpdate =
      currentEscrow.toLowerCase() !== addresses.escrow.toLowerCase();

    const needsEscrowUpdate =
      currentSupply.toLowerCase() !== addresses.supplyChain.toLowerCase();

    if (!needsSupplyChainUpdate && !needsEscrowUpdate) {
      console.log("✅ Contracts already linked");
      return true;
    }

    if (needsSupplyChainUpdate) {
      console.log("🔗 Setting Escrow in SupplyChain...");
      const tx1 = await supplyChain.setEscrow(addresses.escrow);
      await tx1.wait();
      console.log("✅ SupplyChain updated with Escrow address");
    }

    if (needsEscrowUpdate) {
      console.log("🔗 Setting SupplyChain in Escrow...");
      const tx2 = await escrow.setSupplyChain(addresses.supplyChain);
      await tx2.wait();
      console.log("✅ Escrow updated with SupplyChain address");
    }

    console.log("✅ Contracts linked successfully");
    return true;
  } catch (err) {
    console.error("❌ Linking contracts failed:", err);
    return false;
  }
};