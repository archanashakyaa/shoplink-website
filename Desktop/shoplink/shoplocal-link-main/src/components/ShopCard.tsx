import React, { useState, useCallback, useMemo } from "react";
import { MapPin, Star, Heart, Users, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Enhanced interface with validation and additional props
interface ShopCardProps {
  id: string;
  name: string;
  category: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  followers: number;
  isOnline: boolean;
  description: string;
  onFollow?: (shopId: string) => void;
  isFollowing?: boolean;
  className?: string;
  isOfflineMode?: boolean;
}

// Validation helper functions
const validateShopData = (props: ShopCardProps): boolean => {
  return !!(
    props.id?.trim() &&
    props.name?.trim() &&
    props.category?.trim() &&
    props.image?.trim() &&
    props.location?.trim()
  );
};

// Enhanced ShopCard component with offline fallbacks, accessibility, and improved UX
const ShopCard: React.FC<ShopCardProps> = ({
  id,
  name,
  category,
  image,
  location,
  rating,
  reviews,
  followers,
  isOnline,
  description,
  onFollow,
  isFollowing = false,
  className = "",
  isOfflineMode = false
}) => {
  const { toast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Validate shop data
  const isValid = useMemo(() => validateShopData({
    id, name, category, image, location, rating, reviews, followers, isOnline, description
  }), [id, name, category, image, location, rating, reviews, followers, isOnline, description]);

  // Handle follow shop functionality
  const handleFollow = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isValid) {
      toast({
        title: "Invalid shop data",
        description: "This shop has invalid data and cannot be followed.",
        variant: "destructive",
      });
      return;
    }

    if (onFollow) {
      onFollow(id);
      toast({
        title: isFollowing ? "Unfollowed shop" : "Following shop",
        description: `${name} has been ${isFollowing ? 'removed from' : 'added to'} your followed shops.`,
      });
    }
  }, [isValid, onFollow, id, name, isFollowing, toast]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Navigate to shop detail page
      window.location.href = `/shop/${id}`;
    }
  }, [id]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  if (!isValid) {
    return (
      <Card className={`overflow-hidden ${className}`} role="alert" aria-live="polite">
        <CardContent className="p-5 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Invalid shop data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-card to-card/50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${className}`}
      tabIndex={0}
      role="article"
      aria-label={`${name} - ${category} shop in ${location}${isOnline ? ' with online orders' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <Link to={`/shop/${id}`} className="block">
        <div className="relative overflow-hidden aspect-[4/3]">
          {/* Loading state */}
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Shop image with error handling */}
          <img
            src={image}
            alt={`${name} - ${category} shop`}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={(e) => {
              setImageError(true);
              setImageLoading(false);
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />

          {/* Badges and action buttons overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            {isOnline && (
              <Badge className="bg-accent text-accent-foreground shadow-md">
                <Wifi className="h-3 w-3 mr-1" />
                Online Orders
              </Badge>
            )}
            {isOfflineMode && (
              <Badge variant="secondary" className="shadow-md">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:text-accent transition-all ${
                isFollowing ? 'text-red-500' : ''
              }`}
              onClick={handleFollow}
              aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${name} shop`}
            >
              <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <Link to={`/shop/${id}`} className="block">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{category}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>

          {/* Enhanced stats section */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1 text-primary">
              <Star className="h-4 w-4 fill-primary" aria-hidden="true" />
              <span className="font-medium">{rating?.toFixed(1) || '0.0'}</span>
              <span className="text-muted-foreground">({reviews || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>{followers || 0} followers</span>
            </div>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 flex-1">
          <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="line-clamp-1 truncate">{location}</span>
        </div>
        <Link to={`/shop/${id}`}>
          <Button
            variant="outline"
            size="sm"
            className="group-hover:border-primary group-hover:text-primary transition-all ml-3"
            aria-label={`View ${name} shop details`}
          >
            View Shop
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ShopCard;
