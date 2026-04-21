import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Calendar, Users, Scissors,
    UserCog, Settings, Menu, X, ArrowLeft, LogOut,
    FileText, Package, CalendarDays, Receipt,
    Sun, Moon
} from 'lucide-react'
import { ToastProvider } from './components/Toast'
import './AdminLayout.css'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Billing', icon: Receipt, path: '/admin/billing' },
    { label: 'Calendar', icon: CalendarDays, path: '/admin/calendar' },
    { label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
    { label: 'Clients', icon: Users, path: '/admin/clients' },
    { label: 'Invoices', icon: FileText, path: '/admin/invoices' },
    { label: 'Services', icon: Scissors, path: '/admin/services' },
    { label: 'Staff', icon: UserCog, path: '/admin/staff' },
    { label: 'Inventory', icon: Package, path: '/admin/inventory' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('adminTheme') as 'dark' | 'light') || 'dark'
    })
    const navigate = useNavigate()

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
                        <span className="admin-brand-name">CM</span>
                        <span className="admin-brand-sub">Admin Panel</span>
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
                    <button className="admin-nav-link logout" onClick={() => navigate('/')}>
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
                    <div className="admin-topbar-title">Sun Pro Sports Academy</div>
                    <div className="admin-topbar-user">
                        <button 
                            onClick={toggleTheme} 
                            className="admin-btn admin-btn-ghost" 
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <div className="admin-avatar">SC</div>
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
