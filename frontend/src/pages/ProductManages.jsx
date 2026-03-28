import { useState } from "react";
import QRScanner from "../components/QRScanner";
import {
  getSupplyChain,
  getEscrow,
  connectWallet,
  getCurrentAccount,
} from "../utils/contract";
import { ethers } from "ethers";
import toast from "react-hot-toast";

export default function ProductManager() {
  const [id, setId] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [result, setResult] = useState(null);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [escrow, setEscrow] = useState(null);
  const [escrowStatus, setEscrowStatus] = useState("No Escrow");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("0.01");
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const resetState = () => {
    setId("");
    setNewOwner("");
    setResult(null);
    setData(null);
    setHistory([]);
    setEscrow(null);
    setEscrowStatus("No Escrow");
    setAmount("0.01");
  };

  const parseError = (err, fallback) => {
    return err?.reason || err?.shortMessage || err?.message || fallback;
  };

  const ensureConnected = async () => {
    try {
      const existing = await getCurrentAccount();
      if (existing) {
        setAccount(existing);
        return true;
      }

      const res = await connectWallet();
      if (res) {
        setSigner(res.signer);
        setAccount(res.address);
        return true;
      }

      return false;
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Wallet connection failed ❌"));
      return false;
    }
  };

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
      toast.error(parseError(err, "Wallet connection failed ❌"));
    }
  };

  // ✅ Verify Product & Fetch Escrow
  const verify = async (productId) => {
    if (!productId) return toast.error("Enter Product ID ❌");

    try {
      setLoading(true);

      // read-only calls
      const contract = await getSupplyChain(false);
      const esc = await getEscrow(false);

      const product = await contract.getProductDetails(productId);
      const events = await contract.getProductEvents(productId);

      if (!product || Number(product[0]) === 0) {
        setResult(false);
        setData(null);
        setHistory([]);
        setEscrow(null);
        setEscrowStatus("No Escrow");
        return toast.error("Product not found ❌");
      }

      setResult(true);
      setData({
        id: product[0],
        name: product[1],
        metadata: product[2],
        currentOwner: product[3],
        shipped: product[4],
        delivered: product[5],
      });
      setHistory(events);

      try {
        const txnId = await esc.getTransactionIdByProduct(productId);

        if (Number(txnId) === 0) {
          setEscrow(null);
          setEscrowStatus("No Escrow");
        } else {
          const tx = await esc.getTransaction(productId);
          const [txnIdValue, pid, buyer, seller, txnAmount, status] = tx;

          setEscrow({
            id: txnIdValue,
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
        }
      } catch (err) {
        console.error("Escrow fetch error:", err);
        setEscrow(null);
        setEscrowStatus("No Escrow");
      }

      toast.success("Product verified ✅");
    } catch (err) {
      console.error(err);
      setResult(false);
      setData(null);
      setHistory([]);
      setEscrow(null);
      setEscrowStatus("No Escrow");
      toast.error(parseError(err, "Verification failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Create Escrow Transaction
  const createEscrowTransaction = async () => {
    if (!data) return toast.error("Verify product first ❌");
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const esc = await getEscrow(true);

      const tx = await esc.createTransaction(data.id, data.currentOwner);
      await tx.wait();

      toast.success("Escrow transaction created ✅");
      await verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Escrow creation failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Transfer Ownership
  const transferOwnership = async () => {
    if (!id || !newOwner) return toast.error("Enter Product ID & new owner");
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const contract = await getSupplyChain(true);
      const tx = await contract.transferProduct(id, newOwner);
      await tx.wait();
      toast.success("Ownership transferred ✅");
      setNewOwner("");
      await verify(id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Transfer failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 🚚 Mark Shipped
  const markShipped = async () => {
    if (!data) return toast.error("Product not found ❌");
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const contract = await getSupplyChain(true);
      const tx = await contract.markShipped(data.id);
      await tx.wait();
      toast.success("Product marked as shipped 🚚");
      await verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Mark shipped failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 💰 Deposit Payment
  const depositPayment = async () => {
    if (!escrow) return toast.error("No escrow found ❌");
    if (!amount || Number(amount) <= 0) {
      return toast.error("Enter valid ETH amount ❌");
    }
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const esc = await getEscrow(true);
      const tx = await esc.depositPayment(data.id, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      toast.success("Payment deposited 💰");
      await verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Payment failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 📦 Confirm Delivery → release payment via SupplyChain
  const confirmDelivery = async () => {
    if (!data) return toast.error("Product not found ❌");
    if (!data.shipped) return toast.error("Product must be shipped first ❌");
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const contract = await getSupplyChain(true);
      const tx = await contract.markDelivered(data.id);
      await tx.wait();
      toast.success("Product delivered and payment released ✅");
      await verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Delivery/release failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Refund
  const refundPayment = async () => {
    if (!escrow) return toast.error("No escrow found ❌");
    if (!(await ensureConnected())) return;

    try {
      setLoading(true);
      const esc = await getEscrow(true);
      const tx = await esc.refund(data.id);
      await tx.wait();
      toast.success("Payment refunded to buyer ✅");
      await verify(data.id);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Refund failed ❌"));
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (!data) return "Unknown";
    if (data.delivered) return "Delivered 📦";
    if (data.shipped) return "In Transit 🚚";
    return "Created / Processing ⏳";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {!signer && !account ? (
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

            {result && data && (
              <div className="space-y-6">
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

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Escrow Management
                  </h3>
                  <p className="text-gray-600 mb-5">
                    Create escrow, deposit payment, and manage delivery or refund.
                  </p>

                  {!escrow ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 text-gray-600">
                      <p className="mb-4">No escrow found for this product.</p>
                      <button
                        onClick={createEscrowTransaction}
                        disabled={loading}
                        className={`px-5 py-3 rounded-xl font-semibold text-white transition ${
                          loading
                            ? "bg-blue-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-md"
                        }`}
                      >
                        {loading ? "Processing..." : "Create Escrow"}
                      </button>
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

                      {Number(escrow.status) === 0 && (
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

                      {Number(escrow.status) === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={markShipped}
                            className={`px-4 py-3 rounded-xl font-semibold text-white transition ${
                              loading
                                ? "bg-indigo-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                            }`}
                            disabled={loading || data.shipped}
                          >
                            {data.shipped ? "Already Shipped 🚚" : "Mark Shipped 🚚"}
                          </button>

                          <button
                            onClick={confirmDelivery}
                            className={`px-4 py-3 rounded-xl font-semibold text-white transition ${
                              loading
                                ? "bg-green-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 shadow-md"
                            }`}
                            disabled={loading || !data.shipped}
                          >
                            Mark Delivered & Release ✅
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

                      {Number(escrow.status) === 2 && (
                        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 font-medium">
                          ✅ Escrow complete. Payment has been released to seller.
                        </div>
                      )}

                      {Number(escrow.status) === 3 && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 font-medium">
                          🔁 Escrow refunded. Payment has been returned to buyer.
                        </div>
                      )}
                    </>
                  )}
                </div>

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
                            {new Date(Number(item.timestamp) * 1000).toLocaleString()}
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
                  onClick={resetState}
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
                  <p>Connect your wallet and verify a product.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">2️⃣</span>
                  <p>Create escrow for the verified product.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">3️⃣</span>
                  <p>Buyer deposits payment into escrow.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">4️⃣</span>
                  <p>Distributor ships, retailer delivers, payment is released.</p>
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