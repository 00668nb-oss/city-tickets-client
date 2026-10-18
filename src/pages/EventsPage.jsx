import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

const PAGE_SIZE = 6

export default function EventsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagId, setTagId] = useState('')
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.listCategories(), api.listTags()])
      .then(([c, t]) => {
        setCategories(c)
        setTags(t)
      })
      .catch((err) => setError(err.message))
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

  function changeFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  return (
    <>
      <h1>אירועים</h1>

      <div className="filters">
        <input placeholder="חיפוש לפי שם" value={search} onChange={changeFilter(setSearch)} />
        <select value={categoryId} onChange={changeFilter(setCategoryId)}>
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={tagId} onChange={changeFilter(setTagId)}>
          <option value="">כל התגיות</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p>טוענת...</p>}

      {data && (
        <>
          {data.items.length === 0 && <p>לא נמצאו אירועים.</p>}
          <div className="grid">
            {data.items.map((ev) => (
              <Link key={ev.id} to={`/events/${ev.id}`} className="card event-card">
                <h2>{ev.title}</h2>
                <p className="muted">{ev.categoryName}</p>
                <p>
                  {ev.tags.map((t) => (
                    <span key={t.id} className="tag">
                      {t.name}
                    </span>
                  ))}
                </p>
              </Link>
            ))}
          </div>

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
