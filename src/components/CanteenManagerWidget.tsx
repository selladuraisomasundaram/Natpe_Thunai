"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input'; // Imported Input
import { Label } from '@/components/ui/label'; // Imported Label
import { useCanteenData } from '@/hooks/useCanteenData';
import { useAuth } from '@/context/AuthContext'; // NEW: Use useAuth hook
import AddCanteenForm from './forms/AddCanteenForm';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Ensure toast is imported

const CanteenManagerWidget = () => {
  const { userPreferences } = useAuth(); // NEW: Use useAuth hook
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCanteen, setCurrentCanteen] = useState<{ id: string; name: string } | null>(null);
  const [editCanteenName, setEditCanteenName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCanteen = async (name: string, collegeName: string) => {
    setIsSubmitting(true);
    try {
      await addCanteen(name, collegeName);
      setIsAddCanteenDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (canteen: { $id: string; name: string }) => { // Changed type to match CanteenData
    setCurrentCanteen({ id: canteen.$id, name: canteen.name }); // Map $id to id
    setEditCanteenName(canteen.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCanteen && editCanteenName.trim()) {
      setIsSubmitting(true);
      try {
        await updateCanteen(currentCanteen.id, editCanteenName.trim());
        setIsEditDialogOpen(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!userPreferences?.isDeveloper) {
    return null; // Only show for developers
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Canteen Manager</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-neon" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Canteen Manager</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
          <p>Error: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Canteen Manager</CardTitle>
        <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Canteen
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>Add New Canteen</DialogTitle>
            </DialogHeader>
            <AddCanteenForm
              onSubmit={handleAddCanteen}
              onCancel={() => setIsAddCanteenDialogOpen(false)}
              loading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {allCanteens.length === 0 ? (
          <p className="text-muted-foreground">No canteens found for your college.</p>
        ) : (
          <ul className="space-y-2">
            {allCanteens.map((canteen) => (
              <li key={canteen.$id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                <span className="font-medium">{canteen.name}</span>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(canteen)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>Edit Canteen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCanteen} className="space-y-4">
              <div>
                <Label htmlFor="editCanteenName">Canteen Name</Label>
                <Input
                  id="editCanteenName"
                  type="text"
                  value={editCanteenName}
                  onChange={(e) => setEditCanteenName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;