import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicApi, auth, apiError } from '../../lib/api'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            const { data } = await publicApi.post('/auth/login', { email, password })
            auth.set(data.accessToken, data.user)
            navigate('/admin')
        } catch (err: any) {
            // 401 is the expected wrong-credentials path; show it plainly.
            setError(err?.response?.status === 401 ? 'Invalid email or password' : apiError(err))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <h2>Christalin Mirrors</h2>
                    <p>Admin Portal</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            autoComplete="username"
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
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#f43f5e', fontSize: 14, marginBottom: 12,
                            background: 'rgba(244,63,94,0.1)', padding: '10px 12px', borderRadius: 8,
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="login-submit" disabled={busy}>
                        {busy ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
