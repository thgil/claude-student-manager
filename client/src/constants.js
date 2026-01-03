// Currency settings
export const CURRENCY = {
  locale: 'en-IE',
  code: 'EUR',
}

// Lesson defaults
export const LESSON_DEFAULTS = {
  DURATION_MINUTES: 60,
  MIN_DURATION: 15,
  DURATION_STEP: 15,
  HOURLY_RATE: 30,
  RATE_STEP: 5,
}

// Schedule settings
export const SCHEDULE = {
  UPCOMING_DAYS: 14,
  DASHBOARD_PREVIEW_DAYS: 7,
  DASHBOARD_PREVIEW_COUNT: 5,
}

// Frequency options for recurring schedules
export const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', interval: 1 },
  { value: 'biweekly', label: 'Every 2 weeks', interval: 2 },
  { value: 'monthly', label: 'Every 4 weeks', interval: 4 },
  { value: 'custom', label: 'Custom', interval: null },
]

// Days of the week
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Capitalize first letter helper
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
