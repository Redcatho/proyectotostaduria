import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/variedades", label: "Variedades", icon: "🫘" },
  { path: "/ingresos", label: "Ingresos", icon: "📥" },
  { path: "/tostado", label: "Tostado", icon: "🔥" },
  { path: "/inventario", label: "Inventario", icon: "📦" },
  { path: "/reportes", label: "Reportes", icon: "📋" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-stone-900 text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-stone-700">
        <h1 className="text-lg font-bold tracking-tight">Tostaduría</h1>
        <p className="text-xs text-stone-400 mt-0.5">Control de Inventario</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-amber-600 text-white font-medium"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}