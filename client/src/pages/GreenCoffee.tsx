import { useEffect, useState, useCallback } from "react";
import { api, EntryWithVariety, Variety, GreenLot, Mesh } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

type FormState = { varietyId: number; kilos: string; supplier: string; entryDate: string; notes: string };
type MallaForm = { m18: string; m16: string; m14: string; waste: string; notes: string };

const MESH_LABELS: Record<Mesh, string> = {
  "18": "Malla 18",
  "16": "Malla 16",
  "14": "Malla 14",
  desperdicio: "Desperdicio",
};

const initialForm = (): FormState => ({
  varietyId: 0,
  kilos: "",
  supplier: "",
  entryDate: new Date().toISOString().split("T")[0],
  notes: "",
});

const initialMalla = (): MallaForm => ({ m18: "", m16: "", m14: "", waste: "", notes: "" });

export default function GreenCoffee() {
  const [entries, setEntries] = useState<EntryWithVariety[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [lots, setLots] = useState<GreenLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [mallaEntry, setMallaEntry] = useState<EntryWithVariety | null>(null);
  const [mallaForm, setMallaForm] = useState<MallaForm>(initialMalla);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, v, l] = await Promise.all([api.entries.list(), api.varieties.list(), api.lots.list()]);
      setEntries(e);
      setVarieties(v);
      setLots(l);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.varietyId || !form.kilos.trim() || !form.entryDate) return;
    try {
      await api.entries.create({ ...form, kilos: Number(form.kilos) });
      setShowForm(false);
      setForm(initialForm());
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este ingreso? Se borrarán también sus mallas.")) return;
    try {
      await api.entries.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openMallas = (entry: EntryWithVariety) => {
    const existing = lots.filter((l) => l.entryId === entry.id);
    const getKilos = (mesh: Mesh) => {
      const lot = existing.find((l) => l.mesh === mesh);
      return lot ? String(lot.kilos) : "";
    };
    setMallaForm({
      m18: getKilos("18"),
      m16: getKilos("16"),
      m14: getKilos("14"),
      waste: getKilos("desperdicio"),
      notes: entry.splitNotes || "",
    });
    setMallaEntry(entry);
  };

  const handleMallasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mallaEntry) return;
    const lotsToSave: { mesh: Mesh; kilos: number }[] = [];
    const m18 = Number(mallaForm.m18);
    const m16 = Number(mallaForm.m16);
    const m14 = Number(mallaForm.m14);
    const waste = Number(mallaForm.waste);
    if (m18 > 0) lotsToSave.push({ mesh: "18", kilos: m18 });
    if (m16 > 0) lotsToSave.push({ mesh: "16", kilos: m16 });
    if (m14 > 0) lotsToSave.push({ mesh: "14", kilos: m14 });
    if (waste > 0) lotsToSave.push({ mesh: "desperdicio", kilos: waste });
    if (lotsToSave.length === 0) {
      setError("Ingresa al menos el peso de una malla");
      return;
    }
    try {
      await api.lots.createBatch({
        entryId: mallaEntry.id,
        lots: lotsToSave,
        notes: mallaForm.notes.trim() || undefined,
      });
      setMallaEntry(null);
      setError("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLotDelete = async (lot: GreenLot) => {
    if (!confirm(`¿Eliminar la malla ${MESH_LABELS[lot.mesh]} de ${lot.kilos} kg?`)) return;
    try {
      await api.lots.delete(lot.id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  const lotsByEntry = new Map<number, GreenLot[]>();
  lots.forEach((l) => {
    const arr = lotsByEntry.get(l.entryId) || [];
    arr.push(l);
    lotsByEntry.set(l.entryId, arr);
  });

  const enteredSum = [mallaForm.m18, mallaForm.m16, mallaForm.m14, mallaForm.waste]
    .reduce((s, v) => s + (Number(v) || 0), 0);
  const sumMismatch = mallaEntry && enteredSum > 0 && Math.round(enteredSum * 100) / 100 !== Math.round(mallaEntry.kilos * 100) / 100;

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
              <th className="text-left p-3 font-medium">Mallas</th>
              <th className="text-right p-3 font-medium w-24">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Sin ingresos registrados</td></tr>
            )}
            {entries.map((entry) => {
              const entryLots = lotsByEntry.get(entry.id) || [];
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{entry.entryDate}</td>
                  <td className="p-3 font-medium text-gray-900">{entry.varietyName || "—"}</td>
                  <td className="p-3 text-right font-medium">{entry.kilos} kg</td>
                  <td className="p-3">
                    {entryLots.length === 0 ? (
                      <span className="text-xs text-gray-400">Sin dividir</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entryLots.map((lot) => (
                          <span key={lot.id} className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-full px-2 py-0.5 text-xs">
                            {MESH_LABELS[lot.mesh]}: {lot.kilos} kg
                            <button
                              onClick={() => handleLotDelete(lot)}
                              className="text-red-400 hover:text-red-600 font-bold leading-none"
                              title="Eliminar malla"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {entry.splitNotes && (
                          <span className="text-xs text-amber-700 italic" title={entry.splitNotes}>
                            ⚠ {entry.splitNotes}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openMallas(entry)} className="text-amber-600 hover:text-amber-800 text-xs font-medium">
                      Dividir en mallas
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                  </td>
                </tr>
              );
            })}
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
                  onChange={(e) => setForm({ ...form, kilos: e.target.value })}
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

      {mallaEntry && (
        <div className="modal-overlay" onClick={() => setMallaEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Dividir en Mallas</h3>
            <p className="text-sm text-gray-500 mb-4">
              {mallaEntry.varietyName || "Variedad"} — Total del ingreso: <strong>{mallaEntry.kilos} kg</strong>
            </p>
            <form onSubmit={handleMallasSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malla 18 (kg)</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mallaForm.m18}
                    onChange={(e) => setMallaForm({ ...mallaForm, m18: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malla 16 (kg)</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mallaForm.m16}
                    onChange={(e) => setMallaForm({ ...mallaForm, m16: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Malla 14 (kg)</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mallaForm.m14}
                    onChange={(e) => setMallaForm({ ...mallaForm, m14: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desperdicio (kg)</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    value={mallaForm.waste}
                    onChange={(e) => setMallaForm({ ...mallaForm, waste: e.target.value })}
                  />
                </div>
              </div>

              {sumMismatch && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm">
                  La suma de mallas ({Math.round(enteredSum * 100) / 100} kg) no coincide con el total del ingreso ({mallaEntry.kilos} kg). Puedes guardar y explicar en la nota.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (por qué no coinciden)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={2}
                  value={mallaForm.notes}
                  onChange={(e) => setMallaForm({ ...mallaForm, notes: e.target.value })}
                  placeholder="Ej: 3 kg de grano partido sin pesar"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMallaEntry(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">Guardar Mallas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
