"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, HelpCircle } from "lucide-react";
import { useLostAndFoundListings, LostFoundItem } from "@/hooks/useLostAndFoundListings";
import { Link } from "react-router-dom";

interface PostFoundItemFormProps {
  onItemPosted: () => void;
  onCancel: () => void;
}

const PostFoundItemForm: React.FC<PostFoundItemFormProps> = ({ onItemPosted, onCancel }) => {
  const { postItem } = useLostAndFoundListings();
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !description.trim() || !location.trim() || !date.trim() || !contact.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postItem(
        {
          itemName: itemName.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || null,
          location: location.trim(),
          date: new Date(date).toISOString(), // Convert to ISO string
          contact: contact.trim(),
          type: "found", // Added 'type' property
        }
      );
      onItemPosted();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="itemName" className="text-foreground">Item Name</Label>
        <Input
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g., Black Backpack"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Color, brand, unique marks, contents, etc."
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="imageUrl" className="text-foreground">Image URL (Optional)</Label>
          <Link to="/help/image-to-url" className="text-xs text-secondary-neon hover:underline flex items-center gap-1">
            <HelpCircle className="h-3 w-3" /> How to get URL?
          </Link>
        </div>
        <Input
          id="imageUrl"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="e.g., https://example.com/found-bag.jpg"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">A clear image can help the owner identify their item.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-foreground">Location Found</Label>
        <Input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Near Main Gate, Canteen Table 5"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date" className="text-foreground">Date Found</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact" className="text-foreground">Contact Email/Phone</Label>
        <Input
          id="contact"
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="your.email@example.com or 9876543210"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Post Found Item"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostFoundItemForm;