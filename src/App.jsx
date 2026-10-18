import { Link, Navigate, Route, Routes } from 'react-router-dom'
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

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          כרטיסים לעיר
        </Link>
        <nav>
          <Link to="/">אירועים</Link>
          {session ? (
            <>
              <Link to="/orders">ההזמנות שלי</Link>
              <span className="who">שלום, {session.fullName}</span>
              <button className="link" onClick={logout}>
                התנתקות
              </button>
            </>
          ) : (
            <>
              <Link to="/login">התחברות</Link>
              <Link to="/register">הרשמה</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
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
          <Route path="*" element={<p>הדף לא נמצא.</p>} />
        </Routes>
      </main>
    </>
  )
}
