import { useEffect, useState } from "react";
import { connectWallet, getCurrentAccount, getMyProducts } from "../utils/contract";
import toast from "react-hot-toast";

export default function MyProducts() {
  const [account, setAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const shortAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const parseError = (err, fallback) => {
    return err?.reason || err?.shortMessage || err?.message || fallback;
  };

  const loadMyProducts = async () => {
    try {
      setLoading(true);

      const currentAccount = await getCurrentAccount();
      if (!currentAccount) {
        setAccount(null);
        setProducts([]);
        return;
      }

      setAccount(currentAccount);

      const ownedProducts = await getMyProducts();
      setProducts(ownedProducts);
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Failed to load products ❌"));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await connectWallet();
      if (!res) return;

      setAccount(res.address);
      toast.success("Wallet connected ✅");
      await loadMyProducts();
    } catch (err) {
      console.error(err);
      toast.error(parseError(err, "Wallet connection failed ❌"));
    }
  };

  useEffect(() => {
    loadMyProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-2">
            My Products
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Products Owned By Your Wallet
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View all products currently assigned to your connected wallet.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wallet Products</h2>
              <p className="text-gray-600 mt-1">
                Connect your wallet to see the products you currently own.
              </p>
            </div>

            {!account ? (
              <button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-md"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium">
                Connected: {shortAddress(account)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={loadMyProducts}
              disabled={loading}
              className={`px-5 py-3 rounded-xl font-semibold text-white transition ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md"
              }`}
            >
              {loading ? "Loading..." : "Refresh Products"}
            </button>
          </div>

          {!account ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800 font-medium">
              Please connect your wallet to see your products.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-700 font-medium">
              Loading your products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-700 font-medium">
              No products found for this wallet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Product ID</p>
                      <p className="text-xl font-bold text-gray-900">
                        #{product.id}
                      </p>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.delivered
                          ? "bg-green-100 text-green-700"
                          : product.shipped
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {product.delivered
                        ? "Delivered"
                        : product.shipped
                        ? "In Transit"
                        : "Active"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Product Name</p>
                      <p className="font-semibold text-gray-900 break-words">
                        {product.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Metadata</p>
                      <p className="font-medium text-gray-800 break-words">
                        {product.metadata}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Current Owner</p>
                      <p className="font-medium text-gray-800 break-all">
                        {product.currentOwner}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}