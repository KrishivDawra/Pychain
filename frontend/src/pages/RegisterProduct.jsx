import { useState } from "react";
import QRGenerator from "../components/QRGenerator";
import { getSupplyChain } from "../utils/contract";

export default function RegisterProduct() {
  const [name, setName] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const contract = await getSupplyChain();

      const tx = await contract.registerProduct(name, "hash123");
      await tx.wait();

      // Assuming product ID increments
      const productId = await contract.productCount();

      setQr(`product-${productId}-${name}`);

      alert("✅ Product Registered on Blockchain");
    } catch (err) {
      console.error(err);
      alert("❌ Error registering product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Register Product</h2>

      <input
        className="p-2 w-full mb-4 bg-gray-800 rounded"
        placeholder="Product Name"
        onChange={(e) => setName(e.target.value)}
      />

      <button
        className="bg-blue-500 px-4 py-2 rounded"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Processing..." : "Register Product"}
      </button>

      {qr && (
        <div className="mt-4">
          <QRGenerator value={qr} />
        </div>
      )}
    </div>
  );
}