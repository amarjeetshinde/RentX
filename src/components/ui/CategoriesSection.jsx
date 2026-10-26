import { useNavigate } from 'react-router-dom'
import CategoryCard from './CategoryCard'
import { DEMO_CATEGORIES } from '../../data/demoData'

export default function CategoriesSection() {
  const navigate = useNavigate()

  const handleCategoryClick = (categoryId) => {
    navigate(`/equipment?category=${categoryId}`)
  }

  return (
    <section
      id="categories-section"
      className="py-20 bg-slate-50"
      aria-labelledby="categories-heading"
    >
      <div className="section-container">

        {/* ── Section header ── */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 mb-3">
            Browse by Category
          </span>
          <h2
            id="categories-heading"
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3"
          >
            Find What You Need
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Explore hundreds of equipment listings across six major categories —
            from professional cameras to complete electronics lab kits.
          </p>
        </div>

        {/* ── Category grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategoryClick}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
