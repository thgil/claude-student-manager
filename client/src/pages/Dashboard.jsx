import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, schedulesApi } from '../api'
import { formatCurrency, formatDate, formatTime, formatUpcomingDate, calculateLessonAmount } from '../utils/formatters'
import { SCHEDULE } from '../constants'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentLessons, setRecentLessons] = useState([])
  const [unpaidByStudent, setUnpaidByStudent] = useState([])
  const [upcomingLessons, setUpcomingLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setError(null)
    try {
      const [statsData, lessonsData, unpaidData, upcomingData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentLessons(),
        dashboardApi.getUnpaidByStudent(),
        schedulesApi.getUpcoming(SCHEDULE.DASHBOARD_PREVIEW_DAYS),
      ])
      setStats(statsData)
      setRecentLessons(lessonsData)
      setUnpaidByStudent(unpaidData)
      setUpcomingLessons(upcomingData)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    localStorage.removeItem('tutoring-data')
    window.location.reload()
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => { setLoading(true); load() }}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500">Students</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500">This Month</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.monthlyLessons || 0} <span className="text-base font-normal text-gray-500">lessons</span></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500">Earnings</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">{formatCurrency(stats?.monthlyEarnings || 0)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="text-xs md:text-sm text-gray-500">Outstanding</div>
          <div className="text-xl md:text-3xl font-bold text-red-600">{formatCurrency(stats?.unpaidAmount || 0)}</div>
          <div className="text-xs text-gray-400">{stats?.unpaidLessons || 0} unpaid</div>
        </div>
      </div>

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming Lessons</h3>
            <Link to="/schedule" className="text-blue-600 hover:text-blue-800 text-sm">
              View schedule →
            </Link>
          </div>
          <div className="divide-y">
            {upcomingLessons.slice(0, SCHEDULE.DASHBOARD_PREVIEW_COUNT).map((lesson, idx) => (
              <div key={`${lesson.id}-${lesson.date}-${idx}`} className="px-4 md:px-6 py-3 flex items-center justify-between">
                <div>
                  <Link to={`/students/${lesson.student_id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {lesson.student_name}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {formatUpcomingDate(lesson.date)} at {formatTime(lesson.time)}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {lesson.duration_minutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Recent Lessons */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Lessons</h3>
          </div>
          <div className="divide-y">
            {recentLessons.length === 0 ? (
              <EmptyState message="No lessons yet" />
            ) : (
              recentLessons.slice(0, 5).map((lesson) => (
                <div key={lesson.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <Link to={`/students/${lesson.student_id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {lesson.student_name}
                    </Link>
                    <div className="text-sm text-gray-500">{formatDate(lesson.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(calculateLessonAmount(lesson.hourly_rate, lesson.duration_minutes))}</div>
                    <div className={`text-sm ${lesson.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                      {lesson.is_paid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentLessons.length > 0 && (
            <div className="px-6 py-4 border-t">
              <Link to="/lessons" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all lessons →
              </Link>
            </div>
          )}
        </div>

        {/* Unpaid by Student */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Outstanding Balances</h3>
          </div>
          <div className="divide-y">
            {unpaidByStudent.length === 0 ? (
              <EmptyState message="All caught up!" />
            ) : (
              unpaidByStudent.map((student) => (
                <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <Link to={`/students/${student.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {student.name}
                    </Link>
                    <div className="text-sm text-gray-500">{student.unpaid_count} unpaid lessons</div>
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(student.unpaid_amount)}
                  </div>
                </div>
              ))
            )}
          </div>
          {unpaidByStudent.length > 0 && (
            <div className="px-6 py-4 border-t">
              <Link to="/billing" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Go to billing →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Reset to sample data
        </button>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Data"
        message="Reset all data? This will clear all students, lessons, and schedules and reload with sample data."
        confirmText="Reset"
        variant="danger"
      />
    </div>
  )
}
