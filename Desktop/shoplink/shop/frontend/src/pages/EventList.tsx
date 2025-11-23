import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api'

interface Event {
  id: number
  title: string
  description?: string
  start_date: string
  end_date?: string
  venue_name?: string
  venue_address?: string
  ticket_price: number
  is_free: number
  max_attendees?: number
  registrations_count: number
  status: string
  is_published: number
}

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    loadEvents()
  }, [filter])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 50 }
      if (filter === 'published') {
        params.is_published = true
      } else if (filter === 'draft') {
        params.status = 'draft'
      }
      const response = await api.listEvents(params)
      if (response.status === 'success' && response.data) {
        setEvents(response.data)
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Events</h1>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-md ${
            filter === 'published'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Published
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-md ${
            filter === 'draft'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Drafts
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No events found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span>
                      📅 {new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString()}
                    </span>
                    {event.end_date && (
                      <span>
                        - {new Date(event.end_date).toLocaleDateString()} {new Date(event.end_date).toLocaleTimeString()}
                      </span>
                    )}
                    {event.venue_name && <span>📍 {event.venue_name}</span>}
                    {event.venue_address && <span>{event.venue_address}</span>}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold">
                      {event.is_free ? 'Free' : `$${event.ticket_price}`}
                    </span>
                    {event.max_attendees && (
                      <span className="text-sm text-gray-500">
                        {event.registrations_count}/{event.max_attendees} registered
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span
                    className={`px-3 py-1 rounded text-xs ${
                      event.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {event.status}
                  </span>
                  {event.is_published ? (
                    <span className="px-3 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Published
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventList

