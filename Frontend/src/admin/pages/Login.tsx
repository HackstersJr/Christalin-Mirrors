import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore, mockAdminUsers } from '../data/authStore'
import cmLogo from '../../assets/cm-logo-white.png'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const [submitting, setSubmitting] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            const session = await authStore.login(email, password)
            if (!session) {
                setError('Invalid email or password.')
                return
            }
            navigate('/admin')
        } catch {
            setError('Could not sign in. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <img src={cmLogo} alt="Christalin Mirrors" className="login-logo-img" />
                    <p className="login-eyebrow">Admin Portal</p>
                    <h2><span>Christalin</span><span>Mirrors</span></h2>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@christalinmirrors.com"
                        />
                    </div>

                    <div className="login-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-submit" disabled={submitting}>
                        {submitting ? 'Signing In…' : 'Sign In'}
                    </button>
                </form>

                <div className="login-demo">
                    <p className="login-demo-title">Demo Accounts</p>
                    {mockAdminUsers.map((u) => (
                        <button
                            type="button"
                            key={u.email}
                            className="login-demo-row"
                            onClick={() => { setEmail(u.email); setPassword(u.password); setError('') }}
                        >
                            <span className="login-demo-role">{u.role}{u.branch ? ` · ${u.branch}` : ' · all branches'}</span>
                            <span className="login-demo-email">{u.email}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
