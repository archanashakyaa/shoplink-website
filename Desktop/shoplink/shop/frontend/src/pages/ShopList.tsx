import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api'

interface Shop {
  id: number
  name: string
  category?: string
  description?: string
  logo_url?: string
  cover_photo_url?: string
  city?: string
  state?: string
  rating: number
  reviews_count: number
  followers_count: number
  product_count: number
}

const ShopList = () => {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')

  useEffect(() => {
    loadShops()
  }, [category])

  const loadShops = async () => {
    setLoading(true)
    try {
      const response = await api.listShops({ category: category || undefined, limit: 50 })
      if (response.status === 'success' && response.data) {
        setShops(response.data)
      }
    } catch (error) {
      console.error('Failed to load shops:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading shops...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Shops</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by category..."
          className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No shops found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              to={`/shops/${shop.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {shop.cover_photo_url ? (
                <img
                  src={shop.cover_photo_url}
                  alt={shop.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Cover Photo</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <span className="text-gray-400 text-xs">No Logo</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{shop.name}</h3>
                    {shop.category && (
                      <p className="text-sm text-gray-500">{shop.category}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {shop.description || 'No description'}
                </p>
                {shop.city && shop.state && (
                  <p className="text-sm text-gray-500 mb-4">
                    📍 {shop.city}, {shop.state}
                  </p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>⭐ {shop.rating.toFixed(1)} ({shop.reviews_count})</span>
                  <span>{shop.product_count} products</span>
                  <span>{shop.followers_count} followers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopList

