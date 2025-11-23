import { useState, useEffect } from 'react'
import { api } from '../api/api'

interface Shop {
  id: number
  name: string
  category?: string
  description?: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  is_online_selling?: number
  is_offline_selling?: number
  logo_url?: string
  cover_photo_url?: string
}

interface ShopFormProps {
  shop?: Shop | null
  onClose: () => void
  onSuccess: () => void
}

const ShopForm: React.FC<ShopFormProps> = ({ shop, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    latitude: '',
    longitude: '',
    is_online_selling: true,
    is_offline_selling: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        category: shop.category || '',
        description: shop.description || '',
        address: shop.address || '',
        city: shop.city || '',
        state: shop.state || '',
        country: shop.country || '',
        phone: shop.phone || '',
        email: shop.email || '',
        website: shop.website || '',
        latitude: shop.latitude?.toString() || '',
        longitude: shop.longitude?.toString() || '',
        is_online_selling: shop.is_online_selling !== 0,
        is_offline_selling: shop.is_offline_selling === 1,
      })
      if (shop.logo_url) {
        setLogoPreview(shop.logo_url)
      }
      if (shop.cover_photo_url) {
        setCoverPreview(shop.cover_photo_url)
      }
    }
  }, [shop])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
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
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        is_online_selling: formData.is_online_selling ? 1 : 0,
        is_offline_selling: formData.is_offline_selling ? 1 : 0,
      }

      let response
      let shopId: number

      if (shop) {
        response = await api.updateShop(shop.id, data)
        shopId = shop.id
      } else {
        response = await api.createShop(data)
        if (response.status === 'success' && response.data) {
          shopId = response.data.id
        } else {
          setError(response.message || 'Failed to save shop')
          setLoading(false)
          return
        }
      }

      // Upload images if provided
      if (logoFile && shopId) {
        await api.uploadShopLogo(shopId, logoFile)
      }
      if (coverFile && shopId) {
        await api.uploadShopCover(shopId, coverFile)
      }

      if (response.status === 'success') {
        onSuccess()
      } else {
        setError(response.message || 'Failed to save shop')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{shop ? 'Edit Shop' : 'Create Shop'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shop Name *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
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
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo</label>
            {logoPreview && (
              <div className="mb-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-cover rounded-full border border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Cover Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
            {coverPreview && (
              <div className="mb-2">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_online_selling}
                onChange={(e) =>
                  setFormData({ ...formData, is_online_selling: e.target.checked })
                }
                className="mr-2"
              />
              Online Selling
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_offline_selling}
                onChange={(e) =>
                  setFormData({ ...formData, is_offline_selling: e.target.checked })
                }
                className="mr-2"
              />
              Offline Selling
            </label>
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
              {loading ? 'Saving...' : shop ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShopForm

