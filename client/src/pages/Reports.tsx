import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { api, EntryWithVariety, BatchWithVariety, Variety } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Reports() {
  const [entries, setEntries] = useState<EntryWithVariety[]>([]);
  const [batches, setBatches] = useState<BatchWithVariety[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ varietyId: 0, from: "", to: "" });

  const load = useCallback(async () => {
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
  }, [filters.varietyId, filters.from, filters.to]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const consRows: (string | number)[][] = [
      ["Tipo", "Fecha", "Variedad", "Kilos Verde", "Kilos Tostado", "Merma (kg)", "Merma (%)", "Detalles"],
    ];
    combined.forEach((item) => {
      const isEntry = item.type === "Ingreso";
      const entry = item as EntryWithVariety;
      const batch = item as BatchWithVariety;
      consRows.push([
        isEntry ? "Ingreso" : "Tostado",
        isEntry ? entry.entryDate : batch.batchDate,
        item.varietyName || "",
        isEntry ? entry.kilos : batch.greenKilos,
        isEntry ? "" : batch.roastedKilos,
        isEntry ? "" : batch.mermaKg,
        isEntry ? "" : `${batch.mermaPct}%`,
        isEntry
          ? [entry.supplier, entry.notes].filter(Boolean).join(" - ")
          : (batch.notes || ""),
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(consRows), "Consolidado");

    const entryRows: (string | number)[][] = [
      ["Fecha", "Variedad", "Kilos (kg)", "Proveedor", "Notas"],
    ];
    entries.forEach((e) => {
      entryRows.push([e.entryDate, e.varietyName || "", e.kilos, e.supplier || "", e.notes || ""]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entryRows), "Ingresos");

    const batchRows: (string | number)[][] = [
      ["Fecha", "Variedad", "Verde (kg)", "Tostado (kg)", "Merma (kg)", "Merma (%)", "Notas"],
    ];
    batches.forEach((b) => {
      batchRows.push([b.batchDate, b.varietyName || "", b.greenKilos, b.roastedKilos, b.mermaKg, `${b.mermaPct}%`, b.notes || ""]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(batchRows), "Tostado");

    const totalGreenIn = entries.reduce((s, e) => s + e.kilos, 0);
    const totalGreenUsed = batches.reduce((s, b) => s + b.greenKilos, 0);
    const totalRoasted = batches.reduce((s, b) => s + b.roastedKilos, 0);
    const totalMermaKg = Math.round((totalGreenUsed - totalRoasted) * 100) / 100;
    const totalMermaPct = totalGreenUsed > 0 ? Math.round(((totalGreenUsed - totalRoasted) / totalGreenUsed) * 10000) / 100 : 0;

    const resRows: (string | number)[][] = [
      ["RESUMEN GENERAL"],
      ["Métrica", "Valor"],
      ["Total Café Verde Ingresado", totalGreenIn],
      ["Total Café Verde Usado", totalGreenUsed],
      ["Total Café Tostado Obtenido", totalRoasted],
      ["Merma Total (kg)", totalMermaKg],
      ["Merma Promedio (%)", totalMermaPct],
      [""],
      ["DESGLOSE POR VARIEDAD"],
      ["Variedad", "Verde Ingresado", "Verde Usado", "Disponible", "Tostado", "Merma (kg)", "Merma (%)"],
    ];

    const varietyMap = new Map(varieties.map((v) => [v.id, v.name]));
    const byVariety: Record<number, { greenIn: number; greenUsed: number; roasted: number }> = {};
    entries.forEach((e) => {
      if (!byVariety[e.varietyId]) byVariety[e.varietyId] = { greenIn: 0, greenUsed: 0, roasted: 0 };
      byVariety[e.varietyId].greenIn += e.kilos;
    });
    batches.forEach((b) => {
      if (!byVariety[b.varietyId]) byVariety[b.varietyId] = { greenIn: 0, greenUsed: 0, roasted: 0 };
      byVariety[b.varietyId].greenUsed += b.greenKilos;
      byVariety[b.varietyId].roasted += b.roastedKilos;
    });

    Object.entries(byVariety).forEach(([id, data]) => {
      const name = varietyMap.get(Number(id)) || "Desconocida";
      const available = Math.round((data.greenIn - data.greenUsed) * 100) / 100;
      const mermaKg = Math.round((data.greenUsed - data.roasted) * 100) / 100;
      const mermaPct = data.greenUsed > 0 ? Math.round(((data.greenUsed - data.roasted) / data.greenUsed) * 10000) / 100 : 0;
      resRows.push([name, data.greenIn, data.greenUsed, available, data.roasted, mermaKg, `${mermaPct}%`]);
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resRows), "Resumen");

    XLSX.writeFile(wb, `reporte-tostaduria-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportCSV = () => {
    const rows: string[][] = [
      ["Tipo", "Fecha", "Variedad", "Kilos Verde", "Kilos Tostado", "Merma (kg)", "Merma %", "Detalles"],
    ];
    combined.forEach((item) => {
      const isEntry = item.type === "Ingreso";
      const entry = item as EntryWithVariety;
      const batch = item as BatchWithVariety;
      rows.push([
        isEntry ? "Ingreso" : "Tostado",
        isEntry ? entry.entryDate : batch.batchDate,
        item.varietyName || "",
        isEntry ? String(entry.kilos) : String(batch.greenKilos),
        isEntry ? "" : String(batch.roastedKilos),
        isEntry ? "" : String(batch.mermaKg),
        isEntry ? "" : `${batch.mermaPct}%`,
        isEntry
          ? [entry.supplier, entry.notes].filter(Boolean).join(" - ")
          : (batch.notes || ""),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-tostaduria-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <LoadingSpinner />;

  const combined = [
    ...entries.map((e) => ({ ...e, type: "Ingreso" as const })),
    ...batches.map((b) => ({ ...b, type: "Tostado" as const })),
  ].sort((a, b) => {
    const da = a.type === "Ingreso" ? (a as EntryWithVariety).entryDate : (a as BatchWithVariety).batchDate;
    const db = b.type === "Ingreso" ? (b as EntryWithVariety).entryDate : (b as BatchWithVariety).batchDate;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Exportar CSV
          </button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Exportar Excel
          </button>
        </div>
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