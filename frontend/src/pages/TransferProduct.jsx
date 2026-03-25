import { useState } from "react";
import { getSupplyChain } from "../utils/contract";

export default function TransferProduct() {
  const [id, setId] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const transfer = async () => {
    try {
      setLoading(true);

      const contract = await getSupplyChain();

      const tx = await contract.transferProduct(id, address);
      await tx.wait();

      alert("✅ Ownership Transferred Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Transfer Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Transfer Product</h2>

      <input
        className="p-2 w-full mb-2 bg-gray-800 rounded"
        placeholder="Product ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />

      <input
        className="p-2 w-full mb-4 bg-gray-800 rounded"
        placeholder="New Owner Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        className="bg-green-500 px-4 py-2 rounded w-full"
        onClick={transfer}
        disabled={loading}
      >
        {loading ? "Processing..." : "Transfer Ownership"}
      </button>
    </div>
  );
}