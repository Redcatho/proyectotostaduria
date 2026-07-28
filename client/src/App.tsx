import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Varieties from "./pages/Varieties";
import GreenCoffee from "./pages/GreenCoffee";
import Roasting from "./pages/Roasting";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/variedades" element={<Varieties />} />
        <Route path="/ingresos" element={<GreenCoffee />} />
        <Route path="/tostado" element={<Roasting />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/reportes" element={<Reports />} />
      </Route>
    </Routes>
  );
}