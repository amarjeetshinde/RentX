import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, CheckCircle, XCircle, Heart } from 'lucide-react'

const CATEGORY_GRADIENTS = {
  cameras: 'from-violet-500 to-purple-700',
  laptops: 'from-sky-500 to-blue-700',
  projectors: 'from-amber-500 to-orange-600',
  electronics: 'from-emerald-500 to-teal-700',
  audio: 'from-rose-500 to-pink-700',
  sports: 'from-teal-500 to-cyan-700',
  other: 'from-slate-500 to-slate-700',
}

const CATEGORY_EMOJI = {
  cameras: '📷',
  laptops: '💻',
  projectors: '📽️',
  electronics: '🔌',
  audio: '🎙️',
  sports: '🚴',
  other: '📦',
}

export default function EquipmentCard({ equipment }) {
  const [wishlisted, setWishlisted] = useState(false)

  // Normalize data whether it's from Supabase or demoData
  const id = equipment.id
  const name = equipment.name
  const category = (equipment.category || 'other').toLowerCase()
  const price = equipment.daily_price !== undefined ? parseFloat(equipment.daily_price) : parseFloat(equipment.pricePerDay || 0)
  const deposit = parseFloat(equipment.security_deposit || 0)
  const isAvailable = equipment.availability_status
    ? equipment.availability_status === 'available'
    : equipment.isAvailable ?? true
  const location = equipment.location || 'College Campus'
  const imageUrl = equipment.image_url || equipment.image || null
  const brand = equipment.brand || null

  // Owner information
  const ownerName = equipment.profiles?.full_name || equipment.ownerName || 'Verified Owner'
  const ownerAvatar = equipment.profiles?.full_name
    ? equipment.profiles.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : equipment.ownerAvatar || 'VO'

  const gradient = CATEGORY_GRADIENTS[category] ?? 'from-slate-500 to-slate-700'
  const emoji = CATEGORY_EMOJI[category] ?? '📦'

  return (
    <article
      id={`equipment-card-${id}`}
      className="card group flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* ── Image Banner ── */}
      <Link
        to={`/equipment/${id}`}
        className="relative h-48 overflow-hidden block bg-slate-100"
        tabIndex={-1}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-6xl select-none group-hover:scale-110 transition-transform duration-500">
              {emoji}
            </span>
          </div>
        )}

        {/* Brand Tag if available */}
        {brand && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-navy-900/80 backdrop-blur-sm text-white text-[11px] font-semibold">
            {brand}
          </span>
        )}

        {/* Wishlist toggle */}
        <button
          type="button"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setWishlisted((v) => !v)
          }}
          className="
            absolute top-3 right-3
            flex items-center justify-center w-8 h-8 rounded-full
            bg-white/90 backdrop-blur-sm shadow-sm
            hover:scale-110 transition-all duration-200
          "
        >
          <Heart
            size={14}
            className={`transition-colors ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
          />
        </button>

        {/* Availability Badge */}
        <div className="absolute bottom-3 left-3">
          {isAvailable ? (
            <span className="badge badge-available text-xs flex items-center gap-1 shadow-sm">
              <CheckCircle size={11} />
              Available
            </span>
          ) : (
            <span className="badge badge-unavailable text-xs flex items-center gap-1 shadow-sm">
              <XCircle size={11} />
              Unavailable
            </span>
          )}
        </div>
      </Link>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Category & Location */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-sky-600 capitalize">{category}</span>
          <span className="flex items-center gap-1 truncate max-w-[130px]">
            <MapPin size={11} />
            <span className="truncate">{location.split(',')[0]}</span>
          </span>
        </div>

        {/* Equipment Name */}
        <Link to={`/equipment/${id}`}>
          <h3 className="font-bold text-navy-900 text-sm leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Owner Info */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold">
            {ownerAvatar}
          </div>
          <span className="truncate">{ownerName}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <div>
            <div className="text-base font-extrabold text-navy-900">
              ₹{price.toLocaleString('en-IN')}
              <span className="text-xs text-slate-400 font-normal ml-0.5">/day</span>
            </div>
            {deposit > 0 && (
              <p className="text-[10px] text-slate-400">
                +₹{deposit.toLocaleString('en-IN')} deposit
              </p>
            )}
          </div>

          <Link
            to={`/equipment/${id}`}
            className="btn-primary text-xs py-2 px-3.5 shadow-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
