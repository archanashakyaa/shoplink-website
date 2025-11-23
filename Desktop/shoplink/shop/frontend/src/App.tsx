import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ShopList from './pages/ShopList'
import ShopDetail from './pages/ShopDetail'
import ProductDetail from './pages/ProductDetail'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Profile from './pages/Profile'
import Checkout from './pages/Checkout'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/shops" element={<ShopList />} />
            <Route path="/shops/:id" element={<ShopDetail />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

