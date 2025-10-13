import { MapPin, Star, Heart, Share2, Phone, Mail, Clock, Users, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";

const ShopDetail = () => {
  const shopData = {
    name: "Fashion Hub",
    category: "Clothing & Accessories",
    description: "Your one-stop destination for trendy fashion and accessories. We offer a curated collection of the latest styles for men and women.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    rating: 4.8,
    reviews: 245,
    followers: 1250,
    location: "MG Road, Bangalore",
    phone: "+91 98765 43210",
    email: "contact@fashionhub.com",
    hours: "10:00 AM - 9:00 PM",
    isOnline: true,
  };

  const products = [
    {
      name: "Cotton Casual Shirt",
      price: 899,
      originalPrice: 1299,
      discount: 30,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
      inStock: true,
    },
    {
      name: "Denim Jeans",
      price: 1499,
      originalPrice: 2199,
      discount: 32,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
      inStock: true,
    },
    {
      name: "Leather Wallet",
      price: 599,
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
      inStock: true,
    },
    {
      name: "Designer Handbag",
      price: 2499,
      originalPrice: 3499,
      discount: 28,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80",
      inStock: false,
    },
    {
      name: "Sports Sneakers",
      price: 1799,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      inStock: true,
    },
    {
      name: "Casual T-Shirt",
      price: 499,
      originalPrice: 799,
      discount: 37,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      inStock: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-xl mb-6">
              <img
                src={shopData.image}
                alt={shopData.name}
                className="w-full h-full object-cover"
              />
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
                  <span className="text-xl font-semibold">{shopData.rating}</span>
                  <span className="text-muted-foreground">({shopData.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>{shopData.followers} followers</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingBag className="h-5 w-5" />
                  <span>500+ products</span>
                </div>
              </div>

              <p className="text-base leading-relaxed">{shopData.description}</p>
            </div>
          </div>

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

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="products" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Products
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
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">About {shopData.name}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {shopData.description} We pride ourselves on providing quality products and exceptional customer service. 
                  Visit us today and discover why we're the preferred choice for fashion enthusiasts in the area.
                </p>
                <h4 className="font-semibold mb-3">Why Choose Us?</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Wide range of products from trusted brands</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Competitive pricing and regular discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Friendly and knowledgeable staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Easy returns and exchange policy</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Customer reviews coming soon</h3>
                  <p className="text-muted-foreground">
                    Shop owners will be able to showcase customer reviews and ratings here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShopDetail;
