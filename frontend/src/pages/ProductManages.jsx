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

  // 🔐 Connect Wallet
  const handleConnect = async () => {
    const res = await connectWallet();
    if (res) {
      setSigner(res.signer);
      setAccount(res.address);
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

      // Fetch escrow info
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
        const statusMap = ["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE", "REFUNDED"];
        setEscrowStatus(statusMap[status]);
      } catch {
        setEscrow(null);
        setEscrowStatus("No Escrow");
      }

      toast.success("Product verified ✅");
    } catch (err) {
      console.error(err);
      setResult(false);
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
      verify(id);
      setNewOwner("");
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

  // 🔄 Status of Product
  const getStatus = () => {
    if (history.length === 0) return "Created 🏭";
    const last = history[history.length - 1].action;
    if (last.includes("Delivered")) return "Delivered 📦";
    if (last.includes("Shipped")) return "In Transit 🚚";
    return "Processing ⏳";
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Product Manager</h2>

      {/* Wallet Connect */}
      {!signer && (
        <button
          onClick={handleConnect}
          className="bg-blue-500 px-4 py-2 rounded mb-4"
        >
          Connect Wallet
        </button>
      )}

      {/* Product Verification */}
      <input
        className="p-2 w-full mb-2 bg-gray-800 rounded"
        placeholder="Product ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <button
        disabled={loading}
        className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded mb-4"
        onClick={() => verify(id)}
      >
        {loading ? "Processing..." : "Verify"}
      </button>

      {/* QR Scanner */}
      <div className="mb-4">
        <QRScanner
          onScan={(text) => {
            const parts = text.split("-");
            const productId = parts[1];
            if (!productId || isNaN(productId)) return toast.error("Invalid QR ❌");
            setId(productId);
            verify(productId);
          }}
        />
      </div>

      {/* Product Details & Actions */}
      {result && data && (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 mb-4">
          <p className="text-green-400 text-lg mb-2">✅ Genuine Product</p>
          <p className="text-blue-400 mb-3">Status: {getStatus()}</p>

          <div className="bg-gray-800 p-4 rounded-xl mb-4">
            <p><b>Name:</b> {data.name}</p>
            <p><b>Owner:</b> {data.currentOwner}</p>
          </div>

          {/* Transfer Ownership */}
          <input
            className="p-2 w-full mb-2 bg-gray-800 rounded"
            placeholder="New Owner Address"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
          />
          <button
            onClick={transferOwnership}
            className="bg-green-500 px-4 py-2 rounded mb-4 w-full"
            disabled={loading}
          >
            {loading ? "Processing..." : "Transfer Ownership"}
          </button>

          {/* Escrow Info */}
          {escrow && (
            <div className="bg-gray-800 p-4 rounded-xl mb-4">
              <p><b>Escrow Status:</b> {escrowStatus}</p>
              <p><b>Buyer:</b> {escrow.buyer}</p>
              <p><b>Seller:</b> {escrow.seller}</p>
              <p><b>Amount:</b> {ethers.formatEther(escrow.amount)} ETH</p>

              {escrow.status === 0 && (
                <button
                  onClick={depositPayment}
                  className="bg-yellow-500 px-4 py-2 rounded mt-2 w-full"
                  disabled={loading}
                >
                  Deposit Payment 💰
                </button>
              )}
              {escrow.status === 1 && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={confirmDelivery}
                    className="bg-green-500 px-4 py-2 rounded flex-1"
                    disabled={loading}
                  >
                    Release Payment ✅
                  </button>
                  <button
                    onClick={refundPayment}
                    className="bg-red-500 px-4 py-2 rounded flex-1"
                    disabled={loading}
                  >
                    Refund ❌
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline / Product Journey */}
          {history.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-xl">
              <h3 className="font-bold mb-3">📦 Product Journey</h3>
              {history.map((item, i) => (
                <div key={i} className="mb-3 border-l-2 border-blue-500 pl-3">
                  <p>{item.action}</p>
                  <p className="text-sm text-gray-400">{item.actor}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(Number(item.timestamp) * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result === false && <p className="text-red-400 mt-4">❌ Fake Product</p>}
    </div>
  );
}