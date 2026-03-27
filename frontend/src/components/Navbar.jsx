import { Link } from "react-router-dom";
import { useState } from "react";
import { connectWallet } from "../utils/contract";

export default function Navbar() {
  const [account, setAccount] = useState("");

  const handleConnect = async () => {
    try {
      const res = await connectWallet();

      if (!res || !res.address) {
        alert("Please approve MetaMask");
        return;
      }

      setAccount(res.address);
      console.log("Connected account:", res.address);
    } catch (err) {
      console.error("Connection Error:", err);
      alert("Wallet connection failed");
    }
  };

  return (
    <>
      {/* 🔷 Navbar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        
        {/* Logo */}
        <div>
          <img
            src="https://business.paytm.com/s3assets/images/newheader/business-website-logo.svg"
            alt="Paytm Business"
            className="h-8"
          />
        </div>

        {/* Navigation */}
        <div className="hidden md:flex gap-8 items-center font-medium">
          <Link to="/" className="hover:text-blue-500">Home</Link>
          <Link to="/register" className="hover:text-blue-500">Register</Link>
          <Link to="/product-manager" className="hover:text-blue-500">Product Manager</Link>
          <Link to="/escrow" className="hover:text-blue-500">Escrow</Link>
          <Link to="/dashboard" className="hover:text-blue-500">Dashboard</Link>
        </div>

        {/* Right Button */}
        <div>
          <button
            onClick={handleConnect}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            {typeof account === "string" && account.length > 0
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>
      </div>

      {/* 🔥 Hero Section (Paytm Style) */}
      
    </>
  );
}