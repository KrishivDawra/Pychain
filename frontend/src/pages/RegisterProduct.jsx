import { useState } from "react";
import QRGenerator from "../components/QRGenerator";
import { getSupplyChain } from "../utils/contract";
import Footer from "../components/Footer";

export default function RegisterProduct() {
  const [name, setName] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter a product name");
      return;
    }

    try {
      setLoading(true);

      const contract = await getSupplyChain();

      const tx = await contract.registerProduct(name, "hash123");
      await tx.wait();

      const productId = await contract.productCount();
      const qrValue = `product-${productId}-${name}`;

      setQr(qrValue);
      alert("✅ Product Registered on Blockchain");
      setName("");
    } catch (err) {
      console.error(err);
      alert("❌ Error registering product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100  ">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start py-8">
        
        {/* Left Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600 mb-2">
              PRODUCT REGISTRATION
            </p>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Register Your Product on the Blockchain
            </h1>
            <p className="text-gray-600 mt-4 text-lg">
              Securely create a product record and generate a QR code for easy
              tracking across your supply chain.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={name}
                placeholder="Enter product name"
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full rounded-xl px-6 py-3 text-lg font-semibold text-white transition duration-300 ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? "Processing Transaction..." : "Register Product"}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-2xl mb-2">🔐</p>
              <h3 className="font-semibold text-gray-800">Secure Record</h3>
              <p className="text-sm text-gray-600 mt-1">
                Product entry stored on blockchain.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-2xl mb-2">📦</p>
              <h3 className="font-semibold text-gray-800">Trackable Item</h3>
              <p className="text-sm text-gray-600 mt-1">
                Follow the product through every stage.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-2xl mb-2">⚡</p>
              <h3 className="font-semibold text-gray-800">Fast Workflow</h3>
              <p className="text-sm text-gray-600 mt-1">
                Instantly generate QR after registration.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100 min-h-[500px] flex flex-col justify-center">
          {!qr ? (
            <div className="text-center">
              <div className="w-28 h-28 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-5xl mb-6">
                🧾
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                QR Code Preview
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Once your product is registered, its QR code will appear here.
                You can use it for tracking, verification, and supply chain flow.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-green-600 mb-2">
                PRODUCT REGISTERED SUCCESSFULLY
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                QR Code Generated
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 inline-block shadow-sm">
                <QRGenerator value={qr} />
              </div>

              <p className="mt-5 text-gray-700 font-medium break-words">
                {qr}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Scan this QR code to verify or trace the product.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}