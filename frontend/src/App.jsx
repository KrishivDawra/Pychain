import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RegisterProduct from "./pages/RegisterProduct";

import EscrowDashboard from "./pages/EscrowDashboard";
import ProductManager from "./pages/ProductManages";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterProduct />} />
          <Route path="/product-manager" element={<ProductManager/>} />
          <Route path="/escrow" element={<EscrowDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}