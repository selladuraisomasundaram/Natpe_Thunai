"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext'; // NEW: Use useAuth hook
import toast from 'react-hot-toast'; // Ensure toast is imported

interface AddCanteenFormProps {
  onSubmit: (canteenName: string, collegeName: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const AddCanteenForm: React.FC<AddCanteenFormProps> = ({ onSubmit, onCancel, loading }) => {
  const { userPreferences } = useAuth(); // NEW: Use useAuth hook
  const [canteenName, setCanteenName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPreferences?.collegeName) {
      toast.error("Please set your college name in your profile before adding a canteen.");
      return;
    }
    if (canteenName.trim()) {
      onSubmit(canteenName.trim(), userPreferences.collegeName);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="canteenName">Canteen Name</Label>
        <Input
          id="canteenName"
          type="text"
          value={canteenName}
          onChange={(e) => setCanteenName(e.target.value)}
          placeholder="e.g., Main Cafeteria"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Canteen"}
        </Button>
      </div>
    </form>
  );
};

export default AddCanteenForm;