import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lessonsApi, studentsApi } from '../api'

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

export default function Lessons() {
  const [lessons, setLessons] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ student_id: '', unpaid_only: false })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    hourly_rate: 30,
    notes: '',
  })

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
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setFormData({
      student_id: filter.student_id || '',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: 60,
      hourly_rate: 30,
      notes: '',
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
      await lessonsApi.create({
        ...formData,
        student_id: parseInt(formData.student_id),
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to add lesson:', err)
      alert('Failed to add lesson')
    }
  }

  async function togglePaid(lesson) {
    try {
      await lessonsApi.markPaid(lesson.id, !lesson.is_paid)
      loadData()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  async function deleteLesson(id) {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    try {
      await lessonsApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete lesson:', err)
    }
  }

  // Update rate when student changes
  function handleStudentChange(studentId) {
    const student = students.find(s => s.id === parseInt(studentId))
    setFormData({
      ...formData,
      student_id: studentId,
      hourly_rate: student?.hourly_rate || 3000,
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select
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
            id="unpaid"
            checked={filter.unpaid_only}
            onChange={(e) => setFilter({ ...filter, unpaid_only: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="unpaid" className="text-sm text-gray-700">Unpaid only</label>
        </div>
      </div>

      {/* Lessons List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {lessons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No lessons found
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Link to={`/students/${lesson.student_id}`} className="font-medium text-blue-600">
                    {lesson.student_name}
                  </Link>
                  <div className="text-sm text-gray-500">{formatDate(lesson.date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(lesson.hourly_rate * lesson.duration_minutes / 60)}</div>
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
                <button onClick={() => deleteLesson(lesson.id)} className="text-red-500 text-sm">
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
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No lessons found
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{formatDate(lesson.date)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/students/${lesson.student_id}`} className="text-blue-600 hover:text-blue-800">
                      {lesson.student_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lesson.duration_minutes} min</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(lesson.hourly_rate * lesson.duration_minutes / 60)}
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
                      onClick={() => deleteLesson(lesson.id)}
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
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add New Lesson</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
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
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-md px-3 py-2"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows="4"
                  placeholder="What did you cover in this lesson?"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
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
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
