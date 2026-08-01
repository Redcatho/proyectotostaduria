import { useEffect, useState } from "react";
import { api, InventoryItem, Mesh, MeshSummary } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const MESH_LABELS: Record<Mesh, string> = {
  "18": "Malla 18",
  "16": "Malla 16",
  "14": "Malla 14",
  desperdicio: "Desperdicio",
};

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [meshSummary, setMeshSummary] = useState<MeshSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.inventory.list(), api.lots.summary()])
      .then(([inv, ms]) => {
        setInventory(inv);
        setMeshSummary(ms);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingSpinner />;

  const chartData = meshSummary.map((s) => ({
    name: MESH_LABELS[s.mesh],
    Ingresado: Math.round(s.incoming * 100) / 100,
    Usado: Math.round(s.used * 100) / 100,
    Disponible: Math.round(s.available * 100) / 100,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Inventario Actual</h2>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Disponible por Malla</h3>
        {meshSummary.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-400 text-sm">
            No hay mallas divididas. Divídelas desde Ingresos de Café Verde.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {meshSummary.map((s) => (
                <div key={s.mesh} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{MESH_LABELS[s.mesh]}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.available <= 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                      {s.available <= 0 ? "Agotada" : "Disponible"}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-amber-700">{Math.round(s.available * 100) / 100} kg</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Ingresado</p>
                      <p className="font-medium text-gray-700">{Math.round(s.incoming * 100) / 100} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Usado</p>
                      <p className="font-medium text-gray-700">{Math.round(s.used * 100) / 100} kg</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-4">
              <h4 className="font-medium text-gray-800 mb-3">Ingreso vs Uso por Malla</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Ingresado" stackId="a" fill="#a8a29e" />
                  <Bar dataKey="Usado" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="Disponible" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3 font-medium">Variedad</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Origen</th>
              <th className="text-right p-3 font-medium">Total Ingreso</th>
              <th className="text-right p-3 font-medium">Total Usado</th>
              <th className="text-right p-3 font-medium">Disponible</th>
              <th className="text-right p-3 font-medium">Total Tostado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin datos de inventario</td></tr>
            )}
            {inventory.map((item) => (
              <tr key={item.varietyId} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">{item.varietyName}</td>
                <td className="p-3 text-gray-500 hidden md:table-cell">{item.origin || "—"}</td>
                <td className="p-3 text-right">{item.totalGreenIn} kg</td>
                <td className="p-3 text-right">{item.totalGreenUsed} kg</td>
                <td className="p-3 text-right font-medium text-amber-700">{item.availableGreen} kg</td>
                <td className="p-3 text-right text-green-700">{item.totalRoasted} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.map((item) => (
          <div key={item.varietyId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="font-medium text-gray-800">{item.varietyName}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{item.origin || "Sin origen"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-500">Disponible</p>
                <p className="font-bold text-amber-700">{item.availableGreen} kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-500">Tostado</p>
                <p className="font-bold text-green-700">{item.totalRoasted} kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-500">Ingresado</p>
                <p className="font-bold text-gray-700">{item.totalGreenIn} kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-500">Usado</p>
                <p className="font-bold text-gray-700">{item.totalGreenUsed} kg</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
