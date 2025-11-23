import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

interface Event {
  id: number
  title: string
  description?: string
  event_type?: string
  category?: string
  start_date: string
  end_date?: string
  venue_name?: string
  venue_address?: string
  venue_city?: string
  venue_state?: string
  ticket_price: number
  is_free: number
  max_attendees?: number
  registrations_count: number
  status: string
  is_published: number
  meeting_url?: string
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (id) {
      loadEvent()
    }
  }, [id])

  const loadEvent = async () => {
    if (!id) return
    try {
      const response = await api.getEvent(parseInt(id))
      if (response.status === 'success' && response.data) {
        setEvent(response.data)
      }
    } catch (error) {
      console.error('Failed to load event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!event || !isAuthenticated) return
    setRegistering(true)
    try {
      const response = await api.registerEvent(event.id)
      if (response.status === 'success') {
        setRegistered(true)
        setEvent({
          ...event,
          registrations_count: event.registrations_count + 1,
        })
        alert('Successfully registered for the event!')
      } else {
        alert(response.message || 'Failed to register')
      }
    } catch (error) {
      alert('Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Event not found</div>
      </div>
    )
  }

  const isFull = event.max_attendees && event.registrations_count >= event.max_attendees

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

        <div className="flex items-center space-x-4 mb-6">
          <span
            className={`px-3 py-1 rounded text-sm ${
              event.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {event.status}
          </span>
          {event.is_published ? (
            <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800">
              Published
            </span>
          ) : (
            <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
              Draft
            </span>
          )}
        </div>

        {event.description && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-2">Event Details</h3>
            <div className="space-y-2 text-gray-700">
              {event.category && (
                <p>
                  <span className="font-medium">Category: </span>
                  {event.category}
                </p>
              )}
              {event.event_type && (
                <p>
                  <span className="font-medium">Type: </span>
                  {event.event_type}
                </p>
              )}
              <p>
                <span className="font-medium">Start: </span>
                {new Date(event.start_date).toLocaleString()}
              </p>
              {event.end_date && (
                <p>
                  <span className="font-medium">End: </span>
                  {new Date(event.end_date).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Venue Information</h3>
            <div className="space-y-2 text-gray-700">
              {event.venue_name && (
                <p>
                  <span className="font-medium">Venue: </span>
                  {event.venue_name}
                </p>
              )}
              {event.venue_address && (
                <p>
                  <span className="font-medium">Address: </span>
                  {event.venue_address}
                </p>
              )}
              {event.venue_city && event.venue_state && (
                <p>
                  {event.venue_city}, {event.venue_state}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {event.is_free ? 'Free Event' : `$${event.ticket_price}`}
              </p>
              {event.max_attendees && (
                <p className="text-sm text-gray-500 mt-1">
                  {event.registrations_count}/{event.max_attendees} registered
                </p>
              )}
            </div>
            {isAuthenticated && event.is_published && (
              <button
                onClick={handleRegister}
                disabled={registering || registered || isFull}
                className={`px-6 py-3 rounded-md font-medium ${
                  registered || isFull
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                {registered
                  ? 'Registered'
                  : isFull
                  ? 'Event Full'
                  : registering
                  ? 'Registering...'
                  : 'Register Now'}
              </button>
            )}
            {!isAuthenticated && event.is_published && (
              <p className="text-sm text-gray-500">Please login to register</p>
            )}
          </div>
        </div>

        {event.meeting_url && (
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">Meeting Link</h3>
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {event.meeting_url}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventDetail

