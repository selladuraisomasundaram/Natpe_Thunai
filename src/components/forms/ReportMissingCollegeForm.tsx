"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Keep useAuth to pre-fill if logged in
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MISSING_COLLEGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';

const formSchema = z.object({
  collegeName: z.string().min(2, { message: "College name must be at least 2 characters." }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
});

interface ReportMissingCollegeFormProps {
  onReportSubmitted: () => void;
  onCancel: () => void;
}

const ReportMissingCollegeForm: React.FC<ReportMissingCollegeFormProps> = ({ onReportSubmitted, onCancel }) => {
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collegeName: "",
      reason: "",
      contactEmail: user?.email || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const reportData = {
        collegeName: data.collegeName,
        reason: data.reason,
        contactEmail: data.contactEmail || null, // Store null if empty
        reporterId: user?.$id || 'anonymous', // Store user ID if logged in
        status: 'pending',
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MISSING_COLLEGES_COLLECTION_ID,
        ID.unique(),
        reportData
      );
      
      toast.success(`Report for "${data.collegeName}" submitted successfully!`);
      onReportSubmitted();
    } catch (e: any) {
      console.error("Error submitting missing college report:", e);
      toast.error(e.message || "Failed to submit report.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="collegeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., University of Example" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Reporting</FormLabel>
              <FormControl>
                <Textarea placeholder="Explain why this college should be added..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., your@example.com" {...field} />
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
          <Button type="submit">Submit Report</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default ReportMissingCollegeForm;