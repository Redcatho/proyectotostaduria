import { useEffect, useState, useCallback } from "react";
import { api, BatchWithVariety, BatchInput, Variety } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Roasting() {
  const [batches, setBatches] = useState<BatchWithVariety[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BatchInput>({ varietyId: 0, greenKilos: 0, roastedKilos: 0, batchDate: new Date().toISOString().split("T")[0], notes: "" });
  const [calculatedMerma, setCalculatedMerma] = useState({ kg: 0, pct: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, v] = await Promise.all([api.batches.list(), api.varieties.list()]);
      setBatches(b);
      setVarieties(v);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (form.greenKilos > 0) {
      const kg = Math.round((form.greenKilos - form.roastedKilos) * 100) / 100;
      const pct = Math.round((kg / form.greenKilos) * 100 * 100) / 100;
      setCalculatedMerma({ kg, pct });
    } else {
      setCalculatedMerma({ kg: 0, pct: 0 });
    }
  }, [form.greenKilos, form.roastedKilos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.varietyId || !form.greenKilos || !form.roastedKilos || !form.batchDate) return;
    try {
      await api.batches.create(form);
      setShowForm(false);
      setForm({ varietyId: 0, greenKilos: 0, roastedKilos: 0, batchDate: new Date().toISOString().split("T")[0], notes: "" });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta tanda?")) return;
    try {
      await api.batches.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Tandas de Tostado</h2>
        <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          + Nueva Tanda
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="text-left p-3 font-medium">Variedad</th>
              <th className="text-right p-3 font-medium">Verde (kg)</th>
              <th className="text-right p-3 font-medium">Tostado (kg)</th>
              <th className="text-right p-3 font-medium">Merma (kg)</th>
              <th className="text-right p-3 font-medium">Merma %</th>
              <th className="text-right p-3 font-medium w-24">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Sin tandas registradas</td></tr>
            )}
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-600">{b.batchDate}</td>
                <td className="p-3 font-medium text-gray-900">{b.varietyName || "—"}</td>
                <td className="p-3 text-right">{b.greenKilos}</td>
                <td className="p-3 text-right">{b.roastedKilos}</td>
                <td className="p-3 text-right text-red-600 font-medium">{b.mermaKg}</td>
                <td className="p-3 text-right text-red-600">{b.mermaPct}%</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nueva Tanda de Tostado</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variedad *</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.varietyId}
                  onChange={(e) => setForm({ ...form, varietyId: Number(e.target.value) })}
                >
                  <option value="0">Seleccionar...</option>
                  {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilos Verde *</label>
                  <input
                    type="number" required min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={form.greenKilos}
                    onChange={(e) => setForm({ ...form, greenKilos: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilos Tostado *</label>
                  <input
                    type="number" required min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={form.roastedKilos}
                    onChange={(e) => setForm({ ...form, roastedKilos: Number(e.target.value) })}
                  />
                </div>
              </div>

              {form.greenKilos > 0 && (
                <div className={`p-3 rounded-lg text-sm ${
                  calculatedMerma.pct > 20 ? "bg-red-50 text-red-700" : calculatedMerma.pct > 15 ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
                }`}>
                  Merma estimada: <strong>{calculatedMerma.kg} kg</strong> ({calculatedMerma.pct}%)
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date" required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.batchDate}
                  onChange={(e) => setForm({ ...form, batchDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ej: perfil de tostado, lote, etc."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}