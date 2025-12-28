"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext'; // NEW: Use useAuth hook
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Client, Databases, ID } from 'appwrite';

interface JoinAmbassadorFormProps {
  onApply: () => void;
  onCancel: () => void;
}

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default_database_id';
const AMBASSADOR_APPLICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID || 'ambassador_applications';

const JoinAmbassadorForm: React.FC<JoinAmbassadorFormProps> = ({ onApply, onCancel }) => {
  const { user, userPreferences } = useAuth(); // NEW: Use useAuth hook
  const [name, setName] = useState(userPreferences?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [college, setCollege] = useState(userPreferences?.collegeName || "");
  const [whyJoin, setWhyJoin] = useState("");
  const [experience, setExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.$id) {
      toast.error("You must be logged in to apply.");
      return;
    }
    if (!name || !email || !college || !whyJoin) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationData = {
        applicantId: user.$id,
        applicantName: name,
        applicantEmail: email,
        collegeName: college,
        whyJoin: whyJoin,
        experience: experience,
        status: 'pending', // Initial status
        createdAt: new Date().toISOString(),
      };

      await databases.createDocument(
        DATABASE_ID,
        AMBASSADOR_APPLICATIONS_COLLECTION_ID,
        ID.unique(),
        applicationData
      );
      toast.success("Ambassador application submitted successfully!");
      onApply();
    } catch (error: any) {
      console.error("Failed to submit ambassador application:", error);
      toast.error(error.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
          disabled={!!userPreferences?.name} // Disable if name is already in preferences
        />
      </div>
      <div>
        <Label htmlFor="email">Your Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john.doe@example.com"
          required
          disabled={!!user?.email} // Disable if email is already in user object
        />
      </div>
      <div>
        <Label htmlFor="college">Your College</Label>
        <Input
          id="college"
          type="text"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          placeholder="University of Example"
          required
          disabled={!!userPreferences?.collegeName} // Disable if collegeName is already in preferences
        />
      </div>
      <div>
        <Label htmlFor="whyJoin">Why do you want to join the Ambassador Program?</Label>
        <Textarea
          id="whyJoin"
          value={whyJoin}
          onChange={(e) => setWhyJoin(e.target.value)}
          placeholder="Share your motivation..."
          rows={4}
          required
        />
      </div>
      <div>
        <Label htmlFor="experience">Relevant Experience (Optional)</Label>
        <Textarea
          id="experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Any leadership, community, or marketing experience?"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Apply Now'
          )}
        </Button>
      </div>
    </form>
  );
};

export default JoinAmbassadorForm;