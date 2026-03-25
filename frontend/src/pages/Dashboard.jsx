import { useEffect, useState } from "react";
import { connectWallet } from "../utils/contract";

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");

  const roles = {
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": "Manufacturer",
    // add more addresses
  };

  useEffect(() => {
    const init = async () => {
      const signer = await connectWallet();
      const addr = await signer.getAddress();

      setAddress(addr);
      setRole(roles[addr] || "User");
    };

    init();
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-4">Dashboard</h2>

      <div className="bg-gray-800 p-4 rounded-xl">
        <p><b>Address:</b> {address}</p>
        <p><b>Role:</b> {role}</p>
      </div>
    </div>
  );
}