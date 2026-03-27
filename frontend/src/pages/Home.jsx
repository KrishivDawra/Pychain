import Footer from "../components/Footer";

export default function Home({ account, handleConnect }) {
  return (
    <div>

      {/* 🔥 Hero Section (ONLY TEXT) */}
      <div className="flex flex-col items-center justify-center text-center py-16 ">
        
        <h1 className="text-5xl font-bold mb-6 max-w-5xl">
          One Chain Connecting Every Transaction,<br />
          Fully Automated and Secure
        </h1>

        <p className="text-gray-600 mb-8 max-w-xl">
          Connect manufacturers, distributors, wholesalers, and customers in one seamless blockchain-powered flow.
        </p>

        <button
          onClick={handleConnect}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition"
        >
          {typeof account === "string" && account.length > 0
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>

      </div>

      {/* 🖼️ FULL WIDTH HERO IMAGE */}
      <div className="w-full">
        <img
          src="/hero.png"
          alt="Supply Chain Flow"
          className="w-full h-[500px] md:h-[650px] object-cover"
        />
      </div>

      {/* 🚀 How It Works Section */}
      <div className="py-20 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg font-medium">
          <div className="p-4 shadow-md rounded-lg">🏭 Manufacturer</div>
          <span className="text-2xl">→</span>
          <div className="p-4 shadow-md rounded-lg">📦 Distributor</div>
          <span className="text-2xl">→</span>
          <div className="p-4 shadow-md rounded-lg">🏪 Wholesaler</div>
          <span className="text-2xl">→</span>
          <div className="p-4 shadow-md rounded-lg">🛒 Customer</div>
        </div>

        <p className="mt-8 text-gray-600 max-w-2xl mx-auto">
          Each step is connected through smart contracts and escrow, ensuring secure and automated transactions across the entire supply chain.
        </p>
      </div>

      {/* 🔐 Features Section */}
      <div className="py-20 px-6 bg-blue-50 text-center">
        <h2 className="text-3xl font-bold mb-12">Why Choose Our Platform?</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="font-semibold mb-2">🔐 Escrow Security</h3>
            <p>No funds released until all conditions are met.</p>
          </div>

          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="font-semibold mb-2">🔗 Transparency</h3>
            <p>All transactions are verifiable on blockchain.</p>
          </div>

          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="font-semibold mb-2">⚡ Automation</h3>
            <p>Smart contracts handle the entire workflow.</p>
          </div>

          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="font-semibold mb-2">📊 Tracking</h3>
            <p>Track every stage of the supply chain in real-time.</p>
          </div>

        </div>
      </div>
      <Footer/>
    </div>
  );
}