// צבעים ואימוג'י לכל קטגוריה ואירוע, כדי שהאתר יהיה צבעוני בלי תמונות חיצוניות.
const CATEGORY_THEMES = [
  { match: 'טיול', emoji: '🏞️', c1: '#06b6d4', c2: '#22c55e' },
  { match: 'הרצא', emoji: '🎤', c1: '#8b5cf6', c2: '#ec4899' },
  { match: 'סדנ', emoji: '🎨', c1: '#f97316', c2: '#f43f5e' },
]

const FALLBACK_THEMES = [
  { emoji: '🎟️', c1: '#6366f1', c2: '#06b6d4' },
  { emoji: '🎭', c1: '#ec4899', c2: '#f59e0b' },
  { emoji: '🎶', c1: '#14b8a6', c2: '#8b5cf6' },
]

const EVENT_EMOJIS = [
  { match: 'עתיקה', emoji: '🏛️' },
  { match: 'נחל', emoji: '💦' },
  { match: 'תולדות', emoji: '📜' },
  { match: 'קרמיקה', emoji: '🏺' },
  { match: 'אפייה', emoji: '🥐' },
]

export function themeFor(categoryName = '', categoryId = 0, title = '') {
  const found = CATEGORY_THEMES.find((t) => categoryName.includes(t.match))
  const base = found ?? FALLBACK_THEMES[Math.abs(Number(categoryId) || 0) % FALLBACK_THEMES.length]
  const eventEmoji = EVENT_EMOJIS.find((e) => title.includes(e.match))?.emoji
  return { emoji: eventEmoji ?? base.emoji, c1: base.c1, c2: base.c2 }
}

export const themeStyle = (theme) => ({ '--c1': theme.c1, '--c2': theme.c2 })
