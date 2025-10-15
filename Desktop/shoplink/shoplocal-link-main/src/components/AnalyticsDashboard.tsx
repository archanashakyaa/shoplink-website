import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsApi, type ShopMetrics, type ProductPerformance, type DailyAnalytics } from '@/lib/api';

// Using types from API

interface AnalyticsDashboardProps {
  shopId: number;
  shopName: string;
}

// Mock data for demonstration
const mockShopMetrics: ShopMetrics = {
  totalViews: 15420,
  totalInquiries: 342,
  totalRevenue: 125800,
  totalOrders: 89,
  conversionRate: 26.0,
  averageOrderValue: 1413,
  customerCount: 156,
  productCount: 24
};

const mockProductPerformance: ProductPerformance[] = [
  { id: 1, name: "Premium Cotton T-Shirt", views: 1250, orders: 45, revenue: 22500, conversionRate: 3.6 },
  { id: 2, name: "Designer Jeans", views: 980, orders: 32, revenue: 25600, conversionRate: 3.3 },
  { id: 3, name: "Casual Sneakers", views: 1450, orders: 28, revenue: 16800, conversionRate: 1.9 },
  { id: 4, name: "Leather Handbag", views: 890, orders: 15, revenue: 22500, conversionRate: 1.7 },
  { id: 5, name: "Smart Watch", views: 2100, orders: 12, revenue: 36000, conversionRate: 0.6 }
];

const mockDailyAnalytics: DailyAnalytics[] = [
  { date: '2024-01-01', views: 120, orders: 3, revenue: 4500 },
  { date: '2024-01-02', views: 150, orders: 5, revenue: 7200 },
  { date: '2024-01-03', views: 180, orders: 7, revenue: 9800 },
  { date: '2024-01-04', views: 140, orders: 4, revenue: 5600 },
  { date: '2024-01-05', views: 200, orders: 8, revenue: 11200 },
  { date: '2024-01-06', views: 160, orders: 6, revenue: 8400 },
  { date: '2024-01-07', views: 220, orders: 9, revenue: 12600 }
];

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon, trend = 'neutral' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      {change !== undefined && (
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
          {trend === 'down' && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
          <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
            {change > 0 ? '+' : ''}{change}% from last month
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ shopId, shopName }) => {
  const [metrics, setMetrics] = useState<ShopMetrics | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data from API
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to load from API first
        const [metricsResponse, productsResponse, dailyResponse] = await Promise.allSettled([
          analyticsApi.getShopMetrics(shopId, selectedPeriod),
          analyticsApi.getProductPerformance(shopId, selectedPeriod),
          analyticsApi.getDailyAnalytics(shopId, selectedPeriod)
        ]);

        // Set data from API if successful, otherwise use mock data
        if (metricsResponse.status === 'fulfilled' && metricsResponse.value.data) {
          setMetrics(metricsResponse.value.data);
        } else {
          setMetrics(mockShopMetrics);
        }

        if (productsResponse.status === 'fulfilled' && productsResponse.value.data) {
          setProductPerformance(productsResponse.value.data);
        } else {
          setProductPerformance(mockProductPerformance);
        }

        if (dailyResponse.status === 'fulfilled' && dailyResponse.value.data) {
          setDailyAnalytics(dailyResponse.value.data);
        } else {
          setDailyAnalytics(mockDailyAnalytics);
        }
      } catch (err) {
        // Fallback to mock data on error
        setMetrics(mockShopMetrics);
        setProductPerformance(mockProductPerformance);
        setDailyAnalytics(mockDailyAnalytics);
        setError('Using demo data - API not available');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [shopId, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading state
  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  // Use mock data if API fails
  const currentMetrics = metrics || mockShopMetrics;
  const currentProductPerformance = productPerformance.length > 0 ? productPerformance : mockProductPerformance;
  const currentDailyAnalytics = dailyAnalytics.length > 0 ? dailyAnalytics : mockDailyAnalytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Performance insights for {shopName}
            {error && <span className="text-amber-600 ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={selectedPeriod === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={selectedPeriod === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Views"
          value={currentMetrics.totalViews}
          change={12.5}
          icon={<Eye className="h-4 w-4" />}
          trend="up"
        />
        <MetricCard
          title="Total Orders"
          value={currentMetrics.totalOrders}
          change={8.2}
          icon={<ShoppingCart className="h-4 w-4" />}
          trend="up"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(currentMetrics.totalRevenue)}
          change={15.3}
          icon={<DollarSign className="h-4 w-4" />}
          trend="up"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${currentMetrics.conversionRate}%`}
          change={-2.1}
          icon={<Target className="h-4 w-4" />}
          trend="down"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daily Performance Trend
                </CardTitle>
                <CardDescription>
                  Views, orders, and revenue over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={currentDailyAnalytics.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN')}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'views' ? 'Views' : name === 'orders' ? 'Orders' : 'Revenue'
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Shop Statistics
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Order Value</span>
                  <span className="text-sm font-bold">{formatCurrency(currentMetrics.averageOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Customers</span>
                  <span className="text-sm font-bold">{currentMetrics.customerCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Products</span>
                  <span className="text-sm font-bold">{currentMetrics.productCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Inquiries</span>
                  <span className="text-sm font-bold">{currentMetrics.totalInquiries}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
              <CardDescription>
                Products ranked by revenue and conversion rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentProductPerformance.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.views} views • {product.orders} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(product.revenue)}</div>
                      <Badge variant={product.conversionRate > 2 ? 'default' : 'secondary'}>
                        {product.conversionRate}% conversion
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue Breakdown
              </CardTitle>
              <CardDescription>
                Revenue distribution across different products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={productPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {productPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {currentProductPerformance.map((product, index) => {
                  const percentage = (product.revenue / currentMetrics.totalRevenue) * 100;
                  return (
                    <div key={product.id} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {product.name}: {percentage.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;