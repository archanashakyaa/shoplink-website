import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/api'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  name: string
  price: number
  image_url?: string
  shop_id: number
  shop_name: string
}

interface Order {
  id: number
  shop_id: number
  status: string
  total_amount: number
  currency: string
  payment_method: string
  created_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  name: string
  image_url?: string
}

const Profile = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>(
    searchParams.get('tab') === 'orders' ? 'orders' : 'cart'
  )
  const [updatingCart, setUpdatingCart] = useState<number | null>(null)

  useEffect(() => {
    loadData()
    if (searchParams.get('success') === 'true') {
      alert('Order placed successfully!')
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cartRes, ordersRes] = await Promise.all([
        api.getCart(),
        api.getOrders(),
      ])

      if (cartRes.status === 'success' && cartRes.data) {
        setCartItems(cartRes.data)
      }

      if (ordersRes.status === 'success' && ordersRes.data) {
        // Load order items for each order
        const ordersWithItems = await Promise.all(
          ordersRes.data.map(async (order: Order) => {
            const orderDetailRes = await api.getOrder(order.id)
            if (orderDetailRes.status === 'success' && orderDetailRes.data) {
              return orderDetailRes.data
            }
            return order
          })
        )
        setOrders(ordersWithItems)
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId)
      return
    }

    setUpdatingCart(productId)
    try {
      const response = await api.updateCartItem(productId, newQuantity)
      if (response.status === 'success') {
        loadData()
      }
    } catch (error) {
      console.error('Failed to update cart:', error)
    } finally {
      setUpdatingCart(null)
    }
  }

  const handleRemoveFromCart = async (productId: number) => {
    try {
      const response = await api.removeFromCart(productId)
      if (response.status === 'success') {
        loadData()
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error)
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        const response = await api.clearCart()
        if (response.status === 'success') {
          loadData()
        }
      } catch (error) {
        console.error('Failed to clear cart:', error)
      }
    }
  }

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.full_name || user?.email}'s Profile
        </h1>
        <p className="text-gray-600">Manage your cart and view your order history</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('cart')}
            className={`${
              activeTab === 'cart'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Shopping Cart ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Order History ({orders.length})
          </button>
        </nav>
      </div>

      {/* Cart Tab */}
      {activeTab === 'cart' && (
        <div>
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
              <Link
                to="/shops"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Cart Items</h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="flex-shrink-0"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">Shop: {item.shop_name}</p>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            disabled={updatingCart === item.product_id}
                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updatingCart === item.product_id}
                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Remove from cart"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateCartTotal())}
                    </span>
                  </div>
                  <Link
                    to="/checkout"
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium block text-center"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No orders yet</p>
              <Link
                to="/shops"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Order History</h2>
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Payment: {order.payment_method || 'N/A'}
                    </p>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="p-6">
                      <h4 className="font-semibold mb-4">Order Items:</h4>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md"
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <Link
                                to={`/products/${item.product_id}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {item.name}
                              </Link>
                              <p className="text-sm text-gray-500">
                                Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile

