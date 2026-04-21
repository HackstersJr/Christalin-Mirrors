import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhatWeDo from './components/WhatWeDo'
import Partnerships from './components/Partnerships'
import WhyChooseUs from './components/WhyChooseUs'
import Contact from './components/Contact'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Admin
import { initializeStore } from './admin/data/store'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/pages/Dashboard'
import Appointments from './admin/pages/Appointments'
import Clients from './admin/pages/Clients'
import ClientDetail from './admin/pages/ClientDetail'
import AdminServices from './admin/pages/Services'
import Staff from './admin/pages/Staff'
import Settings from './admin/pages/Settings'
import Billing from './admin/pages/Billing'
import { InvoiceList, InvoiceDetail } from './admin/pages/Invoices'
import Inventory from './admin/pages/Inventory'
import Calendar from './admin/pages/Calendar'
import Login from './admin/pages/Login'
import ProtectedRoute from './admin/components/ProtectedRoute'

// Initialize admin store with mock data on first load
initializeStore()

// Run: npm install @tanstack/react-query
// Pages will be migrated to useQuery hooks when backend is connected
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function LandingPage() {
    const { theme, toggleTheme } = useTheme()
    const [isLoading, setIsLoading] = useState(true)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 120)
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <>
            <AnimatePresence>
                {isLoading && <LoadingScreen key="loader" />}
            </AnimatePresence>

            <Navbar theme={theme} toggleTheme={toggleTheme} isAppLoading={isLoading} scrolled={scrolled} />
            <main>
                <Hero isAppLoading={isLoading} isScrolled={scrolled} />
                <WhatWeDo />
                <Partnerships />
                <WhyChooseUs />
                <Contact />
            </main>
            <Footer />
        </>
    )
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={
                <QueryClientProvider client={queryClient}>
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                </QueryClientProvider>
            }>
                <Route index element={<Dashboard />} />
                <Route path="billing" element={<Billing />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:clientId" element={<ClientDetail />} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/:invoiceId" element={<InvoiceDetail />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="staff" element={<Staff />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    )
}
