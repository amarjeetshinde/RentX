import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import EquipmentCard from '../components/ui/EquipmentCard'
import {
  Search,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  PackageOpen,
  Camera,
  Laptop,
  Monitor,
  Cpu,
  Mic,
  Bike,
  Boxes,
  Plus,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const CATEGORIES = [
  { id: 'all', label: 'All Equipment', icon: Boxes },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'projectors', label: 'Projectors', icon: Monitor },
  { id: 'electronics', label: 'Electronics', icon: Cpu },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'sports', label: 'Sports', icon: Bike },
]

export default function BrowseEquipmentPage() {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'price-asc' | 'price-desc'

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Query approved and available equipment with owner profile join
      let { data, error } = await supabase
        .from('equipment')
        .select(`
          id,
          owner_id,
          name,
          description,
          category,
          brand,
          daily_price,
          security_deposit,
          location,
          image_url,
          availability_status,
          approval_status,
          created_at,
          profiles!owner_id (
            full_name,
            avatar_url
          )
        `)
        .eq('approval_status', 'approved')
        .eq('availability_status', 'available')
        .order('created_at', { ascending: false })

      // 2. Fallback to direct select if PostgREST relation cache hasn't resolved
      if (error) {
        console.warn('[BrowseEquipment] Embedded join error, falling back to direct select:', error.message)
        const fallback = await supabase
          .from('equipment')
          .select(`
            id,
            owner_id,
            name,
            description,
            category,
            brand,
            daily_price,
            security_deposit,
            location,
            image_url,
            availability_status,
            approval_status,
            created_at
          `)
          .eq('approval_status', 'approved')
          .eq('availability_status', 'available')
          .order('created_at', { ascending: false })

        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      setEquipment(data || [])
    } catch (err) {
      console.error('[BrowseEquipment] Fetch error:', err)
      setErrorMsg(err.message || 'Failed to load equipment catalog.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Filter and Sort in memory
  const filteredEquipment = useMemo(() => {
    return equipment
      .filter((item) => {
        // Enforce approved and available listings only in public catalog
        if (item.approval_status !== 'approved' || item.availability_status !== 'available') {
          return false
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category?.toLowerCase() !== selectedCategory) {
          return false
        }

        // Search keyword filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase()
          const matchesName = item.name?.toLowerCase().includes(q)
          const matchesDesc = item.description?.toLowerCase().includes(q)
          const matchesBrand = item.brand?.toLowerCase().includes(q)
          const matchesLoc = item.location?.toLowerCase().includes(q)
          return matchesName || matchesDesc || matchesBrand || matchesLoc
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return parseFloat(a.daily_price) - parseFloat(b.daily_price)
        }
        if (sortBy === 'price-desc') {
          return parseFloat(b.daily_price) - parseFloat(a.daily_price)
        }
        // default: newest
        return new Date(b.created_at) - new Date(a.created_at)
      })
  }, [equipment, selectedCategory, searchTerm, sortBy])

  return (
    <div className="section-container py-10">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <span className="badge badge-sky mb-2">Live Marketplace</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900">
          Browse Equipment Catalog
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore and rent verified equipment directly from student owners, institutions, and labs.
        </p>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="card p-4 sm:p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by equipment name, brand, specs, or campus..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="newest">Newest Listings</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <button
              onClick={fetchEquipment}
              disabled={loading}
              className="btn-ghost text-xs p-2.5 text-slate-500 border border-slate-200"
              title="Refresh listings"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-3 border-t border-slate-100 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }
                `}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* ── Content Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-80 animate-pulse bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="card p-12 text-center border-dashed">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <PackageOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-navy-900 mb-1">
            {searchTerm || selectedCategory !== 'all'
              ? 'No matching equipment found'
              : 'No equipment listed yet'}
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search terms or clearing category filters.'
              : 'Be the first equipment owner to list cameras, laptops, or electronics on RentX!'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="btn-secondary text-xs py-2 px-4"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/dashboard/owner"
              className="btn-primary text-xs py-2 px-4"
            >
              <Plus size={14} />
              <span>List Your Equipment</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
            <span>
              Showing <strong className="text-navy-900">{filteredEquipment.length}</strong> verified equipment listings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
