import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { studentsApi, lessonsApi } from '../api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 30,
    notes: '',
  })

  useEffect(() => {
    loadStudent()
  }, [id])

  async function loadStudent() {
    try {
      const data = await studentsApi.getOne(id)
      setStudent(data)
      setLessonForm(prev => ({ ...prev, hourly_rate: data.hourly_rate }))
    } catch (err) {
      console.error('Failed to load student:', err)
    } finally {
      setLoading(false)
    }
  }

  function openNewLessonForm() {
    setEditingLesson(null)
    setLessonForm({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
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
      alert('Failed to save lesson')
    }
  }

  async function togglePaid(lesson) {
    try {
      await lessonsApi.markPaid(lesson.id, !lesson.is_paid)
      loadStudent()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  async function deleteLesson(lessonId) {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    try {
      await lessonsApi.delete(lessonId)
      loadStudent()
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!student) {
    return <div className="text-center py-8">Student not found</div>
  }

  const unpaidLessons = student.lessons.filter(l => !l.is_paid)
  const unpaidTotal = unpaidLessons.reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0)

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
            <div className="px-6 py-8 text-center text-gray-500">No lessons yet</div>
          ) : (
            student.lessons.map((lesson) => (
              <div key={lesson.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{formatDate(lesson.date)}</span>
                      <span className="text-gray-500">{lesson.duration_minutes} min</span>
                      <span className="font-medium">{formatCurrency(lesson.hourly_rate * lesson.duration_minutes / 60)}</span>
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
                      onClick={() => deleteLesson(lesson.id)}
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
      {showLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h3>
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={lessonForm.date}
                    onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full border rounded-md px-3 py-2"
                    min="15"
                    step="15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (EUR)</label>
                <input
                  type="number"
                  value={lessonForm.hourly_rate}
                  onChange={(e) => setLessonForm({ ...lessonForm, hourly_rate: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Notes</label>
                <textarea
                  value={lessonForm.notes}
                  onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows="5"
                  placeholder="What did you cover in this lesson? Any homework assigned?"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLessonForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingLesson ? 'Save Changes' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
