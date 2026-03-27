import { useState } from "react";
import QRScanner from "../components/QRScanner";
import { getSupplyChain, getEscrow, connectWallet } from "../utils/contract";
import { ethers } from "ethers";
import toast from "react-hot-toast";

export default function ProductManager() {
  const [id, setId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [result, setResult] = useState(null);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [escrow, setEscrow] = useState(null);
  const [escrowStatus, setEscrowStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("0.01");
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  // 🔐 Connect Wallet
  const handleConnect = async () => {
    try {
      const res = await connectWallet();
      if (res) {
        setSigner(res.signer);
        setAccount(res.address);
        toast.success("Wallet connected ✅");
      }
    } catch (err) {
      console.error(err);
      toast.error("Wallet connection failed ❌");
    }
  };

  // ✅ Verify Product & Fetch Escrow
  const verify = async (productId) => {
    if (!productId) return toast.error("Enter Product ID ❌");

    try {
      setLoading(true);
      const contract = await getSupplyChain();
      const esc = await getEscrow();

      const product = await contract.getProduct(productId);
      const events = await contract.getProductEvents(productId);

      if (!product || product[0] == 0) {
        setResult(false);
        setData(null);
        setHistory([]);
        setEscrow(null);
        return toast.error("Product not found ❌");
      }

      setResult(true);
      setData({
        id: product[0],
        name: product[1],
        metadata: product[2],
        currentOwner: product[3],
      });
      setHistory(events);

      try {
        const tx = await esc.getTransaction(productId);
        const [txnId, pid, buyer, seller, txnAmount, status] = tx;

        setEscrow({
          id: txnId,
          productId: pid,
          buyer,
          seller,
          amount: txnAmount,
          status,
        });

        const statusMap = [
          "AWAITING_PAYMENT",
          "AWAITING_DELIVERY",
          "COMPLETE",
          "REFUNDED",
        ];
        setEscrowStatus(statusMap[Number(status)] || "UNKNOWN");
      } catch {
        setEscrow(null);
        setEscrowStatus("No Escrow");
      }

      toast.success("Product verified ✅");
    } catch (err) {
      console.error(err);
      setResult(false);
      setData(null);
      toast.error("Verification failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Transfer Ownership
  const transferOwnership = async () => {
    if (!id || !newOwner) return toast.error("Enter Product ID & new owner");

    try {
      setLoading(true);
      const contract = await getSupplyChain();
      const tx = await contract.transferProduct(id, newOwner);
      await tx.wait();
      toast.success("Ownership transferred ✅");
      setNewOwner("");
      verify(id);
    } catch (err) {
      console.error(err);
      toast.error("Transfer failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // 💰 Escrow Actions
  const depositPayment = async () => {
    if (!escrow) return toast.error("No escrow found ❌");

    try {
      setLoading(true);
      const esc = await getEscrow();
      const tx = await esc.depositPayment(data.id, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      toast.success("Payment deposited 💰");
      verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error("Payment failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!data) return toast.error("Product not found ❌");

    try {
      setLoading(true);
      const contract = await getSupplyChain();
      const tx = await contract.markDelivered(data.id);
      await tx.wait();
      toast.success("Payment released to seller ✅");
      verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error("Release failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async () => {
    if (!escrow) return toast.error("No escrow found ❌");

    try {
      setLoading(true);
      const esc = await getEscrow();
      const tx = await esc.refund(data.id);
      await tx.wait();
      toast.success("Payment refunded to buyer ✅");
      verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error("Refund failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (history.length === 0) return "Created 🏭";
    const last = history[history.length - 1].action;
    if (last.includes("Delivered")) return "Delivered 📦";
    if (last.includes("Shipped")) return "In Transit 🚚";
    return "Processing ⏳";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-2">
            Product Management
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Verify, Track and Manage Products
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage ownership, verify authenticity, monitor escrow, and trace the
            full product journey across your blockchain-powered supply chain.
          </p>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-blue-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Product Verification
                </h2>
                <p className="text-gray-600 mt-1">
                  Enter a product ID or scan a QR code to fetch product and
                  escrow details.
                </p>
              </div>

              {!signer ? (
                <button
                  onClick={handleConnect}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-md"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium">
                  Wallet Connected: {shortAddress(account)}
                </div>
              )}
            </div>

            {/* Verify Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter product ID"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition ${
                    loading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 shadow-md"
                  }`}
                  onClick={() => verify(id)}
                >
                  {loading ? "Processing..." : "Verify Product"}
                </button>
              </div>
            </div>

            {/* QR Scanner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Scan Product QR
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan a QR code to auto-fetch the product ID and instantly verify
                it.
              </p>

              <QRScanner
                onScan={(text) => {
                  const parts = text.split("-");
                  const productId = parts[1];

                  if (!productId || isNaN(productId)) {
                    return toast.error("Invalid QR ❌");
                  }

                  setId(productId);
                  verify(productId);
                }}
              />
            </div>

            {/* Product Result */}
            {result && data && (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-green-700 font-semibold text-lg">
                        ✅ Genuine Product
                      </p>
                      <p className="text-gray-700 mt-1">
                        Current lifecycle status:{" "}
                        <span className="font-semibold">{getStatus()}</span>
                      </p>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-xl border border-green-100 shadow-sm">
                      <span className="text-sm text-gray-500">Product ID</span>
                      <p className="font-bold text-gray-900">{String(data.id)}</p>
                    </div>
                  </div>
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Product Name</p>
                    <p className="font-semibold text-gray-900 break-words">
                      {data.name}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Current Owner</p>
                    <p className="font-semibold text-gray-900 break-all">
                      {data.currentOwner}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Metadata</p>
                    <p className="font-semibold text-gray-900 break-words">
                      {data.metadata}
                    </p>
                  </div>
                </div>

                {/* Transfer Ownership */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Transfer Ownership
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Transfer this product to a new blockchain address.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <input
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                        placeholder="Enter new owner wallet address"
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                      />
                    </div>

                    <div>
                      <button
                        onClick={transferOwnership}
                        className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition ${
                          loading
                            ? "bg-green-300 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 shadow-md"
                        }`}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Transfer"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Escrow Info */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Escrow Management
                  </h3>
                  <p className="text-gray-600 mb-5">
                    View escrow details and take payment-related actions.
                  </p>

                  {!escrow ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-gray-600">
                      No escrow found for this product.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-sm text-gray-500">Escrow Status</p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {escrowStatus}
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-sm text-gray-500">Buyer</p>
                          <p className="font-semibold text-gray-900 mt-1 break-all">
                            {escrow.buyer}
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-sm text-gray-500">Seller</p>
                          <p className="font-semibold text-gray-900 mt-1 break-all">
                            {escrow.seller}
                          </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {ethers.formatEther(escrow.amount)} ETH
                          </p>
                        </div>
                      </div>

                      {escrow.status === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Deposit Amount (ETH)
                            </label>
                            <input
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition"
                              placeholder="Enter amount in ETH"
                            />
                          </div>

                          <div>
                            <button
                              onClick={depositPayment}
                              className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition ${
                                loading
                                  ? "bg-yellow-300 cursor-not-allowed"
                                  : "bg-yellow-500 hover:bg-yellow-600 shadow-md"
                              }`}
                              disabled={loading}
                            >
                              Deposit Payment 💰
                            </button>
                          </div>
                        </div>
                      )}

                      {escrow.status === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={confirmDelivery}
                            className={`px-4 py-3 rounded-xl font-semibold text-white transition ${
                              loading
                                ? "bg-green-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 shadow-md"
                            }`}
                            disabled={loading}
                          >
                            Release Payment ✅
                          </button>

                          <button
                            onClick={refundPayment}
                            className={`px-4 py-3 rounded-xl font-semibold text-white transition ${
                              loading
                                ? "bg-red-300 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700 shadow-md"
                            }`}
                            disabled={loading}
                          >
                            Refund Payment ❌
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Product Journey */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Product Journey
                  </h3>
                  <p className="text-gray-600 mb-5">
                    Track every movement and event associated with this product.
                  </p>

                  {history.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-gray-600">
                      No journey events found yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item, i) => (
                        <div
                          key={i}
                          className="relative border-l-4 border-blue-500 pl-5 py-1"
                        >
                          <div className="absolute -left-[9px] top-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                          <p className="font-semibold text-gray-900">
                            {item.action}
                          </p>
                          <p className="text-sm text-gray-600 break-all">
                            {item.actor}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              Number(item.timestamp) * 1000
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result === false && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 font-semibold">
                ❌ Fake Product or invalid product ID.
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => verify(id)}
                  disabled={loading || !id}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold transition"
                >
                  Verify Current Product
                </button>

                <button
                  onClick={() => {
                    setId("");
                    setNewOwner("");
                    setResult(null);
                    setData(null);
                    setHistory([]);
                    setEscrow(null);
                    setEscrowStatus("");
                    setAmount("0.01");
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-semibold transition"
                >
                  Reset Form
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Workflow Summary
              </h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="text-xl">1️⃣</span>
                  <p>Connect your wallet to access ownership and escrow actions.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">2️⃣</span>
                  <p>Verify a product using its ID or by scanning its QR code.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">3️⃣</span>
                  <p>Transfer ownership or manage payment release and refunds.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">4️⃣</span>
                  <p>Review the full blockchain-backed product journey.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-3">Platform Benefits</h3>
              <div className="space-y-3 text-sm">
                <p>🔐 Secure product authenticity verification</p>
                <p>📦 Transparent ownership transfers</p>
                <p>💰 Controlled escrow-based payments</p>
                <p>🧾 End-to-end supply chain tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}