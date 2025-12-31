import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Lessons from './pages/Lessons'
import Billing from './pages/Billing'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
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
                  to="/billing"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  Billing
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
