import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

interface Shop {
  id: number
  name: string
  category?: string
  description?: string
  logo_url?: string
  cover_photo_url?: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  rating: number
  reviews_count: number
  followers_count: number
  product_count: number
  owner_id: number
}

interface Product {
  id: number
  name: string
  price: number
  original_price?: number
  discount_percentage?: number
  image_url?: string
  stock_quantity: number
  rating: number
  reviews_count: number
}

const ShopDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadShop()
      loadProducts()
      if (isAuthenticated) {
        checkFollowStatus()
      }
    }
  }, [id, isAuthenticated])

  const loadShop = async () => {
    if (!id) return
    try {
      const response = await api.getShop(parseInt(id))
      if (response.status === 'success' && response.data) {
        setShop(response.data)
      }
    } catch (error) {
      console.error('Failed to load shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    if (!id) return
    try {
      const response = await api.getShopProducts(parseInt(id))
      if (response.status === 'success' && response.data) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const checkFollowStatus = async () => {
    if (!id) return
    try {
      const response = await api.checkFollowStatus(parseInt(id))
      if (response.status === 'success' && response.data) {
        setIsFollowing(response.data.is_following)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!id) return
    setFollowLoading(true)
    try {
      let response
      if (isFollowing) {
        response = await api.unfollowShop(parseInt(id))
      } else {
        response = await api.followShop(parseInt(id))
      }
      if (response.status === 'success') {
        setIsFollowing(!isFollowing)
        if (shop) {
          setShop({
            ...shop,
            followers_count: isFollowing ? shop.followers_count - 1 : shop.followers_count + 1,
          })
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Shop not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cover Photo */}
      {shop.cover_photo_url ? (
        <div className="relative h-64 mb-6 rounded-lg overflow-hidden">
          <img
            src={shop.cover_photo_url}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-64 bg-gray-200 mb-6 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">No Cover Photo</span>
        </div>
      )}

      {/* Shop Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-24 h-24 rounded-full mr-6"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mr-6">
                <span className="text-gray-400">No Logo</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              {shop.category && (
                <p className="text-lg text-gray-500 mb-2">{shop.category}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>⭐ {shop.rating.toFixed(1)} ({shop.reviews_count} reviews)</span>
                <span>{shop.followers_count} followers</span>
                <span>{shop.product_count} products</span>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-2 rounded-md font-medium ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {shop.description && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-700">{shop.description}</p>
        </div>
      )}

      {/* Contact Info */}
      {(shop.address || shop.city || shop.phone || shop.email || shop.website) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shop.address && (
              <div>
                <span className="font-medium">Address: </span>
                <span className="text-gray-600">{shop.address}</span>
              </div>
            )}
            {shop.city && shop.state && (
              <div>
                <span className="font-medium">Location: </span>
                <span className="text-gray-600">
                  {shop.city}, {shop.state} {shop.country && `, ${shop.country}`}
                </span>
              </div>
            )}
            {shop.phone && (
              <div>
                <span className="font-medium">Phone: </span>
                <span className="text-gray-600">{shop.phone}</span>
              </div>
            )}
            {shop.email && (
              <div>
                <span className="font-medium">Email: </span>
                <span className="text-gray-600">{shop.email}</span>
              </div>
            )}
            {shop.website && (
              <div>
                <span className="font-medium">Website: </span>
                <a
                  href={shop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {shop.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
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
                  <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-blue-600">${product.price}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.original_price}
                      </span>
                    )}
                  </div>
                  {product.discount_percentage && (
                    <span className="text-sm text-green-600">
                      {product.discount_percentage.toFixed(0)}% off
                    </span>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <span>⭐ {product.rating.toFixed(1)}</span>
                    <span className="ml-2">Stock: {product.stock_quantity}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopDetail

