import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import { themeFor, themeStyle } from '../theme'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })

const STATUS_LABELS = { Active: 'פעילה', Cancelled: 'בוטלה' }

export default function MyOrdersPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const load = useCallback(() => {
    return api
      .listOrders(page, 5)
      .then((result) => {
        setData(result)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  async function cancel(order) {
    if (!window.confirm('לבטל את ההזמנה? המקומות יחזרו למועד.')) return
    setCancellingId(order.id)
    try {
      await api.cancelOrder(order.id)
      await load()
    } catch (err) {
      setError(err.message)
      await load()
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <>
      <h1>ההזמנות שלי 🎫</h1>
      {error && <p className="error">{error}</p>}
      {!data && !error && <div className="skeleton" />}

      {data && data.items.length === 0 && (
        <div className="empty">
          <span className="big">🎈</span>
          <p>עדיין אין הזמנות. זה הזמן למצוא משהו כיפי!</p>
          <Link to="/">
            <button>לאירועים</button>
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className="sessions">
            {data.items.map((o, i) => {
              const theme = themeFor('', o.id, o.sessionEventTitle)
              const active = o.status === 'Active'
              return (
                <li
                  key={o.id}
                  className={active ? 'card ticket' : 'card ticket cancelled'}
                  style={{ ...themeStyle(theme), animationDelay: `${i * 70}ms` }}
                >
                  <div className="ticket-main">
                    <span className="ticket-emoji">{theme.emoji}</span>
                    <div>
                      <strong>{o.sessionEventTitle}</strong>
                      <p className="muted">
                        📅 {formatDate(o.sessionStartsAtUtc)} · 📍 {o.sessionLocation}
                      </p>
                      <p>
                        {o.quantity} כרטיסים{' '}
                        <span className={active ? 'status active' : 'status cancelled'}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="ticket-side">
                    <span className="total">{o.totalPrice} ₪</span>
                    {active && (
                      <button className="danger" disabled={cancellingId === o.id} onClick={() => cancel(o)}>
                        {cancellingId === o.id ? 'מבטלת...' : 'ביטול'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="pager">
            <button disabled={!data.hasPrevious} onClick={() => setPage(page - 1)}>
              → הקודם
            </button>
            <span>
              עמוד {data.page} מתוך {Math.max(data.totalPages, 1)}
            </span>
            <button disabled={!data.hasNext} onClick={() => setPage(page + 1)}>
              הבא ←
            </button>
          </div>
        </>
      )}
    </>
  )
}
