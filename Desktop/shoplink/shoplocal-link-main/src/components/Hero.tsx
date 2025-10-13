import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
      <div className="container mx-auto px-4 py-20 md:py-28 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">Supporting Local Businesses</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Discover Amazing
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Local Shops </span>
            Near You
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Connect with trusted local shopkeepers, browse their products, and support your community. 
            One platform for all your local shopping needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for shops, products, or services..."
                className="pl-12 h-14 text-base shadow-md border-2 focus:border-primary"
              />
            </div>
            <div className="sm:w-56 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Location"
                className="pl-12 h-14 text-base shadow-md border-2 focus:border-primary"
              />
            </div>
            <Button variant="hero" size="lg" className="h-14 px-8 text-base">
              Search
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <span><strong className="text-foreground">2,500+</strong> Local Shops</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span><strong className="text-foreground">10,000+</strong> Happy Customers</span>
            <div className="h-4 w-px bg-border" />
            <span><strong className="text-foreground">4.8★</strong> Average Rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
