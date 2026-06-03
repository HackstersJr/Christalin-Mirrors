import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Replace with real POST /api/auth/login call
        localStorage.setItem('adminToken', 'dev-token')
        navigate('/admin')
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
                    
                    <button type="submit" className="login-submit">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
