import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

interface Product {
  id: number
  shop_id: number
  name: string
  description?: string
  price: number
  original_price?: number
  discount_percentage?: number
  image_url?: string
  stock_quantity: number
  category?: string
  rating: number
  reviews_count: number
  views_count: number
  sales_count: number
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  const loadProduct = async () => {
    if (!id) return
    try {
      const response = await api.getProduct(parseInt(id))
      if (response.status === 'success' && response.data) {
        setProduct(response.data)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) return
    setAddingToCart(true)
    try {
      const response = await api.addToCart(product.id, quantity)
      if (response.status === 'success') {
        alert('Added to cart!')
      } else {
        alert(response.message || 'Failed to add to cart')
      }
    } catch (error) {
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Product not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          {product.category && (
            <p className="text-lg text-gray-500 mb-4">Category: {product.category}</p>
          )}

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-3xl font-bold text-blue-600">${product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${product.original_price}
                  </span>
                  {product.discount_percentage && (
                    <span className="text-lg text-green-600">
                      {product.discount_percentage.toFixed(0)}% off
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>⭐ {product.rating.toFixed(1)} ({product.reviews_count} reviews)</span>
              <span>{product.views_count} views</span>
              <span>{product.sales_count} sold</span>
            </div>
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-1 border border-gray-300 rounded-md text-center"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {product.stock_quantity} available
              </span>
            </div>

            {product.stock_quantity > 0 ? (
              <div className="space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50"
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">Please login to add to cart</p>
                )}
              </div>
            ) : (
              <p className="text-red-600 font-medium">Out of Stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

