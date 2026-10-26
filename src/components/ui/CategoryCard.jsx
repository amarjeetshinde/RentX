import {
  Camera,
  Laptop,
  Monitor,
  Cpu,
  Mic,
  Bike,
  Box,
  ArrowRight,
} from 'lucide-react'

// ── Icon map (named imports only — no wildcard to avoid ESM issues) ──
const ICON_MAP = {
  Camera,
  Laptop,
  Monitor,
  Cpu,
  Mic,
  Bike,
}

export default function CategoryCard({ category, onClick }) {
  const { id, label, icon, description, count, color } = category

  const Icon = ICON_MAP[icon] ?? Box

  return (
    <button
      id={`category-card-${id}`}
      type="button"
      onClick={() => onClick?.(id)}
      className={`
        group w-full text-left p-5 rounded-2xl border
        bg-white hover:shadow-lg
        transition-all duration-250 ease-in-out
        hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-sky-500
        ${color}
      `}
      aria-label={`Browse ${label} — ${count} items available`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <ArrowRight
          size={16}
          className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 mt-1"
        />
      </div>

      <h3 className="font-semibold text-slate-900 text-sm mb-1">{label}</h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
        {description}
      </p>
      <span className="text-xs font-semibold">
        {count} items →
      </span>
    </button>
  )
}
