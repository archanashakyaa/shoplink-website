import { ShoppingCart, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  inStock: boolean;
  discount?: number;
}

const ProductCard = ({ name, price, originalPrice, image, inStock, discount }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discount && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground shadow-md">
            {discount}% OFF
          </Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="text-base px-4 py-2">Out of Stock</Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">₹{price}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{originalPrice}</span>
            )}
          </div>
          
          <Button 
            size="icon" 
            variant="default"
            className="h-9 w-9 rounded-full shadow-md"
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
