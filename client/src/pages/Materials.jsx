import { useState, useEffect } from 'react'
import { materialsApi, studentsApi } from '../api'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

const MATERIAL_TYPES = [
  { value: 'link', label: 'Link', icon: '🔗' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'document', label: 'Document', icon: '📄' },
  { value: 'worksheet', label: 'Worksheet', icon: '📝' },
]

function getTypeIcon(type) {
  const found = MATERIAL_TYPES.find(t => t.value === type)
  return found?.icon || '📎'
}

function getTypeLabel(type) {
  const found = MATERIAL_TYPES.find(t => t.value === type)
  return found?.label || type
}

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    type: 'link',
    url: '',
    description: '',
    student_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [filterStudent, setFilterStudent] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [materialsData, studentsData] = await Promise.all([
        materialsApi.getAll(),
        studentsApi.getAll()
      ])
      setMaterials(materialsData)
      setStudents(studentsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  function openNewForm() {
    setEditingMaterial(null)
    setFormData({ title: '', type: 'link', url: '', description: '', student_id: '' })
    setShowForm(true)
  }

  function openEditForm(material) {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      type: material.type,
      url: material.url || '',
      description: material.description || '',
      student_id: material.student_id?.toString() || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, formData)
      } else {
        await materialsApi.create(formData)
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to save material:', err)
      setError('Failed to save material. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setIsSubmitting(true)
    try {
      await materialsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      console.error('Failed to delete material:', err)
      setError('Failed to delete material')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    if (filterType && m.type !== filterType) return false
    if (filterStudent) {
      if (filterStudent === 'shared') {
        if (m.student_id !== null) return false
      } else {
        const studentId = parseInt(filterStudent)
        if (m.student_id !== studentId && m.student_id !== null) return false
      }
    }
    return true
  })

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Materials & Resources</h2>
        <button
          onClick={openNewForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {MATERIAL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Materials</option>
          <option value="shared">Shared (All Students)</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {(filterType || filterStudent) && (
          <button
            onClick={() => { setFilterType(''); setFilterStudent(''); }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Materials List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              message="No materials found."
              action="Add your first material"
              onAction={openNewForm}
            />
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-xl">{getTypeIcon(material.type)}</span>
                  <div>
                    {material.url ? (
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {material.title}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-900">{material.title}</span>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {getTypeLabel(material.type)}
                      {material.student_name && (
                        <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {material.student_name}
                        </span>
                      )}
                      {!material.student_id && (
                        <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => openEditForm(material)} className="text-gray-500">Edit</button>
                  <button onClick={() => setDeleteConfirm(material)} className="text-red-500">Delete</button>
                </div>
              </div>
              {material.description && (
                <p className="text-sm text-gray-600 mt-2">{material.description}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Materials List - Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">For Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <EmptyState
                    message="No materials found."
                    action="Add your first material"
                    onAction={openNewForm}
                  />
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(material.type)}</span>
                      {material.url ? (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {material.title}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900">{material.title}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getTypeLabel(material.type)}
                  </td>
                  <td className="px-6 py-4">
                    {material.student_name ? (
                      <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {material.student_name}
                      </span>
                    ) : (
                      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                        Shared
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {material.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditForm(material)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(material)}
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
        title={editingMaterial ? 'Edit Material' : 'Add New Material'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Hiragana Practice Sheet"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              {MATERIAL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          <FormField
            label="URL"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com/resource"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              For Student
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Shared (All Students)</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to share with all students
            </p>
          </div>

          <FormField
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            placeholder="Brief description of this resource..."
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
              {isSubmitting ? 'Saving...' : (editingMaterial ? 'Save Changes' : 'Add Material')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}
