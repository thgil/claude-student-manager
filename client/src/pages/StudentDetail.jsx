import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { studentsApi, lessonsApi } from '../api'
import { formatCurrency, formatDate, calculateLessonAmount } from '../utils/formatters'
import { LESSON_DEFAULTS } from '../constants'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function StudentDetail() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
    hourly_rate: LESSON_DEFAULTS.HOURLY_RATE,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStudent()
  }, [id])

  async function loadStudent() {
    try {
      const data = await studentsApi.getOne(id)
      setStudent(data)
    } catch (err) {
      console.error('Failed to load student:', err)
      setError('Failed to load student')
    } finally {
      setLoading(false)
    }
  }

  function openNewLessonForm() {
    // Guard against null student
    if (!student) return

    setEditingLesson(null)
    setLessonForm({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: LESSON_DEFAULTS.DURATION_MINUTES,
      hourly_rate: student.hourly_rate,
      notes: '',
    })
    setShowLessonForm(true)
  }

  function openEditLessonForm(lesson) {
    setEditingLesson(lesson)
    setLessonForm({
      date: lesson.date,
      duration_minutes: lesson.duration_minutes,
      hourly_rate: lesson.hourly_rate,
      notes: lesson.notes || '',
    })
    setShowLessonForm(true)
  }

  async function handleLessonSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      if (editingLesson) {
        await lessonsApi.update(editingLesson.id, {
          ...lessonForm,
          is_paid: editingLesson.is_paid,
        })
      } else {
        await lessonsApi.create({
          ...lessonForm,
          student_id: parseInt(id),
        })
      }
      setShowLessonForm(false)
      loadStudent()
    } catch (err) {
      console.error('Failed to save lesson:', err)
      setError('Failed to save lesson. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePaid(lesson) {
    try {
      await lessonsApi.markPaid(lesson.id, !lesson.is_paid)
      loadStudent()
    } catch (err) {
      console.error('Failed to update payment status:', err)
      setError('Failed to update payment status')
    }
  }

  async function handleDeleteLesson() {
    if (!deleteConfirm) return
    setIsSubmitting(true)
    try {
      await lessonsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadStudent()
    } catch (err) {
      console.error('Failed to delete lesson:', err)
      setError('Failed to delete lesson')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Student not found</p>
        <Link to="/students" className="text-blue-600 hover:text-blue-800">
          ← Back to students
        </Link>
      </div>
    )
  }

  const unpaidLessons = student.lessons.filter(l => !l.is_paid)
  const unpaidTotal = unpaidLessons.reduce((sum, l) => sum + calculateLessonAmount(l.hourly_rate, l.duration_minutes), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/students" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
        </div>
        <button
          onClick={openNewLessonForm}
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

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact</h3>
            <div className="mt-1">
              {student.email && <div>{student.email}</div>}
              {student.phone && <div>{student.phone}</div>}
              {!student.email && !student.phone && <div className="text-gray-400">No contact info</div>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Hourly Rate</h3>
            <div className="mt-1 text-lg font-semibold">{formatCurrency(student.hourly_rate)}</div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Outstanding Balance</h3>
            <div className={`mt-1 text-lg font-semibold ${unpaidTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {unpaidTotal > 0 ? formatCurrency(unpaidTotal) : 'All paid'}
              {unpaidLessons.length > 0 && <span className="text-sm font-normal text-gray-500"> ({unpaidLessons.length} lessons)</span>}
            </div>
          </div>
        </div>
        {student.notes && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{student.notes}</div>
          </div>
        )}
      </div>

      {/* Lessons */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Lessons ({student.lessons.length})</h3>
        </div>
        <div className="divide-y">
          {student.lessons.length === 0 ? (
            <EmptyState
              message="No lessons yet"
              action="Add first lesson"
              onAction={openNewLessonForm}
            />
          ) : (
            student.lessons.map((lesson) => (
              <div key={lesson.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <span className="font-medium">{formatDate(lesson.date, { weekday: 'short' })}</span>
                      <span className="text-gray-500">{lesson.duration_minutes} min</span>
                      <span className="font-medium">{formatCurrency(calculateLessonAmount(lesson.hourly_rate, lesson.duration_minutes))}</span>
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
                    </div>
                    {lesson.notes && (
                      <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-3">
                        {lesson.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openEditLessonForm(lesson)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(lesson)}
                      className="text-red-500 hover:text-red-700"
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

      {/* Lesson Form Modal */}
      <Modal
        isOpen={showLessonForm}
        onClose={() => setShowLessonForm(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        maxWidth="lg"
      >
        <form onSubmit={handleLessonSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Date"
              type="date"
              value={lessonForm.date}
              onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
              required
            />
            <FormField
              label="Duration (min)"
              type="number"
              value={lessonForm.duration_minutes}
              onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || LESSON_DEFAULTS.DURATION_MINUTES })}
              min={LESSON_DEFAULTS.MIN_DURATION}
              step={LESSON_DEFAULTS.DURATION_STEP}
            />
          </div>
          <FormField
            label="Hourly Rate (EUR)"
            type="number"
            value={lessonForm.hourly_rate}
            onChange={(e) => setLessonForm({ ...lessonForm, hourly_rate: parseInt(e.target.value) || 0 })}
            min="0"
            step={LESSON_DEFAULTS.RATE_STEP}
          />
          <FormField
            label="Lesson Notes"
            type="textarea"
            value={lessonForm.notes}
            onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
            rows="5"
            placeholder="What did you cover in this lesson? Any homework assigned?"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowLessonForm(false)}
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
              {isSubmitting ? 'Saving...' : (editingLesson ? 'Save Changes' : 'Add Lesson')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteLesson}
        title="Delete Lesson"
        message="Are you sure you want to delete this lesson?"
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}
