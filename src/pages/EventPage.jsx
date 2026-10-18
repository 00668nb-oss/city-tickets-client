import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../AuthContext.jsx'

const MAX_PER_ORDER = 10
const TICKETS_TAKEN = 'הכרטיסים נתפסו על ידי משתמשת אחרת'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })

function SessionRow({ session, loggedIn, onPurchased, onConflict }) {
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const [loadedAt] = useState(() => Date.now())
  const started = new Date(session.startsAtUtc).getTime() <= loadedAt
  const soldOut = session.seatsAvailable === 0
  const maxQuantity = Math.min(MAX_PER_ORDER, session.seatsAvailable)
  // אחרי רענון המקומות הפנויים הכמות שנבחרה עלולה לחרוג, ולכן מגבילים אותה בזמן הצגה
  const shownQuantity = Math.min(quantity, Math.max(maxQuantity, 1))

  async function buy() {
    setBusy(true)
    setMessage(null)
    try {
      await api.createOrder(session.id, shownQuantity)
      setMessage({ type: 'ok', text: `ההזמנה נקלטה: ${shownQuantity} כרטיסים.` })
      onPurchased()
    } catch (err) {
      if (err.isConflict) {
        // מישהי הקדימה אותנו: מציגים הודעה ברורה ומרעננים את המקומות הפנויים
        setMessage({ type: 'error', text: TICKETS_TAKEN })
        onConflict()
      } else {
        setMessage({ type: 'error', text: err.message })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="card session">
      <div>
        <strong>{formatDate(session.startsAtUtc)}</strong>
        <p className="muted">
          {session.location} · {session.price} ₪ לכרטיס
        </p>
        <p className={soldOut ? 'error' : ''}>
          {soldOut ? 'אזלו הכרטיסים' : `מקומות פנויים: ${session.seatsAvailable} מתוך ${session.capacity}`}
        </p>
      </div>

      {!started && !soldOut && (
        <div className="buy">
          {loggedIn ? (
            <>
              <select value={shownQuantity} onChange={(e) => setQuantity(Number(e.target.value))} disabled={busy}>
                {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button onClick={buy} disabled={busy}>
                {busy ? 'קונה...' : 'קנייה'}
              </button>
            </>
          ) : (
            <Link to="/login">יש להתחבר כדי להזמין</Link>
          )}
        </div>
      )}
      {started && <p className="muted">המועד עבר</p>}

      {message && <p className={message.type === 'ok' ? 'success' : 'error'}>{message.text}</p>}
    </li>
  )
}

export default function EventPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    return api
      .getEvent(id)
      .then((ev) => {
        setEvent(ev)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (error && !event) return <p className="error">{error}</p>
  if (!event) return <p>טוענת...</p>

  return (
    <>
      <Link to="/">← חזרה לאירועים</Link>
      <h1>{event.title}</h1>
      <p className="muted">{event.categoryName}</p>
      <p>
        {event.tags.map((t) => (
          <span key={t.id} className="tag">
            {t.name}
          </span>
        ))}
      </p>
      {event.description && <p>{event.description}</p>}

      <h2>מועדים</h2>
      {event.sessions.length === 0 && <p>אין מועדים קרובים.</p>}
      <ul className="sessions">
        {event.sessions.map((s) => (
          <SessionRow key={s.id} session={s} loggedIn={Boolean(session)} onPurchased={load} onConflict={load} />
        ))}
      </ul>
    </>
  )
}
