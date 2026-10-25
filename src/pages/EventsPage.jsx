import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import { themeFor, themeStyle } from '../theme'

const PAGE_SIZE = 6

const FLOATERS = [
  { emoji: '🎭', style: { top: '14%', insetInlineEnd: '6%' } },
  { emoji: '🏔️', style: { top: '52%', insetInlineEnd: '18%', animationDelay: '-2s' } },
  { emoji: '🎶', style: { top: '10%', insetInlineEnd: '28%', animationDelay: '-4s' } },
  { emoji: '🎈', style: { top: '60%', insetInlineEnd: '3%', animationDelay: '-1s' } },
]

export default function EventsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagId, setTagId] = useState('')
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  // הקטגוריות והתגיות נטענות בנפרד ועם ניסיונות חוזרים: השרת החינמי מתעורר לאט,
  // ובקשה אחת שנכשלה לא צריכה להשאיר את הסינון ריק
  useEffect(() => {
    let cancelled = false
    let timer
    function loadWithRetry(fetcher, setter, attempt = 1) {
      fetcher()
        .then((items) => {
          if (!cancelled) setter(items)
        })
        .catch(() => {
          if (!cancelled && attempt < 5) {
            timer = setTimeout(() => loadWithRetry(fetcher, setter, attempt + 1), 3000)
          }
        })
    }
    loadWithRetry(api.listCategories, setCategories)
    loadWithRetry(api.listTags, setTags)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // כל שינוי בעמוד או בסינון שולח בקשה חדשה לשרת (הדפדוף נעשה בשרת)
  useEffect(() => {
    let ignore = false
    api
      .listEvents({ page, pageSize: PAGE_SIZE, search, categoryId, tagId })
      .then((result) => {
        if (!ignore) {
          setData(result)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [page, search, categoryId, tagId])

  function pick(setter, value) {
    setter(value)
    setPage(1)
  }

  return (
    <>
      <section className="hero">
        {FLOATERS.map((f) => (
          <span key={f.emoji} className="hero-float" style={f.style} aria-hidden="true">
            {f.emoji}
          </span>
        ))}
        <h1>
          מופעים, טיולים
          <br />
          וחוויות בעיר ✨
        </h1>
        <p>בוחרים אירוע, תופסים מקום, והולכים להנות. הכרטיסים נגמרים מהר!</p>
        <div className="search">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            placeholder="לאן יוצאים? חיפוש לפי שם"
            value={search}
            onChange={(e) => pick(setSearch, e.target.value)}
          />
        </div>
      </section>

      <div className="chips">
        <span className="chips-label">קטגוריה:</span>
        <button className={categoryId === '' ? 'chip on' : 'chip'} onClick={() => pick(setCategoryId, '')}>
          הכול
        </button>
        {categories.map((c) => {
          const theme = themeFor(c.name, c.id)
          return (
            <button
              key={c.id}
              className={String(c.id) === String(categoryId) ? 'chip on' : 'chip'}
              onClick={() => pick(setCategoryId, String(c.id))}
            >
              {theme.emoji} {c.name}
            </button>
          )
        })}
      </div>

      {tags.length > 0 && (
        <div className="chips">
          <span className="chips-label">תגית:</span>
          <button className={tagId === '' ? 'chip on' : 'chip'} onClick={() => pick(setTagId, '')}>
            הכול
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              className={String(t.id) === String(tagId) ? 'chip on' : 'chip'}
              onClick={() => pick(setTagId, String(t.id))}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {!data && !error && (
        <div className="grid">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      )}

      {data && (
        <>
          {data.items.length === 0 && (
            <div className="empty">
              <span className="big">🔭</span>
              <p>לא נמצאו אירועים. נסי לשנות את החיפוש או הסינון.</p>
            </div>
          )}
          <div className="grid">
            {data.items.map((ev, i) => {
              const theme = themeFor(ev.categoryName, ev.categoryId, ev.title)
              return (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card event-card"
                  style={{ ...themeStyle(theme), animationDelay: `${i * 70}ms` }}
                >
                  <div className="event-banner">
                    <span className="event-category">{ev.categoryName}</span>
                    <span className="event-emoji">{theme.emoji}</span>
                  </div>
                  <div className="event-body">
                    <h2>{ev.title}</h2>
                    <div className="tags">
                      {ev.tags.map((t) => (
                        <span key={t.id} className="tag">
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <span className="event-cta">
                      למועדים וכרטיסים <span>←</span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

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
