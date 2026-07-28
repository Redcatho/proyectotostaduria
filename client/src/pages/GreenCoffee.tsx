import { useEffect, useState } from "react";
import { api, EntryWithVariety, EntryInput, Variety } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function GreenCoffee() {
  const [entries, setEntries] = useState<EntryWithVariety[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EntryInput>({ varietyId: 0, kilos: 0, supplier: "", entryDate: new Date().toISOString().split("T")[0], notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [e, v] = await Promise.all([api.entries.list(), api.varieties.list()]);
      setEntries(e);
      setVarieties(v);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.varietyId || !form.kilos || !form.entryDate) return;
    try {
      await api.entries.create(form);
      setShowForm(false);
      setForm({ varietyId: 0, kilos: 0, supplier: "", entryDate: new Date().toISOString().split("T")[0], notes: "" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este ingreso?")) return;
    try {
      await api.entries.delete(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Ingresos de Café Verde</h2>
        <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          + Nuevo Ingreso
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="text-left p-3 font-medium">Variedad</th>
              <th className="text-right p-3 font-medium">Kilos</th>
              <th className="text-left p-3 font-medium">Proveedor</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Notas</th>
              <th className="text-right p-3 font-medium w-24">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Sin ingresos registrados</td></tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-600">{entry.entryDate}</td>
                <td className="p-3 font-medium text-gray-900">{entry.varietyName || "—"}</td>
                <td className="p-3 text-right font-medium">{entry.kilos} kg</td>
                <td className="p-3 text-gray-500">{entry.supplier || "—"}</td>
                <td className="p-3 text-gray-400 max-w-xs truncate hidden md:table-cell">{entry.notes || "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nuevo Ingreso de Café Verde</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilos *</label>
                <input
                  type="number" required min="0" step="0.01"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.kilos}
                  onChange={(e) => setForm({ ...form, kilos: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date" required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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