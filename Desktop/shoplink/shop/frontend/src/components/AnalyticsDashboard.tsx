import { useState, useEffect } from 'react'
import { api } from '../api/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

interface AnalyticsData {
  sales: any
  events: any
  activity: any
  alerts: any[]
}

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'events' | 'activity'>('all')

  useEffect(() => {
    loadAnalytics()
  }, [startDate, endDate])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [salesRes, eventsRes, activityRes, alertsRes] = await Promise.all([
        api.getSalesAnalytics(startDate || undefined, endDate || undefined),
        api.getEventAnalytics(startDate || undefined, endDate || undefined),
        api.getActivityAnalytics(),
        api.getAlerts(),
      ])

      setData({
        sales: salesRes.status === 'success' ? salesRes.data : null,
        events: eventsRes.status === 'success' ? eventsRes.data : null,
        activity: activityRes.status === 'success' ? activityRes.data : null,
        alerts: alertsRes.status === 'success' ? alertsRes.data : [],
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8">No analytics data available</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-md ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('sales')}
                  className={`px-4 py-2 rounded-md ${
                    activeFilter === 'sales'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sales
                </button>
                <button
                  onClick={() => setActiveFilter('events')}
                  className={`px-4 py-2 rounded-md ${
                    activeFilter === 'events'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setActiveFilter('activity')}
                  className={`px-4 py-2 rounded-md ${
                    activeFilter === 'activity'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Alerts & Notifications</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    {data.alerts.slice(0, 5).map((alert, idx) => (
                      <li key={idx}>{alert.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {(activeFilter === 'all' || activeFilter === 'sales') && data.sales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.sales.total_revenue || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{data.sales.total_sales || 0}</p>
              </div>
            </div>
          </div>

          {(activeFilter === 'all' || activeFilter === 'events') && data.events && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.events.upcoming_events || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.events.total_registrations || 0}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sales Analytics */}
      {(activeFilter === 'all' || activeFilter === 'sales') && data.sales && (
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Sales Analytics</h2>

          {/* Revenue Trend Chart */}
          {data.sales.revenue_trend && data.sales.revenue_trend.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.sales.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Sales Chart */}
          {data.sales.monthly_sales && data.sales.monthly_sales.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Sales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.sales.monthly_sales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="order_count" fill="#3B82F6" name="Orders" />
                  <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products */}
          {data.sales.top_products && data.sales.top_products.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.sales.top_products.map((product: any) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image_url && (
                              <img
                                className="h-10 w-10 rounded-full mr-3"
                                src={product.image_url}
                                alt={product.name}
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.total_sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(product.total_revenue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Analytics */}
      {(activeFilter === 'all' || activeFilter === 'events') && data.events && (
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Event Analytics</h2>

          {/* Event Performance Chart */}
          {data.events.event_revenue && data.events.event_revenue.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Event Revenue by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.events.event_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="event_count" fill="#8B5CF6" name="Events" />
                  <Bar dataKey="revenue" fill="#EC4899" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Event Performance Table */}
          {data.events.event_performance && data.events.event_performance.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Event Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.events.event_performance.map((event: any) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.registrations_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.views_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(event.revenue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Analytics */}
      {(activeFilter === 'all' || activeFilter === 'activity') && data.activity && (
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Activity Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shop Followers</span>
                  <span className="text-lg font-semibold">{data.activity.shop_views || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Product Views</span>
                  <span className="text-lg font-semibold">{data.activity.product_views || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <span className="text-lg font-semibold">{data.activity.total_reviews || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement Rate</span>
                  <span className="text-lg font-semibold">
                    {data.activity.engagement_rate || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Interactions (30 days)</span>
                  <span className="text-lg font-semibold">
                    {data.activity.recent_interactions || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Shop Views', value: data.activity.shop_views || 0 },
                      { name: 'Product Views', value: data.activity.product_views || 0 },
                      { name: 'Reviews', value: data.activity.total_reviews || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard





