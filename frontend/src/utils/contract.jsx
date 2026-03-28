import { ethers } from "ethers";
import addresses from "./contract-address.json";

import SupplyChain from "../../../artifacts/contracts/SupplyChain.sol/SupplyChain.json";
import Escrow from "../../../artifacts/contracts/Escrow.sol/Escrow.json";

let provider = null;
let signer = null;
let connectPromise = null;

const SEPOLIA_CHAIN_ID = "11155111";
const SEPOLIA_CHAIN_HEX = "0xaa36a7";

// 🔄 RESET CACHED WALLET OBJECTS
const resetConnection = () => {
  provider = null;
  signer = null;
  connectPromise = null;
};

// ✅ BASIC ADDRESS VALIDATION
const validateConfiguredAddresses = () => {
  if (!addresses?.supplyChain || !ethers.isAddress(addresses.supplyChain)) {
    throw new Error("Invalid SupplyChain address in contract-address.json");
  }

  if (!addresses?.escrow || !ethers.isAddress(addresses.escrow)) {
    throw new Error("Invalid Escrow address in contract-address.json");
  }
};

// 👂 HANDLE METAMASK CHANGES
if (
  typeof window !== "undefined" &&
  window.ethereum &&
  !window.__walletListenersAttached
) {
  window.__walletListenersAttached = true;

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

// 🌐 GET PROVIDER
export const getProvider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  if (!provider) {
    provider = new ethers.BrowserProvider(window.ethereum);
  }

  return provider;
};

// 🌐 SWITCH TO SEPOLIA
export const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
    return true;
  } catch (err) {
    console.error("❌ Failed to switch to Sepolia:", err);

    if (err?.code === 4902) {
      throw new Error("Sepolia network is not added in MetaMask");
    }

    throw new Error("Please switch MetaMask to Sepolia");
  }
};

// 🌐 ENSURE CORRECT NETWORK
export const ensureSepoliaNetwork = async () => {
  const p = await getProvider();
  const network = await p.getNetwork();

  if (network.chainId.toString() === SEPOLIA_CHAIN_ID) {
    return true;
  }

  await switchToSepolia();

  const refreshedProvider = await getProvider();
  const refreshedNetwork = await refreshedProvider.getNetwork();

  if (refreshedNetwork.chainId.toString() !== SEPOLIA_CHAIN_ID) {
    throw new Error("Wrong network. Please connect to Sepolia.");
  }

  return true;
};

// 🔐 CONNECT WALLET
export const connectWallet = async () => {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      validateConfiguredAddresses();

      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      provider = await getProvider();
      await ensureSepoliaNetwork();

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
      throw err;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
};

// 🔁 GET SIGNER
export const getSigner = async () => {
  validateConfiguredAddresses();

  const p = await getProvider();

  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });

  if (!accounts || accounts.length === 0) {
    const res = await connectWallet();
    if (!res) {
      throw new Error("Wallet not connected");
    }
    return res.signer;
  }

  await ensureSepoliaNetwork();

  signer = await p.getSigner();
  return signer;
};

// 👤 GET CURRENT ACCOUNT
export const getCurrentAccount = async () => {
  try {
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    return accounts?.[0] || null;
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
export const getSupplyChain = async (withSigner = true) => {
  validateConfiguredAddresses();

  if (withSigner) {
    const s = await getSigner();
    return new ethers.Contract(addresses.supplyChain, SupplyChain.abi, s);
  }

  const p = await getProvider();
  return new ethers.Contract(addresses.supplyChain, SupplyChain.abi, p);
};

// 💰 GET ESCROW CONTRACT
export const getEscrow = async (withSigner = true) => {
  validateConfiguredAddresses();

  if (withSigner) {
    const s = await getSigner();
    return new ethers.Contract(addresses.escrow, Escrow.abi, s);
  }

  const p = await getProvider();
  return new ethers.Contract(addresses.escrow, Escrow.abi, p);
};

// 🧪 DEBUG WALLET + NETWORK
export const debugWallet = async () => {
  try {
    const p = await getProvider();
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const network = await p.getNetwork();

    const info = {
      address: accounts?.[0] || null,
      chainId: network.chainId.toString(),
      expectedChainId: SEPOLIA_CHAIN_ID,
      isCorrectNetwork: network.chainId.toString() === SEPOLIA_CHAIN_ID,
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
    validateConfiguredAddresses();

    const supplyChain = await getSupplyChain(false);
    const escrow = await getEscrow(false);

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
      configuredSupplyChainAddress: addresses.supplyChain,
      configuredEscrowAddress: addresses.escrow,
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

// 🔗 OPTIONAL ADMIN LINKING
export const linkContracts = async () => {
  try {
    validateConfiguredAddresses();

    const supplyChain = await getSupplyChain(true);
    const escrow = await getEscrow(true);

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

// 📋 GET ALL PRODUCTS
export const getAllProducts = async () => {
  try {
    const contract = await getSupplyChain(false);
    const total = Number(await contract.productCount());

    const products = [];

    for (let i = 1; i <= total; i++) {
      try {
        const product = await contract.getProductDetails(i);

        products.push({
          id: Number(product[0]),
          name: product[1],
          metadata: product[2],
          currentOwner: product[3],
          shipped: product[4],
          delivered: product[5],
        });
      } catch (err) {
        console.warn(`⚠️ Could not fetch product ${i}`, err);
      }
    }

    return products;
  } catch (err) {
    console.error("❌ Failed to fetch all products:", err);
    return [];
  }
};

// 👤 GET PRODUCTS BY OWNER
export const getProductsByOwner = async (ownerAddress) => {
  try {
    if (!ownerAddress || !ethers.isAddress(ownerAddress)) {
      throw new Error("Invalid owner address");
    }

    const products = await getAllProducts();

    return products.filter(
      (product) =>
        product.currentOwner.toLowerCase() === ownerAddress.toLowerCase()
    );
  } catch (err) {
    console.error("❌ Failed to fetch products by owner:", err);
    return [];
  }
};

// 👜 GET MY PRODUCTS
export const getMyProducts = async () => {
  try {
    const account = await getCurrentAccount();

    if (!account) {
      return [];
    }

    return await getProductsByOwner(account);
  } catch (err) {
    console.error("❌ Failed to fetch my products:", err);
    return [];
  }
};