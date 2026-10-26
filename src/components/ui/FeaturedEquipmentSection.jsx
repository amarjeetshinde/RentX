import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import EquipmentCard from './EquipmentCard'
import { DEMO_EQUIPMENT } from '../../data/demoData'
import { supabase } from '../../lib/supabaseClient'

export default function FeaturedEquipmentSection() {
  const [liveEquipment, setLiveEquipment] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeatured() {
      try {
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
          .limit(6)

        if (error) {
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
            .limit(6)
          data = fallback.data
        }

        if (data && data.length > 0) {
          setLiveEquipment(data)
        }
      } catch (err) {
        console.warn('Could not load live featured equipment:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFeatured()
  }, [])

  const displayItems = liveEquipment.length > 0 ? liveEquipment : DEMO_EQUIPMENT
  const isLive = liveEquipment.length > 0

  return (
    <section
      id="featured-equipment-section"
      className="py-20 bg-white"
      aria-labelledby="featured-heading"
    >
      <div className="section-container">
        {/* ── Section header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 mb-3">
              <Sparkles size={13} className="text-sky-500" />
              <span>{isLive ? 'Live Equipment Listings' : 'Featured Listings'}</span>
            </span>
            <h2
              id="featured-heading"
              className="text-3xl sm:text-4xl font-extrabold text-navy-900"
            >
              Popular Right Now
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Hand-picked equipment from verified owners across colleges and labs.
            </p>
          </div>
          <Link
            to="/equipment"
            id="view-all-equipment-link"
            className="btn-ghost text-sky-600 hover:text-sky-700 hover:bg-sky-50 shrink-0 self-start sm:self-auto text-sm"
          >
            View All Equipment
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Equipment grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-80 animate-pulse bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="text-center mt-12">
          <Link
            to="/equipment"
            id="featured-browse-more-btn"
            className="btn-primary inline-flex text-sm py-2.5 px-6"
          >
            Explore Complete Equipment Catalog
            <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            Real-time availability, secure deposits, and direct owner contact
          </p>
        </div>
      </div>
    </section>
  )
}
