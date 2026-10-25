import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../api'
import { useAuth } from '../AuthContext.jsx'
import Confetti from '../Confetti.jsx'
import { themeFor, themeStyle } from '../theme'

const MAX_PER_ORDER = 10
const TICKETS_TAKEN = 'הכרטיסים נתפסו על ידי משתמשת אחרת'
const ALMOST_FULL = 3

const formatTime = (iso) =>
  new Date(iso).toLocaleString('he-IL', { weekday: 'long', hour: '2-digit', minute: '2-digit' })

function SessionRow({ session, loggedIn, onPurchased, onConflict, index }) {
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [celebrate, setCelebrate] = useState(false)

  const [loadedAt] = useState(() => Date.now())
  const startsAt = new Date(session.startsAtUtc)
  const started = startsAt.getTime() <= loadedAt
  const soldOut = session.seatsAvailable === 0
  const maxQuantity = Math.min(MAX_PER_ORDER, session.seatsAvailable)
  // אחרי רענון המקומות הפנויים הכמות שנבחרה עלולה לחרוג, ולכן מגבילים אותה בזמן הצגה
  const shownQuantity = Math.min(quantity, Math.max(maxQuantity, 1))

  const soldPercent = session.capacity > 0 ? Math.round(((session.capacity - session.seatsAvailable) / session.capacity) * 100) : 100
  const almostFull = !soldOut && session.seatsAvailable <= ALMOST_FULL
  const meterClass = soldOut || almostFull ? 'meter-fill hot' : soldPercent >= 60 ? 'meter-fill warm' : 'meter-fill'

  async function buy() {
    setBusy(true)
    setMessage(null)
    try {
      await api.createOrder(session.id, shownQuantity)
      setMessage({ type: 'ok', text: `ההזמנה נקלטה: ${shownQuantity} כרטיסים. נתראה שם! 🎉` })
      setCelebrate(true)
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
    <li className={started ? 'card session past' : 'card session'} style={{ animationDelay: `${index * 80}ms` }}>
      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}

      <div className="date-badge">
        <strong>{startsAt.getDate()}</strong>
        <span>{startsAt.toLocaleString('he-IL', { month: 'short' })}</span>
      </div>

      <div className="session-info">
        <p className="session-time">{formatTime(session.startsAtUtc)}</p>
        <p className="muted">
          📍 {session.location} · <span className="price">{session.price} ₪</span> לכרטיס
        </p>
        {started ? (
          <p className="seats-text">⏰ המועד עבר</p>
        ) : (
          <>
            <div className="meter" role="progressbar" aria-valuenow={soldPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className={meterClass} style={{ width: `${soldPercent}%` }} />
            </div>
            <p className={almostFull || soldOut ? 'seats-text hot' : 'seats-text'}>
              {soldOut
                ? 'אזלו הכרטיסים 😢'
                : almostFull
                  ? `🔥 נשארו רק ${session.seatsAvailable} מקומות!`
                  : `מקומות פנויים: ${session.seatsAvailable} מתוך ${session.capacity}`}
            </p>
          </>
        )}
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
                {busy ? 'קונה...' : '🎟️ קנייה'}
              </button>
            </>
          ) : (
            <Link to="/login">
              <button>התחברי כדי להזמין</button>
            </Link>
          )}
        </div>
      )}

      {message && <p className={`session-message ${message.type}`}>{message.text}</p>}
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
  if (!event) return <div className="skeleton" />

  const theme = themeFor(event.categoryName, event.categoryId, event.title)

  return (
    <div style={themeStyle(theme)}>
      <Link to="/" className="back">
        → חזרה לאירועים
      </Link>

      <section className="event-hero">
        <span className="emoji">{theme.emoji}</span>
        <div>
          <span className="pill">{event.categoryName}</span>
          <h1>{event.title}</h1>
          {event.description && <p>{event.description}</p>}
          <div className="tags" style={{ marginTop: 14 }}>
            {event.tags.map((t) => (
              <span key={t.id} className="tag">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <h2>בחרי מועד 📅</h2>
      {event.sessions.length === 0 && (
        <div className="empty">
          <span className="big">⏳</span>
          <p>אין מועדים קרובים.</p>
        </div>
      )}
      <ul className="sessions">
        {event.sessions.map((s, i) => (
          <SessionRow
            key={s.id}
            session={s}
            index={i}
            loggedIn={Boolean(session)}
            onPurchased={load}
            onConflict={load}
          />
        ))}
      </ul>
    </div>
  )
}
