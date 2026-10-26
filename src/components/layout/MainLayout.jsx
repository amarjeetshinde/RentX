import Navbar from './Navbar'
import Footer from './Footer'

/**
 * MainLayout wraps every public-facing page with the
 * shared Navbar and Footer. Pages are injected via {children}.
 *
 * Usage:
 *   <MainLayout>
 *     <YourPage />
 *   </MainLayout>
 */
export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* pt-16 offsets the fixed navbar height */}
      <main className="flex-1 pt-16" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
