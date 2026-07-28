import { useEffect, useState, useCallback } from "react";
import { api, Variety, VarietyInput } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

const quickVarieties = [
  { name: "Colombia Supremo", origin: "Colombia" },
  { name: "Etiopía Yirgacheffe", origin: "Etiopía" },
  { name: "Brasil Santos", origin: "Brasil" },
  { name: "Guatemala Antigua", origin: "Guatemala" },
  { name: "México Chiapas", origin: "México" },
  { name: "Perú Chanchamayo", origin: "Perú" },
  { name: "Costa Rica Tarrazú", origin: "Costa Rica" },
  { name: "Nicaragua Matagalpa", origin: "Nicaragua" },
];

export default function Varieties() {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Variety | null>(null);
  const [form, setForm] = useState<VarietyInput>({ name: "", origin: "", notes: "" });

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    api.varieties.list()
      .then(setVarieties)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", origin: "", notes: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await api.varieties.update(editing.id, form);
      } else {
        await api.varieties.create(form);
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta variedad?")) return;
    try {
      await api.varieties.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (v: Variety) => {
    setEditing(v);
    setForm({ name: v.name, origin: v.origin || "", notes: v.notes || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyQuick = (v: { name: string; origin: string }) => {
    setEditing(null);
    setForm({ name: v.name, origin: v.origin, notes: "" });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Variedades de Café</h2>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {editing && (
            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              Editando: <strong>{editing.name}</strong>
              <button type="button" onClick={resetForm} className="ml-2 text-amber-600 underline text-xs">Cancelar edición</button>
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text" required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Colombia Supremo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="Ej: Colombia, Etiopía..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas opcionales"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
              {editing ? "Guardar Cambios" : "+ Agregar Variedad"}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Acceso rápido — haz clic para rellenar el formulario:</p>
          <div className="flex flex-wrap gap-2">
            {quickVarieties.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => applyQuick(v)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-700 rounded-full text-xs font-medium transition-colors border border-stone-200"
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3 font-medium">Nombre</th>
              <th className="text-left p-3 font-medium">Origen</th>
              <th className="text-left p-3 font-medium">Notas</th>
              <th className="text-right p-3 font-medium w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {varieties.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Sin variedades registradas — usa el formulario de arriba para agregar</td></tr>
            )}
            {varieties.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">{v.name}</td>
                <td className="p-3 text-gray-500">{v.origin || "—"}</td>
                <td className="p-3 text-gray-500 max-w-xs truncate">{v.notes || "—"}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openEdit(v)} className="text-amber-600 hover:text-amber-800 text-xs font-medium">Editar</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}