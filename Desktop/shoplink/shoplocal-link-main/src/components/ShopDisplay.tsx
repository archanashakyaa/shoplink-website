import React from 'react';
import { MapPin, Star, Heart, Share2, Phone, Mail, Clock, Users, ShoppingBag, Store, ShoppingCart, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  inStock: boolean;
}

interface ProductPhoto {
  id: string;
  url: string;
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

interface ShopDisplayProps {
  shopData: ShopData | null;
  isLoadingProducts: boolean;
  isLoadingPhotos: boolean;
  onEdit: () => void;
  isAuthenticated: boolean;
}

const ShopDisplay: React.FC<ShopDisplayProps> = ({
  shopData,
  isLoadingProducts,
  isLoadingPhotos,
  onEdit,
  isAuthenticated
}) => {
  if (!shopData) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No shop listed yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your shop listing to start showcasing your business.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Image and Basic Info */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2">
          <div className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-xl mb-6">
            {shopData.shopPhoto ? (
              <img
                src={shopData.shopPhoto}
                alt={shopData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Store className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-6 right-6 flex gap-3">
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{shopData.name}</h1>
                <p className="text-lg text-muted-foreground">{shopData.category}</p>
              </div>
              {shopData.isOnline && (
                <Badge className="bg-accent text-accent-foreground text-sm px-4 py-2">
                  Online Orders Available
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-xl font-semibold">{shopData.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({shopData.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{shopData.followers} followers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="h-5 w-5" />
                <span>{shopData.productCount} products</span>
              </div>
            </div>

            <p className="text-base leading-relaxed">{shopData.description}</p>
          </div>
        </div>

        {/* Sidebar with Contact Information */}
        <div>
          <Card className="sticky top-24 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Shop Information</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{shopData.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{shopData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{shopData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">{shopData.hours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" size="lg" variant="hero">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
                <Button className="w-full" size="lg" variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
                <Button className="w-full" size="lg" variant="accent">
                  Follow Shop
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="products"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Products ({shopData.products.length})
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Gallery ({shopData.productPhotos.length})
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Reviews ({shopData.reviews})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-8">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading products...</span>
            </div>
          ) : shopData?.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shopData.products.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative overflow-hidden rounded-t-lg aspect-square">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                    {product.discount && (
                      <Badge className="absolute top-2 left-2 bg-destructive">
                        {product.discount}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={product.inStock ? "default" : "secondary"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products added yet</h3>
              <p className="text-muted-foreground">
                Add products to showcase what your shop offers.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-8">
          {isLoadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading photos...</span>
            </div>
          ) : shopData?.productPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shopData.productPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Product"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No photos added yet</h3>
              <p className="text-muted-foreground">
                Upload photos to showcase your products and shop.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">About {shopData.name}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {shopData.description} We pride ourselves on providing quality products and exceptional customer service.
                Visit us today and discover why we're the preferred choice for customers in {shopData.location}.
              </p>
              <h4 className="font-semibold mb-3">Why Choose Us?</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Quality products and excellent customer service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Convenient location in {shopData.location}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Open {shopData.hours}</span>
                </li>
                {shopData.isOnline && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Online ordering available</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Customer reviews</h3>
                <p className="text-muted-foreground">
                  {shopData.reviews > 0
                    ? `Based on ${shopData.reviews} customer reviews`
                    : "No reviews yet. Be the first to review this shop!"
                  }
                </p>
                {shopData.rating > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(shopData.rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-semibold">{shopData.rating.toFixed(1)}</span>
                  </div>
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