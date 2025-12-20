import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/mockData";
import { Trash2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { getLevelBadge } from "@/utils/badges";
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

interface ProductListingCardProps {
  product: Product;
  onDeveloperDelete?: (productId: string) => void;
  onDelete?: (productId: string) => void; // NEW: Add onDelete prop for user-specific delete
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product, onDeveloperDelete, onDelete }) => {
  const { user } = useAuth(); // NEW: Get current user
  const isDeveloper = product.isDeveloper && onDeveloperDelete;
  const isCreator = user?.$id === product.userId; // NEW: Check if current user is the creator
  const sellerBadge = product.sellerLevel ? getLevelBadge(product.sellerLevel) : undefined;

  return (
    <Card className="flex flex-col h-full relative hover:shadow-xl transition-shadow">
      {/* Developer Delete Button */}
      {isDeveloper && (
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-70 hover:opacity-100"
          onClick={() => onDeveloperDelete(product.$id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete (Developer)</span>
        </Button>
      )}
      {/* User-specific Delete Button */}
      {!isDeveloper && isCreator && onDelete && ( // Only show if not developer, is creator, and onDelete is provided
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-70 hover:opacity-100"
          onClick={() => onDelete(product.$id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Listing</span>
        </Button>
      )}
      <Link to={`/market/product/${product.$id}`} className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>{product.title}</CardTitle>
          <CardDescription>{product.price}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <img 
            src={product.imageUrl || "/app-logo.png"} 
            alt={product.title} 
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Seller: {product.sellerName} ({product.sellerRating} stars)</span>
            {sellerBadge && (
              <Badge className="bg-blue-500 text-white flex items-center gap-1">
                  <Award className="h-3 w-3" /> {sellerBadge}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">View Details</Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductListingCard;