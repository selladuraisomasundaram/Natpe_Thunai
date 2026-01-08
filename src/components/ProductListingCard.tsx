import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/mockData";
import { Trash2, Award, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { getLevelBadge } from "@/utils/badges";

interface ProductListingCardProps {
  product: Product;
  onDeveloperDelete?: (productId: string) => void;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product, onDeveloperDelete }) => {
  const isDeveloper = product.isDeveloper && onDeveloperDelete;
  const sellerBadge = product.sellerLevel ? getLevelBadge(product.sellerLevel) : undefined;

  return (
    <Card className="group flex flex-col h-full relative overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-card">
      
      {/* Developer Delete Button */}
      {isDeveloper && (
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute top-2 left-2 z-20 h-8 w-8 shadow-md"
          onClick={(e) => {
            e.preventDefault(); // Prevent navigating to details page
            onDeveloperDelete(product.$id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <Link to={`/market/product/${product.$id}`} className="flex flex-col h-full">
        
        {/* Image Section - Increased height & moved Badge here to avoid overlap */}
        <div className="relative w-full h-48 bg-muted/20">
          <img 
            src={product.imageUrl || "/app-logo.png"} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Badge positioned over the image (Top Right) */}
          {sellerBadge && (
            <Badge className="absolute top-2 right-2 bg-blue-600/90 text-white backdrop-blur-sm shadow-sm flex items-center gap-1 text-[10px] px-2 py-0.5 border-0">
              <Award className="h-3 w-3" /> {sellerBadge}
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="flex-grow p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
              {product.title}
            </h3>
            <p className="font-bold text-lg text-secondary-neon whitespace-nowrap">
              {product.price}
            </p>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-3">
          <div className="w-full h-[1px] bg-border/50" />
          
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="bg-primary/10 p-1 rounded-full">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="truncate max-w-[100px] font-medium text-foreground">
                {product.sellerName}
              </span>
            </div>
            <span className="flex items-center text-amber-500 font-medium">
              ★ {product.sellerRating}
            </span>
          </div>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            View Details
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductListingCard;