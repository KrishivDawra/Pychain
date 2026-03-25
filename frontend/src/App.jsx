import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RegisterProduct from "./pages/RegisterProduct";
import TransferProduct from "./pages/TransferProduct";
import VerifyProduct from "./pages/VerifyProduct";
import EscrowDashboard from "./pages/EscrowDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterProduct />} />
          <Route path="/transfer" element={<TransferProduct />} />
          <Route path="/verify" element={<VerifyProduct />} />
          <Route path="/escrow" element={<EscrowDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}