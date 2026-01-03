import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { schedulesApi, studentsApi } from '../api'
import { formatTime, formatDateWithWeekday, formatDate } from '../utils/formatters'
import { DAYS, DAY_LABELS, LESSON_DEFAULTS, SCHEDULE, FREQUENCIES, capitalize } from '../constants'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

// Timetable config
const TIMETABLE_START_HOUR = 7  // 7 AM
const TIMETABLE_END_HOUR = 21   // 9 PM
const HOUR_HEIGHT = 60          // pixels per hour

// Helper to get Monday of a given week
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Helper to get first day of month
function getFirstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Helper to format date as YYYY-MM-DD
function toDateString(date) {
  return date.toISOString().split('T')[0]
}

// Helper to format month header
function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Helper to format week range
function formatWeekRange(startDate) {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  const year = startDate.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${year}`
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`
}

// Convert time string (HH:MM) to minutes from midnight
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Format hour for display (e.g., "9 AM", "2 PM")
function formatHour(hour) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

// Generate array of hours for timetable
function getTimeSlots() {
  const slots = []
  for (let hour = TIMETABLE_START_HOUR; hour <= TIMETABLE_END_HOUR; hour++) {
    slots.push(hour)
  }
  return slots
}

export default function Schedule() {
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [calendarMode, setCalendarMode] = useState('week') // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date()) // Date being viewed
  const [schedules, setSchedules] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    is_recurring: true,
    days_of_week: ['monday'],
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
    frequency: 'weekly',
    interval: 1,
    end_date: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)

  // Complete lesson modal
  const [completingLesson, setCompletingLesson] = useState(null)
  const [completeNotes, setCompleteNotes] = useState('')

  // Lesson action modal (for selecting what to do with a lesson)
  const [selectedLesson, setSelectedLesson] = useState(null)

  // Reschedule modal
  const [reschedulingLesson, setReschedulingLesson] = useState(null)
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: ''
  })

  const timeSlots = getTimeSlots()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [schedulesData, upcomingData, studentsData] = await Promise.all([
        schedulesApi.getAll(),
        schedulesApi.getUpcoming(90),
        studentsApi.getAll()
      ])
      setSchedules(schedulesData)
      setUpcoming(upcomingData)
      setStudents(studentsData)
    } catch (err) {
      console.error('Failed to load schedules:', err)
      setError('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  // Navigation functions
  function goToToday() {
    setCurrentDate(new Date())
  }

  function goToPrev() {
    const newDate = new Date(currentDate)
    if (calendarMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  function goToNext() {
    const newDate = new Date(currentDate)
    if (calendarMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Get dates for week view
  function getWeekDates() {
    const monday = getMonday(currentDate)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(toDateString(d))
    }
    return dates
  }

  // Get dates for month view
  function getMonthDates() {
    const firstOfMonth = getFirstOfMonth(currentDate)
    const year = firstOfMonth.getFullYear()
    const month = firstOfMonth.getMonth()

    const startDate = getMonday(firstOfMonth)
    const lastOfMonth = new Date(year, month + 1, 0)
    const endDate = new Date(lastOfMonth)
    const endDay = endDate.getDay()
    if (endDay !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDay))
    }

    const dates = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(toDateString(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  // Generate lessons for dates from recurring schedules
  const generateLessonsForDates = useMemo(() => {
    const lessonsByDate = {}

    // First add lessons from upcoming API (already has frequency/exception logic applied)
    upcoming.forEach(lesson => {
      if (!lessonsByDate[lesson.date]) {
        lessonsByDate[lesson.date] = []
      }
      lessonsByDate[lesson.date].push(lesson)
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    // Generate occurrences for past dates (not covered by upcoming API)
    schedules.filter(s => s.is_recurring).forEach(schedule => {
      const interval = schedule.interval || 1
      const exceptions = schedule.exceptions || []

      // Support both old day_of_week and new days_of_week
      const scheduleDays = schedule.days_of_week || (schedule.day_of_week ? [schedule.day_of_week] : [])

      // For past dates
      const viewStartDate = new Date(today)
      viewStartDate.setDate(viewStartDate.getDate() - 60)

      // Check if schedule has ended
      if (schedule.end_date && new Date(schedule.end_date) < viewStartDate) {
        return // Skip this schedule entirely
      }

      // Use Monday of created week as anchor for interval calculations
      const anchorDate = new Date(schedule.created_at || today)
      const anchorDay = anchorDate.getDay()
      anchorDate.setDate(anchorDate.getDate() - (anchorDay === 0 ? 6 : anchorDay - 1))

      // Iterate through each day in the past range
      const current = new Date(viewStartDate)
      while (current < today) {
        const currentDayName = dayNames[current.getDay()]

        if (scheduleDays.includes(currentDayName)) {
          // Calculate weeks since anchor (using Monday of each week)
          const checkMonday = new Date(current)
          const checkDay = checkMonday.getDay()
          checkMonday.setDate(checkMonday.getDate() - (checkDay === 0 ? 6 : checkDay - 1))

          const weeksDiff = Math.round((checkMonday - anchorDate) / (7 * 24 * 60 * 60 * 1000))
          const isValidOccurrence = weeksDiff >= 0 && weeksDiff % interval === 0

          // Check end date
          const withinEndDate = !schedule.end_date || current <= new Date(schedule.end_date)

          if (isValidOccurrence && withinEndDate) {
            const dateStr = toDateString(current)

            // Check for exceptions
            const exception = exceptions.find(e => e.date === dateStr)

            if (!lessonsByDate[dateStr]?.some(l => l.id === schedule.id)) {
              if (exception?.action === 'skip') {
                // Skip this occurrence
              } else if (exception?.action === 'reschedule') {
                // Add rescheduled occurrence
                if (!lessonsByDate[exception.reschedule_to]) {
                  lessonsByDate[exception.reschedule_to] = []
                }
                lessonsByDate[exception.reschedule_to].push({
                  ...schedule,
                  date: exception.reschedule_to,
                  time: exception.reschedule_time || schedule.time,
                  original_date: dateStr,
                  is_rescheduled: true,
                  is_recurring_instance: true
                })
              } else {
                // Normal occurrence
                if (!lessonsByDate[dateStr]) {
                  lessonsByDate[dateStr] = []
                }
                lessonsByDate[dateStr].push({
                  ...schedule,
                  date: dateStr,
                  is_recurring_instance: true
                })
              }
            }
          }
        }

        current.setDate(current.getDate() + 1)
      }
    })

    return lessonsByDate
  }, [upcoming, schedules])

  function getLessonsForDate(date) {
    return generateLessonsForDates[date] || []
  }

  // Calculate position and height for a lesson in timetable view
  function getLessonStyle(lesson) {
    const startMinutes = timeToMinutes(lesson.time)
    const timetableStartMinutes = TIMETABLE_START_HOUR * 60
    const timetableEndMinutes = TIMETABLE_END_HOUR * 60

    // Calculate top position (offset from timetable start)
    const topMinutes = Math.max(0, startMinutes - timetableStartMinutes)
    const top = (topMinutes / 60) * HOUR_HEIGHT

    // Calculate height based on duration
    const endMinutes = startMinutes + lesson.duration_minutes
    const visibleEndMinutes = Math.min(endMinutes, timetableEndMinutes)
    const visibleStartMinutes = Math.max(startMinutes, timetableStartMinutes)
    const visibleDuration = visibleEndMinutes - visibleStartMinutes
    const height = Math.max(20, (visibleDuration / 60) * HOUR_HEIGHT)

    // Check if lesson is outside visible range
    const isVisible = startMinutes < timetableEndMinutes && endMinutes > timetableStartMinutes

    return { top, height, isVisible }
  }

  const weekDates = getWeekDates()
  const monthDates = getMonthDates()
  const todayStr = toDateString(new Date())
  const timetableHeight = (TIMETABLE_END_HOUR - TIMETABLE_START_HOUR) * HOUR_HEIGHT

  function openNewForm() {
    setEditingSchedule(null)
    setFormData({
      student_id: '',
      is_recurring: true,
      days_of_week: ['monday'],
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
      frequency: 'weekly',
      interval: 1,
      end_date: '',
      notes: ''
    })
    setShowForm(true)
  }

  function openEditForm(schedule) {
    setEditingSchedule(schedule)
    // Support both old day_of_week and new days_of_week
    const days = schedule.days_of_week || (schedule.day_of_week ? [schedule.day_of_week] : ['monday'])
    setFormData({
      student_id: schedule.student_id.toString(),
      is_recurring: schedule.is_recurring,
      days_of_week: days,
      date: schedule.date || new Date().toISOString().split('T')[0],
      time: schedule.time,
      duration_minutes: schedule.duration_minutes,
      frequency: schedule.frequency || 'weekly',
      interval: schedule.interval || 1,
      end_date: schedule.end_date || '',
      notes: schedule.notes || ''
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.student_id) {
      setError('Please select a student')
      return
    }
    if (formData.is_recurring && formData.days_of_week.length === 0) {
      setError('Please select at least one day')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const submitData = {
        ...formData,
        interval: formData.frequency === 'custom' ? formData.interval : FREQUENCIES.find(f => f.value === formData.frequency)?.interval || 1,
        end_date: formData.end_date || null
      }
      if (editingSchedule) {
        await schedulesApi.update(editingSchedule.id, submitData)
      } else {
        await schedulesApi.create(submitData)
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Failed to save schedule. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setIsSubmitting(true)
    try {
      await schedulesApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      setError('Failed to delete schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open action menu for a lesson (from calendar)
  function openLessonAction(lesson) {
    setSelectedLesson(lesson)
  }

  function openCompleteModal(lesson) {
    setSelectedLesson(null)
    setCompletingLesson(lesson)
    setCompleteNotes(lesson.notes || '')
  }

  function openRescheduleModal(lesson) {
    setSelectedLesson(null)
    setReschedulingLesson(lesson)
    setRescheduleData({
      date: '',
      time: lesson.time
    })
  }

  async function handleComplete() {
    if (isSubmitting || !completingLesson) return

    setIsSubmitting(true)
    setError(null)
    try {
      await schedulesApi.completeLesson(
        completingLesson.id,
        completingLesson.date,
        completeNotes
      )
      setCompletingLesson(null)
      loadData()
    } catch (err) {
      console.error('Failed to complete lesson:', err)
      setError('Failed to log lesson. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkip() {
    if (isSubmitting || !selectedLesson || !selectedLesson.is_recurring_instance) return

    setIsSubmitting(true)
    setError(null)
    try {
      await schedulesApi.addException(selectedLesson.id, {
        date: selectedLesson.date,
        action: 'skip'
      })
      setSelectedLesson(null)
      loadData()
    } catch (err) {
      console.error('Failed to skip lesson:', err)
      setError('Failed to skip lesson. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReschedule() {
    if (isSubmitting || !reschedulingLesson || !rescheduleData.date) return

    setIsSubmitting(true)
    setError(null)
    try {
      await schedulesApi.addException(reschedulingLesson.id, {
        date: reschedulingLesson.original_date || reschedulingLesson.date,
        action: 'reschedule',
        reschedule_to: rescheduleData.date,
        reschedule_time: rescheduleData.time
      })
      setReschedulingLesson(null)
      loadData()
    } catch (err) {
      console.error('Failed to reschedule lesson:', err)
      setError('Failed to reschedule lesson. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUndoException() {
    if (isSubmitting || !selectedLesson) return

    const dateToRemove = selectedLesson.original_date || selectedLesson.date
    setIsSubmitting(true)
    setError(null)
    try {
      await schedulesApi.removeException(selectedLesson.id, dateToRemove)
      setSelectedLesson(null)
      loadData()
    } catch (err) {
      console.error('Failed to undo exception:', err)
      setError('Failed to undo. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Schedule</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${view === 'list' ? 'bg-white shadow' : ''}`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1 rounded text-sm font-medium ${view === 'calendar' ? 'bg-white shadow' : ''}`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={openNewForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="p-2 hover:bg-gray-100 rounded-md"
                title={calendarMode === 'week' ? 'Previous week' : 'Previous month'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Today
              </button>
              <button
                onClick={goToNext}
                className="p-2 hover:bg-gray-100 rounded-md"
                title={calendarMode === 'week' ? 'Next week' : 'Next month'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="ml-2 text-lg font-semibold text-gray-900">
                {calendarMode === 'week'
                  ? formatWeekRange(getMonday(currentDate))
                  : formatMonthYear(currentDate)
                }
              </span>
            </div>

            {/* Week/Month Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCalendarMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium ${calendarMode === 'week' ? 'bg-white shadow' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium ${calendarMode === 'month' ? 'bg-white shadow' : ''}`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Week View - Timetable Style */}
          {calendarMode === 'week' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header with days */}
              <div className="flex border-b sticky top-0 bg-white z-10">
                {/* Time column header */}
                <div className="w-16 md:w-20 flex-shrink-0 border-r bg-gray-50" />
                {/* Day headers */}
                {weekDates.map((date, i) => {
                  const isToday = date === todayStr
                  return (
                    <div
                      key={date}
                      className={`flex-1 p-2 md:p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className="text-xs text-gray-500">{DAY_LABELS[i]}</div>
                      <div className={`text-sm md:text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                        {new Date(date + 'T00:00:00').getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Timetable body */}
              <div className="flex overflow-x-auto">
                {/* Time axis */}
                <div className="w-16 md:w-20 flex-shrink-0 border-r bg-gray-50">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="border-b last:border-b-0 text-xs text-gray-500 pr-2 text-right"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      <span className="relative -top-2">{formatHour(hour)}</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((date) => {
                  const dayLessons = getLessonsForDate(date)
                  const isToday = date === todayStr

                  return (
                    <div
                      key={date}
                      className={`flex-1 min-w-[100px] border-r last:border-r-0 relative ${isToday ? 'bg-blue-50/30' : ''}`}
                      style={{ height: timetableHeight }}
                    >
                      {/* Hour grid lines */}
                      {timeSlots.map((hour) => (
                        <div
                          key={hour}
                          className="absolute w-full border-b border-gray-100"
                          style={{ top: (hour - TIMETABLE_START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        />
                      ))}

                      {/* Lessons */}
                      {dayLessons.map((lesson, idx) => {
                        const { top, height, isVisible } = getLessonStyle(lesson)
                        if (!isVisible) return null

                        const isRescheduled = lesson.is_rescheduled
                        const bgColor = isRescheduled ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'

                        return (
                          <div
                            key={`${lesson.id}-${idx}`}
                            className={`absolute left-1 right-1 ${bgColor} text-white rounded px-1.5 py-1 text-xs cursor-pointer overflow-hidden shadow-sm`}
                            style={{
                              top: top + 1,
                              height: height - 2,
                              zIndex: 1
                            }}
                            onClick={() => openLessonAction(lesson)}
                            title={`${lesson.student_name}\n${formatTime(lesson.time)} - ${lesson.duration_minutes} min${isRescheduled ? '\n(Rescheduled)' : ''}`}
                          >
                            <div className="font-medium truncate">{lesson.student_name}</div>
                            {height > 35 && (
                              <div className={isRescheduled ? 'text-orange-100 text-[10px]' : 'text-blue-100 text-[10px]'}>
                                {formatTime(lesson.time)}
                              </div>
                            )}
                            {height > 50 && (
                              <div className={isRescheduled ? 'text-orange-100 text-[10px]' : 'text-blue-100 text-[10px]'}>
                                {lesson.duration_minutes} min
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Month View */}
          {calendarMode === 'month' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {DAY_LABELS.map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {monthDates.map((date) => {
                  const dayLessons = getLessonsForDate(date)
                  const isToday = date === todayStr
                  const dateObj = new Date(date + 'T00:00:00')
                  const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth()

                  return (
                    <div
                      key={date}
                      className={`min-h-[80px] md:min-h-[100px] p-1 border-r border-b last:border-r-0
                        ${isToday ? 'bg-blue-50' : ''}
                        ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                    >
                      <div className={`text-xs md:text-sm font-medium mb-1
                        ${isToday ? 'text-blue-600' : ''}
                        ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {dateObj.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayLessons.slice(0, 3).map((lesson, idx) => {
                          const isRescheduled = lesson.is_rescheduled
                          return (
                            <div
                              key={`${lesson.id}-${idx}`}
                              className={`${isRescheduled ? 'bg-orange-100 hover:bg-orange-200' : 'bg-blue-100 hover:bg-blue-200'} rounded px-1 py-0.5 text-xs cursor-pointer truncate`}
                              onClick={() => openLessonAction(lesson)}
                              title={`${lesson.student_name} at ${formatTime(lesson.time)}${isRescheduled ? ' (Rescheduled)' : ''}`}
                            >
                              <span className="hidden md:inline">{formatTime(lesson.time)} </span>
                              <span className="font-medium">{lesson.student_name}</span>
                            </div>
                          )
                        })}
                        {dayLessons.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayLessons.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View - Upcoming Lessons */}
      {view === 'list' && (
        <>
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 md:px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Upcoming Lessons</h3>
            </div>
            <div className="divide-y">
              {upcoming.length === 0 ? (
                <EmptyState message="No upcoming lessons scheduled" />
              ) : (
                upcoming.map((lesson, idx) => (
                  <div key={`${lesson.id}-${lesson.date}-${idx}`} className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/students/${lesson.student_id}`} className="font-medium text-blue-600">
                            {lesson.student_name}
                          </Link>
                          {lesson.is_recurring && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Weekly</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDateWithWeekday(lesson.date)} at {formatTime(lesson.time)} · {lesson.duration_minutes} min
                        </div>
                        {lesson.notes && (
                          <div className="text-sm text-gray-600 mt-1">{lesson.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openCompleteModal(lesson)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Log Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recurring Schedules */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 md:px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Recurring Schedules</h3>
            </div>
            <div className="divide-y">
              {schedules.filter(s => s.is_recurring).length === 0 ? (
                <EmptyState message="No recurring schedules set up" />
              ) : (
                schedules.filter(s => s.is_recurring).map(schedule => (
                  <div key={schedule.id} className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <Link to={`/students/${schedule.student_id}`} className="font-medium text-blue-600">
                          {schedule.student_name}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {(() => {
                            // Support both old day_of_week and new days_of_week
                            const days = schedule.days_of_week || (schedule.day_of_week ? [schedule.day_of_week] : [])
                            const daysText = days.map(d => capitalize(d)).join(', ')
                            const frequency = schedule.frequency || 'weekly'
                            const interval = schedule.interval || 1

                            if (frequency === 'weekly' || interval === 1) {
                              return days.length > 1
                                ? <>{daysText}</>
                                : <>Every {daysText}</>
                            } else if (frequency === 'biweekly' || interval === 2) {
                              return <>Every 2 weeks: {daysText}</>
                            } else {
                              return <>Every {interval} weeks: {daysText}</>
                            }
                          })()}
                          {' '}at {formatTime(schedule.time)} · {schedule.duration_minutes} min
                          {schedule.end_date && (
                            <span className="text-gray-400"> · Until {formatDate(schedule.end_date)}</span>
                          )}
                        </div>
                        {schedule.exceptions?.length > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            {schedule.exceptions.length} exception{schedule.exceptions.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(schedule)}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(schedule)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Schedule Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Student"
            type="select"
            value={formData.student_id}
            onChange={e => setFormData({ ...formData, student_id: e.target.value })}
            required
          >
            <option value="">Select a student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </FormField>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.is_recurring}
                  onChange={() => setFormData({ ...formData, is_recurring: true })}
                  className="mr-2"
                />
                Weekly recurring
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!formData.is_recurring}
                  onChange={() => setFormData({ ...formData, is_recurring: false })}
                  className="mr-2"
                />
                One-time
              </label>
            </div>
          </div>

          {formData.is_recurring ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const isSelected = formData.days_of_week.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              days_of_week: formData.days_of_week.filter(d => d !== day)
                            })
                          } else {
                            setFormData({
                              ...formData,
                              days_of_week: [...formData.days_of_week, day]
                            })
                          }
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {capitalize(day).slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
                {formData.days_of_week.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.days_of_week.length} days per week
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Frequency"
                  type="select"
                  value={formData.frequency}
                  onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                >
                  {FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </FormField>

                {formData.frequency === 'custom' && (
                  <FormField
                    label="Every X weeks"
                    type="number"
                    value={formData.interval}
                    onChange={e => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={52}
                  />
                )}
              </div>

              <FormField
                label="End Date (optional)"
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </>
          ) : (
            <FormField
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required={!formData.is_recurring}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Time"
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
            />
            <FormField
              label="Duration (min)"
              type="number"
              value={formData.duration_minutes}
              onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || LESSON_DEFAULTS.DURATION_MINUTES })}
              min={LESSON_DEFAULTS.MIN_DURATION}
              step={LESSON_DEFAULTS.DURATION_STEP}
            />
          </div>

          <FormField
            label="Notes"
            type="text"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g., Focus on grammar review"
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (editingSchedule ? 'Save Changes' : 'Add Schedule')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Lesson Modal */}
      <Modal
        isOpen={!!completingLesson}
        onClose={() => setCompletingLesson(null)}
        title="Log Completed Lesson"
      >
        {completingLesson && (
          <>
            <div className="mb-4">
              <div className="font-medium">{completingLesson.student_name}</div>
              <div className="text-sm text-gray-500">
                {formatDateWithWeekday(completingLesson.date)} at {formatTime(completingLesson.time)} · {completingLesson.duration_minutes} min
              </div>
            </div>
            <FormField
              label="Lesson Notes"
              type="textarea"
              value={completeNotes}
              onChange={e => setCompleteNotes(e.target.value)}
              rows="4"
              placeholder="What did you cover in this lesson?"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setCompletingLesson(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging...' : 'Log Lesson'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message="Delete this scheduled lesson?"
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Lesson Action Modal */}
      <Modal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        title="Lesson Options"
        maxWidth="sm"
      >
        {selectedLesson && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b">
              <div className="font-medium text-lg">{selectedLesson.student_name}</div>
              <div className="text-sm text-gray-500">
                {formatDateWithWeekday(selectedLesson.date)} at {formatTime(selectedLesson.time)}
              </div>
              {selectedLesson.is_rescheduled && (
                <div className="text-xs text-orange-600 mt-1">
                  Rescheduled from {formatDate(selectedLesson.original_date)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => openCompleteModal(selectedLesson)}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Log Lesson
              </button>

              {selectedLesson.is_recurring_instance && !selectedLesson.is_rescheduled && (
                <>
                  <button
                    onClick={() => openRescheduleModal(selectedLesson)}
                    className="w-full py-3 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Skipping...' : 'Skip This Week'}
                  </button>
                </>
              )}

              {selectedLesson.is_rescheduled && (
                <button
                  onClick={handleUndoException}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Undoing...' : 'Undo Reschedule'}
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedLesson(null)}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!reschedulingLesson}
        onClose={() => setReschedulingLesson(null)}
        title="Reschedule Lesson"
        maxWidth="sm"
      >
        {reschedulingLesson && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 pb-2 border-b">
              Moving <strong>{reschedulingLesson.student_name}</strong>'s lesson from{' '}
              {formatDateWithWeekday(reschedulingLesson.date)}
            </div>

            <FormField
              label="New Date"
              type="date"
              value={rescheduleData.date}
              onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
              required
            />

            <FormField
              label="New Time"
              type="time"
              value={rescheduleData.time}
              onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })}
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setReschedulingLesson(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50"
                disabled={isSubmitting || !rescheduleData.date}
              >
                {isSubmitting ? 'Rescheduling...' : 'Reschedule'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
