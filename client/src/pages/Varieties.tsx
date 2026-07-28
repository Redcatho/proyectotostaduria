import { useEffect, useState } from "react";
import { api, Variety, VarietyInput } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Varieties() {
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Variety | null>(null);
  const [form, setForm] = useState<VarietyInput>({ name: "", origin: "", notes: "" });

  const load = () => {
    setLoading(true);
    api.varieties.list()
      .then(setVarieties)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", origin: "", notes: "" });
    setShowForm(true);
  };

  const openEdit = (v: Variety) => {
    setEditing(v);
    setForm({ name: v.name, origin: v.origin || "", notes: v.notes || "" });
    setShowForm(true);
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
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta variedad?")) return;
    try {
      await api.varieties.delete(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Variedades de Café</h2>
        <button onClick={openCreate} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          + Nueva Variedad
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

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
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Sin variedades registradas</td></tr>
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

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editing ? "Editar Variedad" : "Nueva Variedad"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text" required
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  placeholder="Ej: Colombia, Etiopía..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">
                  {editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}