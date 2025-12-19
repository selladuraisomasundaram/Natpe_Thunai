"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from 'appwrite';

const formSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
  newRole: z.enum(["student", "faculty", "alumni", "ambassador", "developer"], { message: "Please select a valid role." }),
});

interface ChangeUserRoleFormProps {
  onRoleChanged: () => void;
  onCancel: () => void;
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onRoleChanged, onCancel }) => {
  const { updateUserProfile } = useAuth(); // Updated destructuring
  const [targetUserId, setTargetUserId] = useState("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      newRole: "student",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // In a real application, you would fetch the user profile by userId
      // and then update their role. For this example, we'll simulate.
      
      // First, find the user profile document by userId
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', data.userId)]
      );

      if (response.documents.length === 0) {
        toast.error("User profile not found for the given ID.");
        return;
      }

      const userProfileDoc = response.documents[0];
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfileDoc.$id,
        { role: data.newRole }
      );

      // If the current logged-in user's role is changed, update AuthContext
      // This is a simplified check; a more robust solution would involve real-time updates
      // or re-fetching the current user's profile after any update.
      // For now, we'll just call the placeholder updateUserProfile if the ID matches.
      if (userProfileDoc.userId === useAuth().user?.$id) {
        updateUserProfile({ role: data.newRole });
      }

      toast.success(`User ${data.userId}'s role changed to ${data.newRole}.`);
      onRoleChanged();
    } catch (e: any) {
      console.error("Error changing user role:", e);
      toast.error(e.message || "Failed to change user role.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target User ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., user_123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="ambassador">Ambassador</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
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
          <Button type="submit">Change Role</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default ChangeUserRoleForm;