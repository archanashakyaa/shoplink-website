import React, { useState, useCallback, useMemo } from "react";
import { ShoppingCart, Heart, AlertCircle, Loader2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Enhanced interface with validation and additional props
interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  discount?: number;
  description?: string;
  category?: string;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  onAddToList?: (productId: string) => void;
  isWishlisted?: boolean;
  className?: string;
}

// Validation helper functions
const validateProductData = (props: ProductCardProps): boolean => {
  return !!(
    props.name?.trim() &&
    props.price > 0 &&
    props.image?.trim()
  );
};

// Price calculation helper
const calculateDiscountedPrice = (price: number, discount?: number): number => {
  if (!discount || discount <= 0) return price;
  return price * (1 - discount / 100);
};

// Enhanced ProductCard component with accessibility, performance optimizations, and error handling
const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  image,
  inStock,
  discount,
  description,
  category,
  onAddToCart,
  onToggleWishlist,
  onAddToList,
  isWishlisted = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Validate product data
  const isValid = useMemo(() => validateProductData({
    name, price, image, inStock, discount
  }), [name, price, image, inStock, discount]);

  // Calculate discounted price
  const discountedPrice = useMemo(() =>
    calculateDiscountedPrice(price, discount),
    [price, discount]
  );

  // Handle add to cart with validation
  const handleAddToCart = useCallback(() => {
    if (!isValid) {
      toast({
        title: "Invalid product",
        description: "This product has invalid data and cannot be added to cart.",
        variant: "destructive",
      });
      return;
    }

    if (!inStock) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    if (id && onAddToCart) {
      onAddToCart(id);
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
      });
    }
  }, [isValid, inStock, id, onAddToCart, name, toast]);

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(() => {
    if (id && onToggleWishlist) {
      onToggleWishlist(id);
      toast({
        title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
        description: `${name} has been ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
      });
    }
  }, [id, onToggleWishlist, isWishlisted, name, toast]);

  // Handle add to list
  const handleAddToList = useCallback(() => {
    if (id && onAddToList) {
      onAddToList(id);
    }
  }, [id, onAddToList]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCart();
    }
  }, [handleAddToCart]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  if (!isValid) {
    return (
      <Card className={`overflow-hidden ${className}`} role="alert" aria-live="polite">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Invalid product data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${className}`}
      tabIndex={0}
      role="article"
      aria-label={`${name} - ${inStock ? 'In stock' : 'Out of stock'}${discount ? ` - ${discount}% off` : ''}`}
      onKeyDown={handleKeyDown}
    >
      <div className="relative overflow-hidden aspect-square">
        {/* Loading state */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Product image with error handling */}
        <img
          src={image}
          alt={`${name} product image${category ? ` in ${category}` : ''}`}
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

        {/* Discount badge */}
        {discount && discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground shadow-md z-10">
            {discount}% OFF
          </Badge>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Badge variant="secondary" className="text-base px-4 py-2">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:text-accent opacity-0 group-hover:opacity-100 transition-all z-20 ${
            isWishlisted ? 'text-red-500' : ''
          }`}
          onClick={handleWishlistToggle}
          aria-label={`${isWishlisted ? 'Remove from' : 'Add to'} wishlist`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-4">
        {/* Product name with enhanced styling */}
        <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {name}
        </h3>

        {/* Price section with discount calculation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              ₹{discountedPrice.toFixed(2)}
            </span>
            {originalPrice && originalPrice > discountedPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          <Badge
            variant={inStock ? "default" : "secondary"}
            className={`text-xs ${inStock ? 'bg-green-100 text-green-800' : ''}`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="flex-1 min-w-0 rounded-full shadow-md hover:shadow-lg transition-all"
            disabled={!inStock}
            onClick={handleAddToCart}
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
            <span className="sm:hidden">{inStock ? 'Add' : 'Out'}</span>
          </Button>
          {onAddToList && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 sm:px-3 rounded-full shadow-md hover:shadow-lg transition-all flex-shrink-0"
              onClick={handleAddToList}
              aria-label={`Add ${name} to list`}
              title={`Add ${name} to list`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
