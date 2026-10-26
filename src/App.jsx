import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import BrowseEquipmentPage from './pages/BrowseEquipmentPage'
import EquipmentDetailPage from './pages/EquipmentDetailPage'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'
import OwnerDashboard from './pages/dashboard/OwnerDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import DashboardRedirect from './pages/dashboard/DashboardRedirect'
import NotFoundPage from './pages/NotFoundPage'
import PlaceholderPage from './pages/PlaceholderPage'

/**
 * App — Root router and application state setup.
 *
 * Route structure (Phase 4: Equipment Management System):
 *   Public Routes:
 *     /                  → HomePage
 *     /equipment         → Live Equipment Catalog (Browse, Search, Filter)
 *     /equipment/:id     → Detailed Equipment View
 *     /how-it-works      → How It Works
 *     /login             → Responsive Login page
 *     /signup            → Responsive Signup page (Customer & Owner)
 *
 *   Protected Routes (Requires Supabase Auth):
 *     /dashboard         → Auto-redirects to verified role dashboard
 *     /dashboard/customer→ Customer Dashboard
 *     /dashboard/owner   → Equipment Owner Hub (Add, Edit, Delete, Manage)
 *     /list-equipment    → Direct access to Owner Hub
 *     /dashboard/admin   → Privileged Administrator Console (Approvals & Roles)
 *
 *   Fallbacks:
 *     *                  → 404 NotFoundPage
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Marketplace Routes ── */}
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/equipment"
            element={
              <MainLayout>
                <BrowseEquipmentPage />
              </MainLayout>
            }
          />
          <Route
            path="/equipment/:id"
            element={
              <MainLayout>
                <EquipmentDetailPage />
              </MainLayout>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <MainLayout>
                <PlaceholderPage title="How RentX Works" />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <MainLayout>
                <LoginPage />
              </MainLayout>
            }
          />
          <Route
            path="/signup"
            element={
              <MainLayout>
                <SignUpPage />
              </MainLayout>
            }
          />

          {/* ── Protected Dashboard Routes ── */}
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* Customer Dashboard: accessible by customers & admins */}
          <Route
            path="/dashboard/customer"
            element={
              <MainLayout>
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* Equipment Owner Dashboard: accessible by owners & admins */}
          <Route
            path="/dashboard/owner"
            element={
              <MainLayout>
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* Direct Listing shortcut: maps to Owner Dashboard */}
          <Route
            path="/list-equipment"
            element={
              <MainLayout>
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* Admin Console: strictly restricted to verified database admins */}
          <Route
            path="/dashboard/admin"
            element={
              <MainLayout>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* ── 404 Route ── */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
