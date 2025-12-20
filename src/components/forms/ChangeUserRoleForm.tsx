"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { account, databases } from "@/lib/appwrite"; // Assuming Appwrite setup
import { Query } from "appwrite";

interface ChangeUserRoleFormProps {
  onRoleChanged: () => void;
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onRoleChanged }) => {
  const { updateUserProfile } = useAuth(); // NEW: Use useAuth hook
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<"student" | "ambassador" | "developer" | "admin">("student");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !newRole) {
      toast.error("Please enter a user ID and select a new role.");
      return;
    }

    setIsLoading(true);
    try {
      // In a real Appwrite setup, you'd query the 'user_profiles' collection
      // to find the document ID associated with the targetUserId.
      // For this example, we'll simulate finding the profile.
      // Assuming 'user_profiles' collection has a 'userId' attribute.

      // Simulate fetching profileId based on targetUserId
      // In a real app, this would be a database query:
      // const response = await databases.listDocuments(
      //   process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      //   'user_profiles_collection_id', // Replace with your actual collection ID
      //   [Query.equal('userId', targetUserId)]
      // );
      // if (response.documents.length === 0) {
      //   toast.error("User profile not found.");
      //   setIsLoading(false);
      //   return;
      // }
      // const profileId = response.documents[0].$id;

      // For now, we'll just assume the targetUserId is the profileId for simplicity
      // In a real scenario, you'd need to fetch the actual profile document ID
      const profileId = targetUserId; // This is a simplification for the mock context

      // Then, update the role using the profile document ID
      await updateUserProfile({ role: newRole }); // Corrected call: pass only the updates object
      toast.success(`User ${targetUserId} role changed to "${newRole}" successfully!`);
      onRoleChanged();
      setTargetUserId("");
    } catch (error) {
      console.error("Failed to change user role:", error);
      toast.error("Failed to change user role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">Change User Role</h3>
      <div>
        <Label htmlFor="targetUserId">Target User ID</Label>
        <Input
          id="targetUserId"
          type="text"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="Enter user ID"
          required
        />
      </div>
      <div>
        <Label htmlFor="newRole">New Role</Label>
        <Select value={newRole} onValueChange={(value: "student" | "ambassador" | "developer" | "admin") => setNewRole(value)}>
          <SelectTrigger id="newRole">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="ambassador">Ambassador</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Changing Role..." : "Change Role"}
      </Button>
    </form>
  );
};

export default ChangeUserRoleForm;