import { useState } from "react";
import { getEscrow } from "../utils/contract";
import { ethers } from "ethers";

export default function EscrowDashboard() {
  const [seller, setSeller] = useState("");
  const [txId, setTxId] = useState("");
  const [loading, setLoading] = useState(false);

  const createTransaction = async () => {
    try {
      setLoading(true);

      const escrow = await getEscrow();
      const tx = await escrow.createTransaction(seller);
      await tx.wait();

      alert("✅ Transaction Created");
    } catch (err) {
      console.error(err);
      alert("❌ Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  const deposit = async () => {
    try {
      setLoading(true);

      const escrow = await getEscrow();
      const tx = await escrow.depositPayment(txId, {
        value: ethers.parseEther("1"),
      });
      await tx.wait();

      alert("💰 Payment Deposited");
    } catch (err) {
      console.error(err);
      alert("❌ Deposit Failed");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    try {
      setLoading(true);

      const escrow = await getEscrow();
      const tx = await escrow.confirmDelivery(txId);
      await tx.wait();

      alert("✅ Payment Released to Seller");
    } catch (err) {
      console.error(err);
      alert("❌ Confirmation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl mb-6">Escrow Dashboard</h2>

      {/* Create Transaction */}
      <div className="bg-gray-800 p-4 rounded-xl mb-6">
        <h3 className="mb-2 text-blue-400 font-bold">Create Transaction</h3>

        <input
          className="p-2 w-full mb-3 bg-gray-700 rounded"
          placeholder="Seller Address"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
        />

        <button
          className="bg-blue-500 px-4 py-2 rounded w-full"
          onClick={createTransaction}
          disabled={loading}
        >
          Create
        </button>
      </div>

      {/* Payment Actions */}
      <div className="bg-gray-800 p-4 rounded-xl">
        <h3 className="mb-2 text-yellow-400 font-bold">Manage Payment</h3>

        <input
          className="p-2 w-full mb-3 bg-gray-700 rounded"
          placeholder="Transaction ID"
          value={txId}
          onChange={(e) => setTxId(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            className="bg-yellow-500 px-4 py-2 rounded w-full"
            onClick={deposit}
            disabled={loading}
          >
            Deposit 1 ETH
          </button>

          <button
            className="bg-green-500 px-4 py-2 rounded w-full"
            onClick={confirm}
            disabled={loading}
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
}