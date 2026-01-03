import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentsApi } from '../api'
import { formatCurrency } from '../utils/formatters'
import { LESSON_DEFAULTS } from '../constants'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    hourly_rate: LESSON_DEFAULTS.HOURLY_RATE,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    try {
      const data = await studentsApi.getAll()
      setStudents(data)
    } catch (err) {
      console.error('Failed to load students:', err)
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setEditingStudent(null)
    setFormData({ name: '', email: '', phone: '', notes: '', hourly_rate: LESSON_DEFAULTS.HOURLY_RATE })
    setShowForm(true)
  }

  function openEditForm(student) {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      notes: student.notes || '',
      hourly_rate: student.hourly_rate,
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, formData)
      } else {
        await studentsApi.create(formData)
      }
      setShowForm(false)
      loadStudents()
    } catch (err) {
      console.error('Failed to save student:', err)
      setError('Failed to save student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setIsSubmitting(true)
    try {
      await studentsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadStudents()
    } catch (err) {
      console.error('Failed to delete student:', err)
      setError('Failed to delete student')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <button
          onClick={openNewForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Student
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Students List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              message="No students yet."
              action="Add your first student"
              onAction={openNewForm}
            />
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <Link to={`/students/${student.id}`} className="font-medium text-blue-600 text-lg">
                  {student.name}
                </Link>
                <div className="flex space-x-3">
                  <button onClick={() => openEditForm(student)} className="text-gray-500">Edit</button>
                  <button onClick={() => setDeleteConfirm(student)} className="text-red-500">Delete</button>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {formatCurrency(student.hourly_rate)}/hr · {student.lesson_count} lessons
              </div>
              {student.unpaid_count > 0 ? (
                <div className="text-red-600 text-sm font-medium">
                  {student.unpaid_count} unpaid ({formatCurrency(student.unpaid_amount)})
                </div>
              ) : (
                <div className="text-green-600 text-sm">All paid</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Students List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unpaid</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState
                    message="No students yet."
                    action="Add your first student"
                    onAction={openNewForm}
                  />
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/students/${student.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.email && <div>{student.email}</div>}
                    {student.phone && <div>{student.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(student.hourly_rate)}/hr
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.lesson_count}
                  </td>
                  <td className="px-6 py-4">
                    {student.unpaid_count > 0 ? (
                      <span className="text-red-600 font-medium">
                        {student.unpaid_count} ({formatCurrency(student.unpaid_amount)})
                      </span>
                    ) : (
                      <span className="text-green-600">All paid</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditForm(student)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(student)}
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

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <FormField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <FormField
            label="Hourly Rate (EUR)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
            min="0"
            step={LESSON_DEFAULTS.RATE_STEP}
          />
          <FormField
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
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
              {isSubmitting ? 'Saving...' : (editingStudent ? 'Save Changes' : 'Add Student')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteConfirm?.name}? This will also delete all their lessons and payments.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}
