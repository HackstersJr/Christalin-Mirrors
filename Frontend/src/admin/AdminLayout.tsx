import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Calendar, Users, Scissors,
    UserCog, Settings, Menu, X, ArrowLeft, LogOut,
    FileText, CalendarDays, Receipt, UserCheck,
    Sun, Moon
} from 'lucide-react'
import { ToastProvider } from './components/Toast'
import { authStore } from './data/authStore'
import cmLogo from '../assets/cm-logo-white.png'
import './AdminLayout.css'

function initials(name: string) {
    const parts = name.trim().split(/\s+/)
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'CM'
}

// Staff-facing operations. Services & Settings are configuration —
// owner-only, managed via the IT/owner login rather than the branch panel.
const baseNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Billing', icon: Receipt, path: '/admin/billing' },
    { label: 'Calendar', icon: CalendarDays, path: '/admin/calendar' },
    { label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
    { label: 'Clients', icon: Users, path: '/admin/clients' },
    { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
    { label: 'Staff', icon: UserCog, path: '/admin/staff' },
    { label: 'Attendance', icon: UserCheck, path: '/admin/attendance' },
]

// Receptionist front-desk scope — Dashboard is a lighter view (no
// financials), and Staff management stays with Owner/Manager.
const receptionistNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
    { label: 'Clients', icon: Users, path: '/admin/clients' },
    { label: 'Billing', icon: Receipt, path: '/admin/billing' },
    { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
    { label: 'Calendar', icon: CalendarDays, path: '/admin/calendar' },
]

const ownerOnlyNavItems = [
    { label: 'Services', icon: Scissors, path: '/admin/services' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('adminTheme') as 'dark' | 'light') || 'light'
    })
    const navigate = useNavigate()
    const session = authStore.getSession()
    const navItems = session?.role === 'owner'
        ? [...baseNavItems, ...ownerOnlyNavItems]
        : session?.role === 'receptionist'
            ? receptionistNavItems
            : baseNavItems

    const handleLogout = () => {
        authStore.logout()
        navigate('/admin/login')
    }

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('adminTheme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-brand">
                        <img src={cmLogo} alt="Christalin Mirrors" className="admin-brand-logo" />
                        <span className="admin-brand-sub">
                            {session?.branch ? `${session.branch} Branch` : 'Admin Panel'}
                        </span>
                    </div>
                    <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="admin-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-nav-link" onClick={() => navigate('/')}>
                        <ArrowLeft size={18} />
                        <span>Back to Website</span>
                    </button>
                    <button className="admin-nav-link logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <div className="admin-topbar-title">
                        Christalin Mirrors
                        {session?.branch && <span className="admin-topbar-branch">{session.branch}</span>}
                    </div>
                    <div className="admin-topbar-user">
                        <button
                            onClick={toggleTheme}
                            className="admin-btn admin-btn-ghost"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="admin-avatar" title={session ? `${session.name} · ${session.role}` : ''}>
                            {initials(session?.name || 'CM')}
                        </div>
                    </div>
                </header>

                <ToastProvider>
                <div className="admin-content">
                    <Outlet />
                </div>
                </ToastProvider>
            </main>
        </div>
    )
}
