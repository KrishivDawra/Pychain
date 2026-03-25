import { Link } from "react-router-dom";
import { useState } from "react";
import { connectWallet } from "../utils/contract";

export default function Navbar() {
  const [account, setAccount] = useState("");

  const handleConnect = async () => {
    try {
      const signer = await connectWallet();

      if (!signer) {
        alert("Wallet not connected. Please approve MetaMask.");
        return;
      }

      const address = await signer.getAddress();
      setAccount(address);

    } catch (err) {
      console.error("Connection Error:", err);
      alert("Wallet connection failed");
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 shadow-md">
      <h1 className="text-xl font-bold text-blue-400">
        SupplyChain DApp
      </h1>

      <div className="flex gap-4 items-center">
        <Link to="/" className="text-blue-400">Home</Link>
        <Link to="/register" className="text-blue-400">Register</Link>
        <Link to="/transfer" className="text-blue-400">Transfer</Link>
        <Link to="/verify" className="text-blue-400">Verify</Link>
        <Link to="/escrow" className="text-blue-400">Escrow</Link>
        <Link to="/dashboard" className="text-blue-400">Dashboard</Link>

        {/* 🔐 Connect Wallet Button */}
        <button
          onClick={handleConnect}
          className="bg-blue-500 px-3 py-1 rounded"
        >
          {account
            ? account.slice(0, 6) + "..." + account.slice(-4)
            : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}