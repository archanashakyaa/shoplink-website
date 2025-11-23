import { useState, useEffect } from 'react'
import { api } from '../api/api'

interface Product {
  id: number
  shop_id: number
  name: string
  description?: string
  price: number
  original_price?: number
  stock_quantity: number
  category?: string
  sku?: string
  image_url?: string
}

interface Shop {
  id: number
  name: string
}

interface ProductFormProps {
  product?: Product | null
  shops: Shop[]
  onClose: () => void
  onSuccess: () => void
}

const ProductForm: React.FC<ProductFormProps> = ({ product, shops, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    shop_id: shops.length > 0 ? shops[0].id : 0,
    name: '',
    description: '',
    price: '',
    original_price: '',
    stock_quantity: '',
    category: '',
    sku: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        shop_id: product.shop_id,
        name: product.name || '',
        description: product.description || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        stock_quantity: product.stock_quantity.toString(),
        category: product.category || '',
        sku: product.sku || '',
      })
      if (product.image_url) {
        setImagePreview(product.image_url)
      }
    } else if (shops.length > 0) {
      setFormData({ ...formData, shop_id: shops[0].id })
    }
  }, [product, shops])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        shop_id: formData.shop_id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category: formData.category,
        sku: formData.sku,
      }

      let response
      let productId: number

      if (product) {
        response = await api.updateProduct(product.id, data)
        productId = product.id
      } else {
        response = await api.createProduct(data)
        if (response.status === 'success' && response.data) {
          productId = response.data.id
        } else {
          setError(response.message || 'Failed to save product')
          setLoading(false)
          return
        }
      }

      // Upload image if provided
      if (imageFile && productId) {
        await api.uploadProductImage(productId, imageFile)
      }

      if (response.status === 'success') {
        onSuccess()
      } else {
        setError(response.message || 'Failed to save product')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (shops.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="mb-4">You need to create a shop first before adding products.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{product ? 'Edit Product' : 'Add Product'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shop *</label>
            <select
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.shop_id}
              onChange={(e) => setFormData({ ...formData, shop_id: parseInt(e.target.value) })}
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price *</label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Original Price</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
              <input
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          
          {/* Product Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            {imagePreview && (
              <div className="mb-2">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-64 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm

