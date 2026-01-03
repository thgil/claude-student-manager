// Currency formatting
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount)
}

// Date formatting - standard format with optional weekday
export function formatDate(dateStr, options = {}) {
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  return new Date(dateStr).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

// Date formatting with weekday included
export function formatDateWithWeekday(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Time formatting (24h to 12h with AM/PM)
export function formatTime(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Upcoming date formatting (Today, Tomorrow, or weekday + date)
export function formatUpcomingDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Month formatting (YYYY-MM to "Month Year")
export function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-')
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Calculate lesson amount from rate and duration
export function calculateLessonAmount(hourlyRate, durationMinutes) {
  return hourlyRate * durationMinutes / 60
}
