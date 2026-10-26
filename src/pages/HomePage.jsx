import HeroSection from '../components/ui/HeroSection'
import CategoriesSection from '../components/ui/CategoriesSection'
import FeaturedEquipmentSection from '../components/ui/FeaturedEquipmentSection'
import HowItWorksSection from '../components/ui/HowItWorksSection'
import CTASection from '../components/ui/CTASection'

/**
 * HomePage — the public landing page of RentX.
 * Composed from individual section components for easy maintenance.
 *
 * Phase 1: uses demo data only (no Supabase calls).
 * Phase 2: HeroSection search and FeaturedEquipmentSection will be
 *           wired to real Supabase queries.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedEquipmentSection />
      <HowItWorksSection />
      <CTASection />
    </>
  )
}
