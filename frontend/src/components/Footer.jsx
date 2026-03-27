import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* 🔷 Brand + Description */}
        <div>
          <h2 className="text-2xl font-bold mb-3">Paytm Business+</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Extending Paytm for Business by integrating blockchain-powered escrow 
            and automated supply chain transactions for secure, transparent, and 
            seamless business operations.
          </p>
        </div>

        {/* 🔗 Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition">
                Home
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white transition">
                Register
              </Link>
            </li>
            <li>
              <Link to="/product-manager" className="hover:text-white transition">
                Product Manager
              </Link>
            </li>
            <li>
              <Link to="/escrow" className="hover:text-white transition">
                Escrow
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        {/* 📌 About / Problem Statement */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Our Solution</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            While Paytm for Business serves a network of merchants, our platform 
            enhances this ecosystem by connecting manufacturers, distributors, 
            wholesalers, and customers into a unified blockchain-based network, 
            enabling trustless and automated transactions.
          </p>
        </div>

      </div>

      {/* 🔻 Bottom Bar */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Paytm Business+ | Built with Web3 🚀
      </div>

    </footer>
  );
}