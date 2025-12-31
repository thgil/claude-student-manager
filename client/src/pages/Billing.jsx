import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, lessonsApi, paymentsApi, studentsApi } from '../api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-')
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Billing() {
  const [tab, setTab] = useState('unpaid')
  const [unpaidByStudent, setUnpaidByStudent] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Payment collection state
  const [collectingFrom, setCollectingFrom] = useState(null)
  const [unpaidLessons, setUnpaidLessons] = useState([])
  const [selectedLessons, setSelectedLessons] = useState([])
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentNotes, setPaymentNotes] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  async function openCollectPayment(student) {
    setCollectingFrom(student)
    try {
      const lessons = await lessonsApi.getAll({ student_id: student.id, unpaid_only: 'true' })
      setUnpaidLessons(lessons)
      setSelectedLessons(lessons.map(l => l.id))
      setPaymentAmount(lessons.reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0))
      setPaymentNotes('')
    } catch (err) {
      console.error('Failed to load unpaid lessons:', err)
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
      .reduce((sum, l) => sum + (l.hourly_rate * l.duration_minutes / 60), 0)
    setPaymentAmount(total)
  }

  async function recordPayment() {
    if (selectedLessons.length === 0) {
      alert('Please select at least one lesson')
      return
    }

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
      alert('Failed to record payment')
    }
  }

  async function markAllPaid(studentId) {
    const lessons = await lessonsApi.getAll({ student_id: studentId, unpaid_only: 'true' })
    if (lessons.length === 0) return

    const lessonIds = lessons.map(l => l.id)
    try {
      await lessonsApi.markMultiplePaid(lessonIds)
      loadData()
    } catch (err) {
      console.error('Failed to mark lessons as paid:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>

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
            <div className="px-6 py-12 text-center text-gray-500">
              All caught up! No outstanding balances.
            </div>
          ) : (
            <div className="divide-y">
              {unpaidByStudent.map((student) => (
                <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <Link to={`/students/${student.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {student.name}
                    </Link>
                    <div className="text-sm text-gray-500">{student.unpaid_count} unpaid lessons</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(student.unpaid_amount)}
                    </div>
                    <button
                      onClick={() => openCollectPayment(student)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Collect Payment
                    </button>
                    <button
                      onClick={() => markAllPaid(student.id)}
                      className="text-gray-600 hover:text-gray-800 px-3 py-2"
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
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No data yet
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
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No payments recorded yet
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
      {collectingFrom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Collect Payment from {collectingFrom.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select lessons to mark as paid:</label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                  {unpaidLessons.map((lesson) => (
                    <label key={lesson.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
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
                        {formatCurrency(lesson.hourly_rate * lesson.duration_minutes / 60)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full border rounded-md px-3 py-2"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Cash payment"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg">
                  Total: <span className="font-bold text-green-600">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => setCollectingFrom(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={recordPayment}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
