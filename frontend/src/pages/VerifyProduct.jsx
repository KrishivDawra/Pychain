import { useState } from "react";
import QRScanner from "../components/QRScanner";
import { getSupplyChain } from "../utils/contract";

export default function VerifyProduct() {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [data, setData] = useState(null);

  const verify = async (productId) => {
    try {
      const contract = await getSupplyChain();
      const product = await contract.products(productId);

      if (product.name) {
        setResult(true);
        setData(product);
      } else {
        setResult(false);
      }
    } catch (err) {
      console.error(err);
      setResult(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Verify Product</h2>

      {/* Manual Input */}
      <input
        className="p-2 w-full mb-4 bg-gray-800 rounded"
        placeholder="Enter Product ID"
        onChange={(e) => setId(e.target.value)}
      />

      <button
        className="bg-purple-500 px-4 py-2 rounded"
        onClick={() => verify(id)}
      >
        Verify
      </button>

      {/* QR Scanner */}
      <div className="mt-6">
        <h3 className="mb-2">Scan QR</h3>
        <QRScanner
          onScan={(text) => {
            const parts = text.split("-");
            const productId = parts[1]; // product-1-name
            setId(productId);
            verify(productId);
          }}
        />
      </div>

      {/* Result */}
      {result !== null && (
        <div className="mt-4">
          {result ? (
            <div>
              <p className="text-green-400">✅ Genuine Product</p>
              <p>Name: {data.name}</p>
              <p>Owner: {data.owner}</p>
            </div>
          ) : (
            <p className="text-red-400">❌ Fake Product</p>
          )}
        </div>
      )}
    </div>
  );
}