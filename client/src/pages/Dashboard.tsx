import { useEffect, useState } from "react";
import { api, DashboardData } from "../api";
import SummaryCard from "../components/SummaryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard.get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;
  if (!data) return null;

  const { summary, varietyStats, recentBatches, recentEntries } = data;

  const barData = varietyStats.map((v) => ({
    name: v.varietyName,
    VerdeUsado: v.totalGreenUsed,
    Tostado: v.totalRoasted,
    Merma: v.mermaKg,
  }));

  const mermaPctData = varietyStats.map((v) => ({
    name: v.varietyName,
    "Merma %": v.mermaPct,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Café Verde Ingresado" value={`${summary.totalGreenIn} kg`} />
        <SummaryCard title="Café Verde Usado" value={`${summary.totalGreenUsed} kg`} />
        <SummaryCard title="Café Tostado Obtenido" value={`${summary.totalRoasted} kg`} />
        <SummaryCard
          title="Merma Total"
          value={`${summary.mermaKg} kg`}
          subtitle={`${summary.mermaPct}%`}
          color={summary.mermaPct > 20 ? "bg-red-50" : summary.mermaPct > 15 ? "bg-yellow-50" : "bg-white"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Producción por Variedad (kg)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="VerdeUsado" fill="#d97706" name="Verde Usado" />
              <Bar dataKey="Tostado" fill="#65a30d" name="Tostado" />
              <Bar dataKey="Merma" fill="#dc2626" name="Merma" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">% Merma por Variedad</h3>
          {mermaPctData.length === 0 ? (
            <p className="text-gray-400 text-sm py-10 text-center">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mermaPctData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="Merma %" fill="#dc2626" name="Merma %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Últimos Ingresos</h3>
          {recentEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin ingresos registrados</p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((e) => (
                <div key={e.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-600">{e.varietyName || "—"}</span>
                  <span className="font-medium">{e.kilos} kg</span>
                  <span className="text-gray-400 text-xs">{e.entryDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Últimas Tandas de Tostado</h3>
          {recentBatches.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin tandas registradas</p>
          ) : (
            <div className="space-y-2">
              {recentBatches.map((b) => (
                <div key={b.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-600">{b.varietyName || "—"}</span>
                  <span className="font-medium">{b.greenKilos}kg → {b.roastedKilos}kg</span>
                  <span className="text-red-500 text-xs">-{b.mermaKg}kg</span>
                  <span className="text-gray-400 text-xs">{b.batchDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}