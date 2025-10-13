import { Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ShopCard from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const categories = [
    "All Shops", "Fashion", "Electronics", "Grocery", "Food & Drinks", 
    "Books", "Home & Garden", "Sports", "Beauty"
  ];

  const shops = [
    {
      id: "1",
      name: "Fashion Hub",
      category: "Clothing & Accessories",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
      location: "MG Road, Bangalore",
      rating: 4.8,
      reviews: 245,
      followers: 1250,
      isOnline: true,
      description: "Your one-stop destination for trendy fashion and accessories. Wide range of clothing for all occasions.",
    },
    {
      id: "2",
      name: "TechWorld Electronics",
      category: "Electronics & Gadgets",
      image: "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=600&q=80",
      location: "Koramangala, Bangalore",
      rating: 4.9,
      reviews: 412,
      followers: 2100,
      isOnline: true,
      description: "Latest electronics and gadgets at competitive prices. Authorized dealer for major brands.",
    },
    {
      id: "3",
      name: "Fresh Mart Grocery",
      category: "Grocery & Essentials",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
      location: "Indiranagar, Bangalore",
      rating: 4.6,
      reviews: 189,
      followers: 890,
      isOnline: true,
      description: "Farm-fresh vegetables, fruits, and daily essentials delivered to your doorstep.",
    },
    {
      id: "4",
      name: "Book Haven",
      category: "Books & Stationery",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80",
      location: "Jayanagar, Bangalore",
      rating: 4.7,
      reviews: 156,
      followers: 670,
      isOnline: false,
      description: "Extensive collection of books across genres. Perfect place for book lovers and students.",
    },
    {
      id: "5",
      name: "Cafe Delight",
      category: "Food & Beverages",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80",
      location: "HSR Layout, Bangalore",
      rating: 4.9,
      reviews: 523,
      followers: 3200,
      isOnline: true,
      description: "Cozy cafe serving artisanal coffee, pastries, and light meals. Great ambiance for work or leisure.",
    },
    {
      id: "6",
      name: "Home Decor Studio",
      category: "Home & Furniture",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
      location: "Whitefield, Bangalore",
      rating: 4.5,
      reviews: 98,
      followers: 540,
      isOnline: true,
      description: "Transform your space with our curated collection of home decor and furniture pieces.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Discover Local Shops</h2>
            <p className="text-muted-foreground">Browse through thousands of verified local businesses</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category, index) => (
            <Badge
              key={index}
              variant={index === 0 ? "default" : "secondary"}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {shops.map((shop) => (
            <ShopCard key={shop.id} {...shop} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Shops
          </Button>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to List Your Shop?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of local shopkeepers who are growing their business with ShopLink. 
              Create your digital storefront today!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="hero" className="gap-2">
                Get Started for Free
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
            <p>© 2025 ShopLink. Empowering local businesses, one shop at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
