import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPin, Star, Heart, Share2, Phone, Mail, Clock, Users, ShoppingBag, Store, ShoppingCart, Loader2, Image as ImageIcon, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Enhanced interfaces with validation and error handling
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  inStock: boolean;
  description?: string;
  category?: string;
}

import ProductCard from "./ProductCard";

interface ProductPhoto {
  id: string;
  url: string;
  alt?: string;
}

interface ShopData {
  id: string;
  name: string;
  category: string;
  description: string;
  shopPhoto: string | null;
  location: string;
  phone: string;
  email: string;
  hours: string;
  rating: number;
  reviews: number;
  followers: number;
  productCount: number;
  isOnline: boolean;
  productPhotos: ProductPhoto[];
  products: Product[];
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced props with error handling and retry functionality
interface ShopDisplayProps {
  shopData: ShopData | null;
  isLoadingProducts: boolean;
  isLoadingPhotos: boolean;
  onEdit: () => void;
  isAuthenticated: boolean;
  error?: string | null;
  onRetry?: () => void;
  isOnline?: boolean;
  onAddToList?: (productId: string) => void;
}

// Loading skeleton component for better UX
const ShopSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-3 gap-8 mb-12">
      <div className="md:col-span-2 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

// Error boundary component for graceful error handling
interface ErrorFallbackProps {
  error: string;
  onRetry?: () => void;
  isOnline?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry, isOnline }) => (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {!isOnline && <WifiOff className="h-4 w-4" />}
        <span>{error}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

// Enhanced ShopDisplay component with error handling, accessibility, and performance optimizations
const ShopDisplay: React.FC<ShopDisplayProps> = ({
  shopData,
  isLoadingProducts,
  isLoadingPhotos,
  onEdit,
  isAuthenticated,
  error,
  onRetry,
  isOnline = navigator.onLine,
  onAddToList
}) => {
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Handle image loading with fallback
  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
  }, []);

  // Handle share functionality with error handling
  const handleShare = useCallback(async () => {
    if (!shopData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shopData.name,
          text: shopData.description,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Shop link has been copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the shop. Link copied to clipboard instead.",
        variant: "destructive",
      });
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  }, [shopData, toast]);

  // Handle follow shop functionality
  const handleFollowShop = useCallback(async () => {
    if (!shopData) return;

    try {
      // TODO: Implement follow API call
      toast({
        title: "Following shop",
        description: `You are now following ${shopData.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to follow",
        description: "Unable to follow this shop. Please try again.",
        variant: "destructive",
      });
    }
  }, [shopData, toast]);

  // Handle call functionality with validation
  const handleCall = useCallback(() => {
    if (!shopData?.phone) {
      toast({
        title: "Phone not available",
        description: "Contact information is not available for this shop.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = shopData.phone.replace(/[\s\-\(\)]/g, '');

    if (!phoneRegex.test(cleanPhone)) {
      toast({
        title: "Invalid phone number",
        description: "The provided phone number format is not valid.",
        variant: "destructive",
      });
      return;
    }

    window.location.href = `tel:${cleanPhone}`;
  }, [shopData?.phone, toast]);

  // Handle directions with error handling
  const handleDirections = useCallback(() => {
    if (!shopData?.location) {
      toast({
        title: "Location not available",
        description: "Location information is not available for this shop.",
        variant: "destructive",
      });
      return;
    }

    const encodedLocation = encodeURIComponent(shopData.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  }, [shopData?.location, toast]);

  // Retry mechanism with exponential backoff
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      onRetry?.();
    } else {
      toast({
        title: "Max retries reached",
        description: "Please check your connection and try again later.",
        variant: "destructive",
      });
    }
  }, [retryCount, onRetry, toast]);

  // Memoized shop stats for performance
  const shopStats = useMemo(() => [
    {
      icon: Star,
      value: shopData?.rating?.toFixed(1) || '0.0',
      label: `${shopData?.reviews || 0} reviews`,
      ariaLabel: `${shopData?.rating?.toFixed(1) || '0.0'} star rating from ${shopData?.reviews || 0} reviews`
    },
    {
      icon: Users,
      value: shopData?.followers || 0,
      label: 'followers',
      ariaLabel: `${shopData?.followers || 0} followers`
    },
    {
      icon: ShoppingBag,
      value: shopData?.productCount || 0,
      label: 'products',
      ariaLabel: `${shopData?.productCount || 0} products available`
    }
  ], [shopData?.rating, shopData?.reviews, shopData?.followers, shopData?.productCount]);

  // Show loading skeleton
  if (isLoadingProducts || isLoadingPhotos) {
    return <ShopSkeleton />;
  }

  // Show error state
  if (error && !shopData) {
    return (
      <div className="space-y-6">
        <ErrorFallback error={error} onRetry={handleRetry} isOnline={isOnline} />
        <div className="text-center py-12">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to load shop</h3>
          <p className="text-muted-foreground mb-6">
            {isOnline ? 'There was an error loading the shop data.' : 'Please check your internet connection.'}
          </p>
          {!isOnline && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <WifiOff className="h-4 w-4" />
              <span>Offline mode</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show empty state
  if (!shopData) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No shop listed yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your shop listing to start showcasing your business.
        </p>
        {isAuthenticated && (
          <Button onClick={onEdit} className="mt-4">
            Create Shop
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Error Display */}
      {error && shopData && (
        <ErrorFallback error={error} onRetry={handleRetry} isOnline={isOnline} />
      )}

      {/* Hero Section with Image and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
        <div className="lg:col-span-2 space-y-4">
          {/* Enhanced Image Section with Loading States and Error Handling */}
          <div className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-xl bg-muted">
            {isImageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {shopData.shopPhoto && !imageError ? (
              <img
                src={shopData.shopPhoto}
                alt={`${shopData.name} - ${shopData.category} shop`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Store className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Shop image not available</p>
                </div>
              </div>
            )}

            {/* Enhanced Action Buttons with Accessibility */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleShare}
                aria-label={`Share ${shopData.name} shop`}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleFollowShop}
                aria-label={`Follow ${shopData.name} shop`}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Online Status Badge */}
            {shopData.isOnline && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground shadow-md">
                <Wifi className="h-3 w-3 mr-1" />
                Online Orders Available
              </Badge>
            )}
          </div>

          {/* Enhanced Shop Information Section */}
          <div className="space-y-4">
            <header className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    {shopData.name}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground">
                    {shopData.category}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {shopData.isOnline && (
                    <Badge className="bg-accent text-accent-foreground text-sm px-3 py-1.5 w-fit">
                      <Wifi className="h-3 w-3 mr-1" />
                      Online Orders Available
                    </Badge>
                  )}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEdit}
                      className="w-fit"
                    >
                      Edit Shop
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {/* Enhanced Stats Section with Accessibility */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {shopStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    role="group"
                    aria-label={`Shop ${stat.label}`}
                  >
                    <IconComponent
                      className="h-5 w-5 text-primary flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-semibold text-foreground">
                        {stat.value}
                      </div>
                      <div
                        className="text-sm text-muted-foreground truncate"
                        aria-label={stat.ariaLabel}
                      >
                        {stat.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Description */}
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed text-foreground">
                {shopData.description}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar with Contact Information */}
        <div className="lg:sticky lg:top-24">
          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-lg text-foreground mb-4">
                Contact Information
              </h3>

              {/* Enhanced Contact Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <MapPin
                    className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {shopData.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Phone
                    className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <button
                      className="text-sm text-primary hover:underline text-left break-all"
                      onClick={handleCall}
                      aria-label={`Call ${shopData.phone}`}
                    >
                      {shopData.phone}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Mail
                    className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <a
                      href={`mailto:${shopData.email}`}
                      className="text-sm text-primary hover:underline break-all"
                      aria-label={`Email ${shopData.email}`}
                    >
                      {shopData.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Clock
                    className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Business Hours</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {shopData.hours}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCall}
                  disabled={!shopData.phone}
                  aria-label={`Call ${shopData.name}`}
                >
                  <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                  Call Now
                </Button>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={handleDirections}
                  disabled={!shopData.location}
                  aria-label={`Get directions to ${shopData.name}`}
                >
                  <MapPin className="h-4 w-4 mr-2" aria-hidden="true" />
                  Get Directions
                </Button>
                <Button
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  onClick={handleFollowShop}
                  aria-label={`Follow ${shopData.name}`}
                >
                  <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
                  Follow Shop
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Tabs Section */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
          <TabsTrigger
            value="products"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap"
            aria-label={`${shopData.products?.length || 0} products available`}
          >
            Products ({shopData.products?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap"
            aria-label={`${shopData.productPhotos?.length || 0} photos in gallery`}
          >
            Gallery ({shopData.productPhotos?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap"
            aria-label={`About ${shopData.name}`}
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap"
            aria-label={`${shopData.reviews} customer reviews`}
          >
            Reviews ({shopData.reviews})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 lg:mt-8">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
              <span className="text-lg">Loading products...</span>
            </div>
          ) : shopData?.products?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {shopData.products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image}
                  inStock={product.inStock}
                  discount={product.discount}
                  description={product.description}
                  category={product.category}
                  onAddToList={onAddToList}
                  className="h-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products added yet</h3>
              <p className="text-muted-foreground mb-4">
                Add products to showcase what your shop offers.
              </p>
              {isAuthenticated && (
                <Button variant="outline" onClick={onEdit}>
                  Add Products
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-6 lg:mt-8">
          {isLoadingPhotos ? (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
              <span className="text-lg">Loading photos...</span>
            </div>
          ) : shopData?.productPhotos?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {shopData.productPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || `${shopData.name} product photo`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No photos added yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload photos to showcase your products and shop.
              </p>
              {isAuthenticated && (
                <Button variant="outline" onClick={onEdit}>
                  Add Photos
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-6 lg:mt-8">
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                About {shopData.name}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {shopData.description} We pride ourselves on providing quality products and exceptional customer service.
                Visit us today and discover why we're the preferred choice for customers in {shopData.location}.
              </p>
              <h4 className="font-semibold mb-4 text-foreground">Why Choose Us?</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-primary mt-1 flex-shrink-0" aria-hidden="true">✓</span>
                  <span>Quality products and excellent customer service</span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-primary mt-1 flex-shrink-0" aria-hidden="true">✓</span>
                  <span>Convenient location in {shopData.location}</span>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-primary mt-1 flex-shrink-0" aria-hidden="true">✓</span>
                  <span>Open {shopData.hours}</span>
                </li>
                {shopData.isOnline && (
                  <li className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                    <span className="text-primary mt-1 flex-shrink-0" aria-hidden="true">✓</span>
                    <span>Online ordering available</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 lg:mt-8">
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center py-8 lg:py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Customer Reviews</h3>
                <p className="text-muted-foreground mb-4">
                  {shopData.reviews > 0
                    ? `Based on ${shopData.reviews} customer reviews`
                    : "No reviews yet. Be the first to review this shop!"
                  }
                </p>
                {shopData.rating > 0 && (
                  <div className="flex items-center justify-center gap-3 mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex" aria-label={`${shopData.rating} stars`}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(shopData.rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xl font-semibold text-foreground">
                      {shopData.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {isAuthenticated && shopData.reviews === 0 && (
                  <Button variant="outline" className="mt-4">
                    Write First Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopDisplay;