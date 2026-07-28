import { useEffect, useState } from "react";
import { api, EntryWithVariety, BatchWithVariety, Variety } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Reports() {
  const [entries, setEntries] = useState<EntryWithVariety[]>([]);
  const [batches, setBatches] = useState<BatchWithVariety[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ varietyId: 0, from: "", to: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.varietyId) params.varietyId = filters.varietyId;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const [e, b, v] = await Promise.all([
        api.entries.list(params),
        api.batches.list(params),
        api.varieties.list(),
      ]);
      setEntries(e);
      setBatches(b);
      setVarieties(v);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(load, [filters.varietyId, filters.from, filters.to]);

  const exportCSV = () => {
    const rows: string[][] = [
      ["Tipo", "Fecha", "Variedad", "Kilos Verde", "Kilos Tostado", "Merma (kg)", "Merma %", "Proveedor/Notas", "Notas"],
    ];
    entries.forEach((e) => rows.push([
      "Ingreso", e.entryDate, e.varietyName || "", String(e.kilos), "", "", "", e.supplier || "", e.notes || "",
    ]));
    batches.forEach((b) => rows.push([
      "Tostado", b.batchDate, b.varietyName || "", String(b.greenKilos), String(b.roastedKilos),
      String(b.mermaKg), String(b.mermaPct) + "%", "", b.notes || "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-tostaduria-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  const combined = [
    ...entries.map((e) => ({ ...e, type: "Ingreso" as const })),
    ...batches.map((b) => ({ ...b, type: "Tostado" as const })),
  ].sort((a, b) => new Date(b.type === "Ingreso" ? b.entryDate : b.batchDate).getTime() - new Date(a.type === "Ingreso" ? a.entryDate : a.batchDate).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
        <button onClick={exportCSV} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          Exportar CSV
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variedad</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={filters.varietyId}
              onChange={(e) => setFilters({ ...filters, varietyId: Number(e.target.value) })}
            >
              <option value="0">Todas</option>
              {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Variedad</th>
                <th className="text-right p-3 font-medium">Verde (kg)</th>
                <th className="text-right p-3 font-medium">Tostado (kg)</th>
                <th className="text-right p-3 font-medium">Merma (kg)</th>
                <th className="text-right p-3 font-medium">Merma %</th>
                <th className="text-left p-3 font-medium">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {combined.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-gray-400">Sin datos en el período seleccionado</td></tr>
              )}
              {combined.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === "Ingreso" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{item.type === "Ingreso" ? (item as EntryWithVariety).entryDate : (item as BatchWithVariety).batchDate}</td>
                  <td className="p-3 font-medium text-gray-900">{item.varietyName || "—"}</td>
                  <td className="p-3 text-right">{item.type === "Ingreso" ? (item as EntryWithVariety).kilos : (item as BatchWithVariety).greenKilos}</td>
                  <td className="p-3 text-right">{item.type === "Tostado" ? (item as BatchWithVariety).roastedKilos : "—"}</td>
                  <td className="p-3 text-right text-red-600">{item.type === "Tostado" ? (item as BatchWithVariety).mermaKg : "—"}</td>
                  <td className="p-3 text-right text-red-600">{item.type === "Tostado" ? (item as BatchWithVariety).mermaPct + "%" : "—"}</td>
                  <td className="p-3 text-gray-500 text-sm max-w-xs truncate">
                    {item.type === "Ingreso"
                      ? ((item as EntryWithVariety).supplier || "") + ((item as EntryWithVariety).notes ? " - " + (item as EntryWithVariety).notes : "")
                      : (item as BatchWithVariety).notes || ""
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}