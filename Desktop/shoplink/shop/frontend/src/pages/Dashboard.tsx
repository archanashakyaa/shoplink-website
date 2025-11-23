import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/api'
import ShopForm from '../components/ShopForm'
import ProductForm from '../components/ProductForm'
import EventForm from '../components/EventForm'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

interface Shop {
  id: number
  name: string
  category?: string
  description?: string
  logo_url?: string
  cover_photo_url?: string
  product_count: number
  followers_count: number
  [key: string]: any // Allow other shop properties
}

interface Product {
  id: number
  name: string
  price: number
  image_url?: string
  stock_quantity: number
  shop_id: number
}

interface Event {
  id: number
  title: string
  start_date: string
  status: string
  is_published: number
}

const Dashboard = () => {
  const { user } = useAuth()
  const [shops, setShops] = useState<Shop[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'shops' | 'products' | 'events'>('analytics')
  const [showShopForm, setShowShopForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [shopsRes, eventsRes] = await Promise.all([
        api.getUserShops(),
        api.getUserEvents(),
      ])

      if (shopsRes.status === 'success' && shopsRes.data) {
        setShops(shopsRes.data)
        // Load products for all shops
        const allProducts: Product[] = []
        for (const shop of shopsRes.data) {
          const productsRes = await api.getShopProducts(shop.id)
          if (productsRes.status === 'success' && productsRes.data) {
            allProducts.push(...productsRes.data)
          }
        }
        setProducts(allProducts)
      }

      if (eventsRes.status === 'success' && eventsRes.data) {
        setEvents(eventsRes.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShopCreated = () => {
    setShowShopForm(false)
    setEditingShop(null)
    loadData()
  }

  const handleProductCreated = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    loadData()
  }

  const handleEventCreated = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    loadData()
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Welcome, {user?.full_name || user?.email}!
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`${
              activeTab === 'shops'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Shops ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Events ({events.length})
          </button>
        </nav>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {/* Shops Tab */}
      {activeTab === 'shops' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Shops</h2>
            <button
              onClick={() => {
                setEditingShop(null)
                setShowShopForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create Shop
            </button>
          </div>
          {shops.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No shops yet. Create your first shop!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <div key={shop.id} className="bg-white rounded-lg shadow p-6">
                  {shop.logo_url && (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-16 h-16 rounded-full mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
                  {shop.category && (
                    <p className="text-sm text-gray-500 mb-2">Category: {shop.category}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {shop.description || 'No description'}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>{shop.product_count} products</span>
                    <span>{shop.followers_count} followers</span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/shops/${shop.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-md text-sm"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        setEditingShop(shop)
                        setShowShopForm(true)
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Products</h2>
            <button
              onClick={() => {
                setEditingProduct(null)
                setShowProductForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              disabled={shops.length === 0}
            >
              Add Product
            </button>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                {shops.length === 0
                  ? 'Create a shop first to add products'
                  : 'No products yet. Add your first product!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-lg font-bold text-blue-600 mb-2">${product.price}</p>
                    <p className="text-sm text-gray-500 mb-4">Stock: {product.stock_quantity}</p>
                    <div className="flex space-x-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-md text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setShowProductForm(true)
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Events</h2>
            <button
              onClick={() => {
                setEditingEvent(null)
                setShowEventForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Create Event
            </button>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No events yet. Create your first event!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Start: {new Date(event.start_date).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            event.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.status}
                        </span>
                        {event.is_published ? (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => {
                          setEditingEvent(event)
                          setShowEventForm(true)
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showShopForm && (
        <ShopForm
          shop={editingShop}
          onClose={() => {
            setShowShopForm(false)
            setEditingShop(null)
          }}
          onSuccess={handleShopCreated}
        />
      )}

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          shops={shops}
          onClose={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
          onSuccess={handleProductCreated}
        />
      )}

      {showEventForm && (
        <EventForm
          event={editingEvent}
          shops={shops}
          onClose={() => {
            setShowEventForm(false)
            setEditingEvent(null)
          }}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  )
}

export default Dashboard

