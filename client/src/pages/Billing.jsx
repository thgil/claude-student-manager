import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, lessonsApi, paymentsApi } from '../api'
import { formatCurrency, formatDate, formatMonth, calculateLessonAmount } from '../utils/formatters'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import EmptyState from '../components/EmptyState'

export default function Billing() {
  const [tab, setTab] = useState('unpaid')
  const [unpaidByStudent, setUnpaidByStudent] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Payment collection state
  const [collectingFrom, setCollectingFrom] = useState(null)
  const [unpaidLessons, setUnpaidLessons] = useState([])
  const [selectedLessons, setSelectedLessons] = useState([])
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [unpaidData, monthlyData, paymentsData] = await Promise.all([
        dashboardApi.getUnpaidByStudent(),
        dashboardApi.getMonthlySummary(),
        paymentsApi.getAll(),
      ])
      setUnpaidByStudent(unpaidData)
      setMonthlySummary(monthlyData)
      setPayments(paymentsData)
    } catch (err) {
      console.error('Failed to load billing data:', err)
      setError('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  async function openCollectPayment(student) {
    setCollectingFrom(student)
    setError(null)
    try {
      const lessons = await lessonsApi.getAll({ student_id: student.id, unpaid_only: 'true' })
      setUnpaidLessons(lessons)
      setSelectedLessons(lessons.map(l => l.id))
      setPaymentAmount(lessons.reduce((sum, l) => sum + calculateLessonAmount(l.hourly_rate, l.duration_minutes), 0))
      setPaymentNotes('')
    } catch (err) {
      console.error('Failed to load unpaid lessons:', err)
      setError('Failed to load unpaid lessons')
      setCollectingFrom(null)
    }
  }

  function toggleLesson(lessonId) {
    let newSelected
    if (selectedLessons.includes(lessonId)) {
      newSelected = selectedLessons.filter(id => id !== lessonId)
    } else {
      newSelected = [...selectedLessons, lessonId]
    }
    setSelectedLessons(newSelected)

    // Recalculate amount
    const total = unpaidLessons
      .filter(l => newSelected.includes(l.id))
      .reduce((sum, l) => sum + calculateLessonAmount(l.hourly_rate, l.duration_minutes), 0)
    setPaymentAmount(total)
  }

  async function recordPayment() {
    if (selectedLessons.length === 0) {
      setError('Please select at least one lesson')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await paymentsApi.create({
        student_id: collectingFrom.id,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        notes: paymentNotes,
        lesson_ids: selectedLessons,
      })
      setCollectingFrom(null)
      loadData()
    } catch (err) {
      console.error('Failed to record payment:', err)
      setError('Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function markAllPaid(studentId) {
    setIsSubmitting(true)
    setError(null)
    try {
      const lessons = await lessonsApi.getAll({ student_id: studentId, unpaid_only: 'true' })
      if (lessons.length === 0) return

      const lessonIds = lessons.map(l => l.id)
      await lessonsApi.markMultiplePaid(lessonIds)
      loadData()
    } catch (err) {
      console.error('Failed to mark lessons as paid:', err)
      setError('Failed to mark lessons as paid')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setTab('unpaid')}
            className={`py-3 border-b-2 font-medium text-sm ${
              tab === 'unpaid'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Outstanding Balances
          </button>
          <button
            onClick={() => setTab('monthly')}
            className={`py-3 border-b-2 font-medium text-sm ${
              tab === 'monthly'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly Summary
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`py-3 border-b-2 font-medium text-sm ${
              tab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {/* Outstanding Balances Tab */}
      {tab === 'unpaid' && (
        <div className="bg-white rounded-lg shadow">
          {unpaidByStudent.length === 0 ? (
            <EmptyState message="All caught up! No outstanding balances." />
          ) : (
            <div className="divide-y">
              {unpaidByStudent.map((student) => (
                <div key={student.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Link to={`/students/${student.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {student.name}
                    </Link>
                    <div className="text-sm text-gray-500">{student.unpaid_count} unpaid lessons</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(student.unpaid_amount)}
                    </div>
                    <button
                      onClick={() => openCollectPayment(student)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      disabled={isSubmitting}
                    >
                      Collect Payment
                    </button>
                    <button
                      onClick={() => markAllPaid(student.id)}
                      className="text-gray-600 hover:text-gray-800 px-3 py-2"
                      disabled={isSubmitting}
                    >
                      Mark All Paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary Tab */}
      {tab === 'monthly' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlySummary.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState message="No data yet" />
                  </td>
                </tr>
              ) : (
                monthlySummary.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{formatMonth(month.month)}</td>
                    <td className="px-6 py-4 text-gray-500">{month.lesson_count}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(month.total_amount)}</td>
                    <td className="px-6 py-4 text-green-600">{formatCurrency(month.paid_amount)}</td>
                    <td className="px-6 py-4 text-red-600">
                      {month.unpaid_amount > 0 ? formatCurrency(month.unpaid_amount) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment History Tab */}
      {tab === 'payments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lessons</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState message="No payments recorded yet" />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{formatDate(payment.date)}</td>
                    <td className="px-6 py-4">
                      <Link to={`/students/${payment.student_id}`} className="text-blue-600 hover:text-blue-800">
                        {payment.student_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {payment.lessons?.length || 0} lessons
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{payment.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!collectingFrom}
        onClose={() => setCollectingFrom(null)}
        title={`Collect Payment from ${collectingFrom?.name}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select lessons to mark as paid:</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {unpaidLessons.map((lesson) => (
                <label key={lesson.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLessons.includes(lesson.id)}
                    onChange={() => toggleLesson(lesson.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1">
                    {formatDate(lesson.date)} - {lesson.duration_minutes} min
                  </span>
                  <span className="font-medium">
                    {formatCurrency(calculateLessonAmount(lesson.hourly_rate, lesson.duration_minutes))}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <FormField
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
          />

          <FormField
            label="Notes (optional)"
            type="text"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="e.g., Cash payment"
          />

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg">
              Total: <span className="font-bold text-green-600">{formatCurrency(paymentAmount)}</span>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => setCollectingFrom(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={recordPayment}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
