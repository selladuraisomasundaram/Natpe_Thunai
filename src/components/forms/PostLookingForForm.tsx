"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLookingForPosts } from "@/hooks/useLookingForPosts";

interface PostLookingForFormProps {
  onPostSubmitted: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books" },
  { value: "sports-gear", label: "Sports Gear" },
  { value: "services", label: "Services (e.g., tutoring, editing)" },
  { value: "food-wellness", label: "Food & Wellness" },
  { value: "other", label: "Other" },
];

const PostLookingForForm: React.FC<PostLookingForFormProps> = ({ onPostSubmitted, onCancel }) => {
  const { createPost } = useLookingForPosts();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !budget || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        title: title.trim(),
        description: description.trim(),
        category: category,
        budget: budget.trim(),
        contact: contact.trim(),
      });
      onPostSubmitted();
      setTitle("");
      setDescription("");
      setCategory("");
      setBudget("");
      setContact("");
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="title" className="text-left sm:text-right text-foreground">
          What are you looking for?
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Used Physics Textbook"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="description" className="text-left sm:text-right text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Provide details about the item/service you need..."
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="category" className="text-left sm:text-right text-foreground">
          Category
        </Label>
        <Select value={category} onValueChange={setCategory} required disabled={isSubmitting}>
          <SelectTrigger className="col-span-3 w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {CATEGORY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="budget" className="text-left sm:text-right text-foreground">
          Your Budget/Offer
        </Label>
        <Input
          id="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., ₹500-₹800, Negotiable, Free"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="contact" className="text-left sm:text-right text-foreground">
          Contact Email
        </Label>
        <Input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="your.email@example.com"
          required
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Post Request"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostLookingForForm;