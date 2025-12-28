"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface MarketListingFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  loading: boolean;
  category: "sell" | "rent" | "gift" | "sports";
}

const MarketListingForm: React.FC<MarketListingFormProps> = ({ onSubmit, onCancel, loading, category }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || (category !== 'gift' && !price.trim())) {
      // Basic validation
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: category === 'gift' ? 0 : parseFloat(price),
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Textbooks, Bicycle, Gaming Console"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide details about the item..."
          rows={4}
          required
        />
      </div>
      {category !== 'gift' && (
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 500.00"
            step="0.01"
            min="0"
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            `Post for ${category === 'sell' ? 'Sale' : category === 'rent' ? 'Rent' : category === 'gift' ? 'Free' : 'Sports'}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default MarketListingForm;