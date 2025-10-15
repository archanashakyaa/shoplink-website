import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ShopCard from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { shopApi, eventApi, type Shop, type Event } from "@/lib/api";
import { RefreshCw, Filter, Loader2, AlertCircle, Calendar, Clock, MapPin, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shops");

  // Additional state variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [categories] = useState(['All', 'Food & Dining', 'Retail', 'Services', 'Health & Beauty']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch shops
        const shopsResponse = await shopApi.getAll();
        if (shopsResponse.data) {
          setShops(shopsResponse.data);
        }

        // Fetch events
        const eventsResponse = await eventApi.getAll({ status: 'published', limit: 10 });
        if (eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter shops based on selected category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredShops(shops);
    } else {
      setFilteredShops(shops.filter(shop => shop.category === selectedCategory));
    }
  }, [shops, selectedCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Additional functions
  const fetchShops = async () => {
    try {
      setError(null);
      const response = await shopApi.getAll();
      if (response.data) {
        setShops(response.data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to fetch shops');
    }
  };

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await eventApi.getAll({ status: 'published', limit: 10 });
      if (response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    }
  };

  const transformShopForCard = (shop: Shop) => {
    return {
      id: shop.id.toString(),
      name: shop.name,
      description: shop.description || '',
      image: shop.image_url || '/placeholder.svg',
      category: shop.category,
      location: shop.location,
      rating: 4.5, // Default rating since it's not in the Shop type
      reviews: 0,  // Default reviews since it's not in the Shop type
      followers: 0, // Default followers since it's not in the Shop type
      isOnline: Boolean(shop.is_online),
    };
  };

  const loadMoreShops = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 6);
      setIsLoadingMore(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <section className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {activeTab === 'shops' ? 'Discover Local Shops' : 'Upcoming Events'}
                {isAuthenticated && <span className="text-primary"> (Authenticated)</span>}
              </h2>
              <p className="text-muted-foreground">
                {activeTab === 'shops'
                  ? (isAuthenticated
                      ? "Welcome back! Browse through thousands of verified local businesses"
                      : "Browse through thousands of verified local businesses")
                  : "Discover exciting events and workshops in your area"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && activeTab === 'shops' && (
                <Button variant="outline" size="sm" onClick={() => navigate('/list-shop')}>
                  Manage My Shop
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === 'shops') fetchShops();
                  else fetchEvents();
                }}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className="gap-2"
              >
                🐛 Debug
              </Button>
              {activeTab === 'shops' && (
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              )}
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="shops">Shops</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="shops">
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category, index) => (
                <Badge
                  key={index}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {isLoading ? (
                <div className="col-span-full text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading shops...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchShops} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No shops found in this category.</p>
                </div>
              ) : (
                <>
                  {(() => {
                    console.log('🏪 Rendering shops:', {
                      filteredShopsLength: filteredShops.length,
                      displayCount,
                      shopsToShow: filteredShops.slice(0, displayCount).length
                    });

                    const shopsToRender = filteredShops.slice(0, displayCount);

                    if (shopsToRender.length === 0) {
                      console.log('⚠️ No shops to render');
                      return (
                        <div className="col-span-full text-center py-12">
                          <p className="text-muted-foreground">No shops available</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Debug info: filteredShops length = {filteredShops.length}
                          </p>
                        </div>
                      );
                    }

                    return shopsToRender.map((shop) => {
                      const cardProps = transformShopForCard(shop);

                      if (debugMode) {
                        return (
                          <div key={shop.id} className="p-4 border rounded-lg bg-card">
                            <h3 className="font-bold text-lg">{shop.name}</h3>
                            <p className="text-sm text-muted-foreground">Category: {shop.category}</p>
                            <p className="text-sm text-muted-foreground">Location: {shop.location}</p>
                            <p className="text-sm text-muted-foreground">Owner: {shop.owner_name}</p>
                            <p className="text-sm text-muted-foreground">Online: {shop.is_online}</p>
                            <p className="text-sm text-muted-foreground">ID: {shop.id}</p>
                          </div>
                        );
                      }

                      return <ShopCard key={shop.id} {...cardProps} />;
                    });
                  })()}

                  {filteredShops.length > displayCount && (
                    <div className="col-span-full text-center mt-8">
                      <p className="text-muted-foreground mb-4">
                        Showing {displayCount} of {filteredShops.length} shops
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="text-center">
              {filteredShops.length > displayCount && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMoreShops}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Shops'
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {isLoading ? (
                <div className="col-span-full text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No events found.</p>
                  <p className="text-sm text-muted-foreground mt-2">Be the first to create an event!</p>
                </div>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {event.image_url && (
                      <div className="aspect-video bg-gray-200">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription className="mt-1">
                            by {event.organizer_name || 'Event Organizer'}
                          </CardDescription>
                        </div>
                        {event.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.start_date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(event.start_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-2" />
                          {event.current_attendees || 0} / {event.max_attendees || '∞'} attendees
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {event.is_free ? (
                            <Badge variant="outline">Free</Badge>
                          ) : (
                            <span className="font-semibold text-green-600">
                              ₹{event.ticket_price}
                            </span>
                          )}
                        </div>
                        <Button size="sm">
                          {event.current_attendees >= (event.max_attendees || Infinity) ? 'Full' : 'Register'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              {activeTab === 'shops' ? 'Ready to List Your Shop?' : 'Want to Organize an Event?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {activeTab === 'shops'
                ? 'Join thousands of local shopkeepers who are growing their business with ShopLink. Create your digital storefront today!'
                : 'Connect with your community and organize amazing events. Create memorable experiences with ShopLink Events!'
              }
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="hero" className="gap-2">
                {activeTab === 'shops' ? 'Get Started for Free' : 'Create Event'}
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 ShopLink. Empowering local businesses and community events.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
