import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Lessons from './pages/Lessons'
import Schedule from './pages/Schedule'
import Billing from './pages/Billing'
import Materials from './pages/Materials'
import Whiteboard from './pages/Whiteboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Desktop nav */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Japanese Tutoring</h1>
              <div className="flex space-x-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/students"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Students
                </NavLink>
                <NavLink
                  to="/lessons"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Lessons
                </NavLink>
                <NavLink
                  to="/schedule"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Schedule
                </NavLink>
                <NavLink
                  to="/billing"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Billing
                </NavLink>
                <NavLink
                  to="/materials"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Materials
                </NavLink>
                <NavLink
                  to="/whiteboard"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Whiteboard
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <div className="md:hidden bg-white shadow-sm border-b px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 text-center">Japanese Tutoring</h1>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
        </Routes>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </NavLink>
          <NavLink
            to="/students"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Students
          </NavLink>
          <NavLink
            to="/lessons"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Lessons
          </NavLink>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </NavLink>
          <NavLink
            to="/billing"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Billing
          </NavLink>
          <NavLink
            to="/materials"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Materials
          </NavLink>
          <NavLink
            to="/whiteboard"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Draw
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

export default App
