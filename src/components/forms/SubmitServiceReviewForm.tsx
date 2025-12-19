"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews"; // Import the hook
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }),
  rating: z.number().min(1, { message: "Please provide a rating." }).max(5, { message: "Rating must be between 1 and 5." }),
});

interface SubmitServiceReviewFormProps {
  serviceId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const SubmitServiceReviewForm: React.FC<SubmitServiceReviewFormProps> = ({ serviceId, onReviewSubmitted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const { addReview } = useServiceReviews(serviceId, userProfile?.collegeName); // Updated destructuring
  const [rating, setRating] = useState(0);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      comment: "",
      rating: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof reviewSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to submit a review.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    try {
      const success = await addReview({
        serviceId: serviceId,
        reviewerId: user.$id,
        reviewerName: user.name,
        rating: rating,
        comment: data.comment,
        collegeName: userProfile.collegeName,
      });

      if (success) {
        toast.success("Your review has been submitted!");
        onReviewSubmitted();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (e: any) {
      console.error("Error submitting review:", e);
      toast.error(e.message || "Failed to submit review.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Rating</FormLabel>
          <FormControl>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6 cursor-pointer",
                    star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  )}
                  onClick={() => {
                    setRating(star);
                    form.setValue("rating", star);
                  }}
                />
              ))}
            </div>
          </FormControl>
          <FormMessage>{form.formState.errors.rating?.message}</FormMessage>
        </FormItem>

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your experience with this service..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">Submit Review</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default SubmitServiceReviewForm;