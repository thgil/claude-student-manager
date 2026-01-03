import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lessonsApi, studentsApi } from '../api'
import { formatCurrency, formatDate, calculateLessonAmount } from '../utils/formatters'
import { LESSON_DEFAULTS } from '../constants'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Lessons() {
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ student_id: '', unpaid_only: false })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
    hourly_rate: LESSON_DEFAULTS.HOURLY_RATE,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    try {
      const [lessonsData, studentsData] = await Promise.all([
        lessonsApi.getAll({
          ...(filter.student_id && { student_id: filter.student_id }),
          ...(filter.unpaid_only && { unpaid_only: 'true' }),
        }),
        studentsApi.getAll(),
      ])
      setLessons(lessonsData)
      setStudents(studentsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setFormData({
      student_id: filter.student_id || '',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
      hourly_rate: LESSON_DEFAULTS.HOURLY_RATE,
      notes: '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.student_id) {
      setError('Please select a student')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await lessonsApi.create({
        ...formData,
        student_id: parseInt(formData.student_id),
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to add lesson:', err)
      setError('Failed to add lesson. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePaid(lesson) {
    try {
      await lessonsApi.markPaid(lesson.id, !lesson.is_paid)
      loadData()
    } catch (err) {
      console.error('Failed to update payment status:', err)
      setError('Failed to update payment status')
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setIsSubmitting(true)
    try {
      await lessonsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      console.error('Failed to delete lesson:', err)
      setError('Failed to delete lesson')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update rate when student changes
  function handleStudentChange(studentId) {
    const student = students.find(s => s.id === parseInt(studentId))
    setFormData({
      ...formData,
      student_id: studentId,
      hourly_rate: student?.hourly_rate || LESSON_DEFAULTS.HOURLY_RATE,
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
        <button
          onClick={openNewForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Lesson
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select
            id="student-filter"
            value={filter.student_id}
            onChange={(e) => setFilter({ ...filter, student_id: e.target.value })}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="unpaid-filter"
            checked={filter.unpaid_only}
            onChange={(e) => setFilter({ ...filter, unpaid_only: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="unpaid-filter" className="text-sm text-gray-700">Unpaid only</label>
        </div>
      </div>

      {/* Lessons List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {lessons.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState message="No lessons found" />
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Link to={`/students/${lesson.student_id}`} className="font-medium text-blue-600">
                    {lesson.student_name}
                  </Link>
                  <div className="text-sm text-gray-500">{formatDate(lesson.date, { weekday: 'short' })}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(calculateLessonAmount(lesson.hourly_rate, lesson.duration_minutes))}</div>
                  <div className="text-sm text-gray-500">{lesson.duration_minutes} min</div>
                </div>
              </div>
              {lesson.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-2 line-clamp-2">
                  {lesson.notes}
                </div>
              )}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => togglePaid(lesson)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    lesson.is_paid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {lesson.is_paid ? 'Paid' : 'Unpaid'}
                </button>
                <button onClick={() => setDeleteConfirm(lesson)} className="text-red-500 text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lessons List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <EmptyState message="No lessons found" />
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{formatDate(lesson.date, { weekday: 'short' })}</td>
                  <td className="px-6 py-4">
                    <Link to={`/students/${lesson.student_id}`} className="text-blue-600 hover:text-blue-800">
                      {lesson.student_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lesson.duration_minutes} min</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(calculateLessonAmount(lesson.hourly_rate, lesson.duration_minutes))}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePaid(lesson)}
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        lesson.is_paid
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {lesson.is_paid ? 'Paid' : 'Unpaid'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {lesson.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteConfirm(lesson)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Lesson"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Student"
            type="select"
            value={formData.student_id}
            onChange={(e) => handleStudentChange(e.target.value)}
            required
          >
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <FormField
              label="Duration (min)"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || LESSON_DEFAULTS.DURATION_MINUTES })}
              min={LESSON_DEFAULTS.MIN_DURATION}
              step={LESSON_DEFAULTS.DURATION_STEP}
            />
          </div>
          <FormField
            label="Hourly Rate (EUR)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
            min="0"
            step={LESSON_DEFAULTS.RATE_STEP}
          />
          <FormField
            label="Lesson Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="4"
            placeholder="What did you cover in this lesson?"
          />
          <div className="flex justify-end space-x-3 pt-4">
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
              {isSubmitting ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Lesson"
        message="Are you sure you want to delete this lesson?"
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}
