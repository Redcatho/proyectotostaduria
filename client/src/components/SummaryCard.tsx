interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function SummaryCard({ title, value, subtitle, color = "bg-white" }: Props) {
  return (
    <div className={`${color} rounded-xl shadow-sm border border-gray-200 p-5`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}