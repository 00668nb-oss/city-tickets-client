import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import EventPage from './pages/EventPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyOrdersPage from './pages/MyOrdersPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function RequireLogin({ children }) {
  const { session } = useAuth()
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { session, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <svg className="brand-icon" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7c3aed" />
                <stop offset="0.55" stopColor="#ec4899" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <g transform="rotate(-18 32 32)">
              <path
                fill="url(#brand-grad)"
                d="M8 16h48a2 2 0 0 1 2 2v8a6 6 0 0 0 0 12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8a6 6 0 0 0 0-12v-8a2 2 0 0 1 2-2z"
              />
              <path stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" d="M42 20v24" />
              <path fill="#fff" d="M24 24l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" />
            </g>
          </svg>
          <span className="brand-text">citicket</span>
        </NavLink>
        <nav>
          <NavLink to="/" end className="nav-link">
            אירועים
          </NavLink>
          {session ? (
            <>
              <NavLink to="/orders" className="nav-link">
                ההזמנות שלי
              </NavLink>
              <span className="who">שלום, {session.fullName} 👋</span>
              <button className="link" onClick={logout}>
                התנתקות
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                התחברות
              </NavLink>
              <NavLink to="/register" className="nav-link">
                הרשמה
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* key לפי הנתיב מפעיל את אנימציית הכניסה בכל מעבר בין מסכים */}
        <div className="page" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/orders"
              element={
                <RequireLogin>
                  <MyOrdersPage />
                </RequireLogin>
              }
            />
            <Route
              path="*"
              element={
                <div className="empty">
                  <span className="big">🧭</span>
                  <p>הדף לא נמצא.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </>
  )
}
