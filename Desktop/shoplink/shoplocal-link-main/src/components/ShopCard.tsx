import { MapPin, Star, Heart, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
}

const ShopCard = ({ id, name, category, image, location, rating, reviews, followers, isOnline, description }: ShopCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-card to-card/50">
      <Link to={`/shop/${id}`}>
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            {isOnline && (
              <Badge className="bg-accent text-accent-foreground shadow-md">
                Online Orders
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:text-accent transition-all"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
      
      <CardContent className="p-5">
        <Link to={`/shop/${id}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{category}</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <span className="font-medium">{rating}</span>
              <span className="text-muted-foreground">({reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{followers} followers</span>
            </div>
          </div>
        </Link>
      </CardContent>
      
      <CardFooter className="p-5 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{location}</span>
        </div>
        <Link to={`/shop/${id}`}>
          <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary">
            View Shop
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ShopCard;
