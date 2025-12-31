import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { schedulesApi, studentsApi, lessonsApi } from '../api'

function formatTime(time) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Schedule() {
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [schedules, setSchedules] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    is_recurring: true,
    day_of_week: 'monday',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration_minutes: 60,
    notes: ''
  })

  // Complete lesson modal
  const [completingLesson, setCompletingLesson] = useState(null)
  const [completeNotes, setCompleteNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [schedulesData, upcomingData, studentsData] = await Promise.all([
        schedulesApi.getAll(),
        schedulesApi.getUpcoming(14),
        studentsApi.getAll()
      ])
      setSchedules(schedulesData)
      setUpcoming(upcomingData)
      setStudents(studentsData)
    } catch (err) {
      console.error('Failed to load schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setEditingSchedule(null)
    setFormData({
      student_id: '',
      is_recurring: true,
      day_of_week: 'monday',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration_minutes: 60,
      notes: ''
    })
    setShowForm(true)
  }

  function openEditForm(schedule) {
    setEditingSchedule(schedule)
    setFormData({
      student_id: schedule.student_id.toString(),
      is_recurring: schedule.is_recurring,
      day_of_week: schedule.day_of_week || 'monday',
      date: schedule.date || new Date().toISOString().split('T')[0],
      time: schedule.time,
      duration_minutes: schedule.duration_minutes,
      notes: schedule.notes || ''
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.student_id) {
      alert('Please select a student')
      return
    }

    try {
      if (editingSchedule) {
        await schedulesApi.update(editingSchedule.id, formData)
      } else {
        await schedulesApi.create(formData)
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to save schedule:', err)
      alert('Failed to save schedule')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this scheduled lesson?')) return
    try {
      await schedulesApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete schedule:', err)
    }
  }

  function openCompleteModal(lesson) {
    setCompletingLesson(lesson)
    setCompleteNotes(lesson.notes || '')
  }

  async function handleComplete() {
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
      alert('Failed to log lesson')
    }
  }

  // Get week dates for calendar view
  function getWeekDates() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const weekDates = getWeekDates()

  // Group upcoming by date for calendar
  function getLessonsForDate(date) {
    return upcoming.filter(l => l.date === date)
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

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {DAY_LABELS.map((day, i) => (
              <div key={day} className="p-2 md:p-3 text-center border-r last:border-r-0">
                <div className="text-xs text-gray-500">{day}</div>
                <div className={`text-sm md:text-lg font-semibold ${weekDates[i] === new Date().toISOString().split('T')[0] ? 'text-blue-600' : ''}`}>
                  {new Date(weekDates[i] + 'T00:00:00').getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDates.map((date, i) => {
              const dayLessons = getLessonsForDate(date)
              const isToday = date === new Date().toISOString().split('T')[0]
              return (
                <div key={date} className={`border-r last:border-r-0 p-1 md:p-2 ${isToday ? 'bg-blue-50' : ''}`}>
                  {dayLessons.map((lesson, idx) => (
                    <div
                      key={`${lesson.id}-${idx}`}
                      className="bg-blue-100 rounded p-1 md:p-2 mb-1 text-xs cursor-pointer hover:bg-blue-200"
                      onClick={() => openCompleteModal(lesson)}
                    >
                      <div className="font-medium truncate">{lesson.student_name}</div>
                      <div className="text-gray-600">{formatTime(lesson.time)}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
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
                <div className="px-6 py-8 text-center text-gray-500">
                  No upcoming lessons scheduled
                </div>
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
                          {formatDate(lesson.date)} at {formatTime(lesson.time)} · {lesson.duration_minutes} min
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
                <div className="px-6 py-8 text-center text-gray-500">
                  No recurring schedules set up
                </div>
              ) : (
                schedules.filter(s => s.is_recurring).map(schedule => (
                  <div key={schedule.id} className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <Link to={`/students/${schedule.student_id}`} className="font-medium text-blue-600">
                          {schedule.student_name}
                        </Link>
                        <div className="text-sm text-gray-500">
                          Every {schedule.day_of_week.charAt(0).toUpperCase() + schedule.day_of_week.slice(1)} at {formatTime(schedule.time)} · {schedule.duration_minutes} min
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(schedule)}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
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
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={formData.student_id}
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required={!formData.is_recurring}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full border rounded-md px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Focus on grammar review"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingSchedule ? 'Save Changes' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Lesson Modal */}
      {completingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setCompletingLesson(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Log Completed Lesson</h3>
            <div className="mb-4">
              <div className="font-medium">{completingLesson.student_name}</div>
              <div className="text-sm text-gray-500">
                {formatDate(completingLesson.date)} at {formatTime(completingLesson.time)} · {completingLesson.duration_minutes} min
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Notes</label>
              <textarea
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                rows="4"
                placeholder="What did you cover in this lesson?"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCompletingLesson(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Log Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
