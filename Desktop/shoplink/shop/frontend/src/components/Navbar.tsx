import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">ShopLink</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/shops"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Shops
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Events
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  👤 Profile
                </Link>
                <span className="text-sm text-gray-700">{user?.full_name || user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

