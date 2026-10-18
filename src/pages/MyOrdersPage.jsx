import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'

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
      <h1>ההזמנות שלי</h1>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p>טוענת...</p>}

      {data && data.items.length === 0 && <p>עדיין אין הזמנות.</p>}

      {data && data.items.length > 0 && (
        <>
          <ul className="sessions">
            {data.items.map((o) => (
              <li key={o.id} className="card session">
                <div>
                  <strong>{o.sessionEventTitle}</strong>
                  <p className="muted">
                    {formatDate(o.sessionStartsAtUtc)} · {o.sessionLocation}
                  </p>
                  <p>
                    {o.quantity} כרטיסים · {o.totalPrice} ₪ ·{' '}
                    <span className={o.status === 'Active' ? 'success' : 'muted'}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </p>
                </div>
                {o.status === 'Active' && (
                  <button className="danger" disabled={cancellingId === o.id} onClick={() => cancel(o)}>
                    {cancellingId === o.id ? 'מבטלת...' : 'ביטול'}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="pager">
            <button disabled={!data.hasPrevious} onClick={() => setPage(page - 1)}>
              הקודם
            </button>
            <span>
              עמוד {data.page} מתוך {Math.max(data.totalPages, 1)}
            </span>
            <button disabled={!data.hasNext} onClick={() => setPage(page + 1)}>
              הבא
            </button>
          </div>
        </>
      )}
    </>
  )
}
