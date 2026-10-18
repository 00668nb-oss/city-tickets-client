import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(fullName, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h1>הרשמה</h1>
      {error && <p className="error">{error}</p>}
      <label>
        שם מלא
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} />
      </label>
      <label>
        אימייל
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label>
        סיסמה (לפחות 8 תווים)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <button disabled={busy}>{busy ? 'נרשמת...' : 'הרשמה'}</button>
      <p>
        כבר רשומה? <Link to="/login">להתחברות</Link>
      </p>
    </form>
  )
}
