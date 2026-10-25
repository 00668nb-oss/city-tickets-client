import { useEffect, useState } from 'react'

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']

// קונפטי קצר אחרי קנייה מוצלחת. נעלם לבד ולא חוסם לחיצות.
export default function Confetti({ onDone }) {
  const [pieces] = useState(() =>
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 240,
      color: COLORS[i % COLORS.length],
      round: i % 3 === 0,
    })),
  )

  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={p.round ? 'confetti-piece round' : 'confetti-piece'}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
