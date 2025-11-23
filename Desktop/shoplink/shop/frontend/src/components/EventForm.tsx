import { useState, useEffect } from 'react'
import { api } from '../api/api'

interface Event {
  id: number
  shop_id?: number
  title: string
  description?: string
  event_type?: string
  category?: string
  start_date: string
  end_date?: string
  venue_name?: string
  venue_address?: string
  ticket_price?: number
  is_free?: number
  max_attendees?: number
  status?: string
  is_published?: number
}

interface Shop {
  id: number
  name: string
}

interface EventFormProps {
  event?: Event | null
  shops: Shop[]
  onClose: () => void
  onSuccess: () => void
}

const EventForm: React.FC<EventFormProps> = ({ event, shops, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    shop_id: '',
    title: '',
    description: '',
    event_type: '',
    category: '',
    start_date: '',
    end_date: '',
    venue_name: '',
    venue_address: '',
    ticket_price: '',
    is_free: true,
    max_attendees: '',
    status: 'draft',
    is_published: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (event) {
      setFormData({
        shop_id: event.shop_id?.toString() || '',
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        category: event.category || '',
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
        venue_name: event.venue_name || '',
        venue_address: event.venue_address || '',
        ticket_price: event.ticket_price?.toString() || '',
        is_free: event.is_free === 1,
        max_attendees: event.max_attendees?.toString() || '',
        status: event.status || 'draft',
        is_published: event.is_published === 1,
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data: any = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        category: formData.category,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        ticket_price: formData.is_free ? 0 : parseFloat(formData.ticket_price) || 0,
        is_free: formData.is_free,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        status: formData.status,
        is_published: formData.is_published ? 1 : 0,
      }

      if (formData.shop_id) {
        data.shop_id = parseInt(formData.shop_id)
      }

      let response
      if (event) {
        response = await api.updateEvent(event.id, data)
      } else {
        response = await api.createEvent(data)
      }

      if (response.status === 'success') {
        onSuccess()
      } else {
        setError(response.message || 'Failed to save event')
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
        <h2 className="text-2xl font-bold mb-4">{event ? 'Edit Event' : 'Create Event'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {shops.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop (Optional)</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.shop_id}
                onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
              >
                <option value="">None</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Title *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="datetime-local"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Venue Name</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Venue Address</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ticket Price</label>
              <input
                type="number"
                step="0.01"
                disabled={formData.is_free}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
              <input
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                className="mr-2"
              />
              Free Event
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="mr-2"
              />
              Published
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
              {loading ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventForm

