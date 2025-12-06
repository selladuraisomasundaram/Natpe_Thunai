"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

interface AvatarOptions {
  hair?: string;
  eyes?: string;
  mouth?: string;
  skinColor?: string;
  clothing?: string;
  accessories?: string;
}

interface AvatarCustomizerFormProps {
  initialAvatarOptions: AvatarOptions;
  onSave: (options: AvatarOptions) => Promise<void>;
  onCancel: () => void;
}

// DiceBear 'personas' style options (simplified for demonstration)
const HAIR_OPTIONS = ["long", "short", "curly", "bald"];
const EYES_OPTIONS = ["closed", "open", "wink"];
const MOUTH_OPTIONS = ["smile", "frown", "neutral"];
const SKIN_COLOR_OPTIONS = ["light", "medium", "dark"];
const CLOTHING_OPTIONS = ["shirt", "hoodie", "suit"];
const ACCESSORIES_OPTIONS = ["glasses", "earrings", "none"];


const AvatarCustomizerForm: React.FC<AvatarCustomizerFormProps> = ({
  initialAvatarOptions,
  onSave,
  onCancel,
}) => {
  const { user, userProfile } = useAuth();
  const [currentOptions, setCurrentOptions] = useState<AvatarOptions>(initialAvatarOptions);
  const [isSaving, setIsSaving] = useState(false);

  // Update form fields if initialAvatarOptions changes
  useEffect(() => {
    setCurrentOptions(initialAvatarOptions);
  }, [initialAvatarOptions]);

  const handleOptionChange = (key: keyof AvatarOptions, value: string) => {
    setCurrentOptions((prev) => ({ ...prev, [key]: value === "none" ? undefined : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(currentOptions);
      onCancel(); // Close dialog on successful save
    } catch (error) {
      // Error handled by onSave prop
    } finally {
      setIsSaving(false);
    }
  };

  const previewAvatarUrl = user && userProfile
    ? generateAvatarUrl(
        user.name,
        userProfile.gender || "prefer-not-to-say",
        userProfile.userType || "student",
        currentOptions
      )
    : "/app-logo.png"; // Fallback

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="flex justify-center mb-4">
        <Avatar className="h-24 w-24 border-2 border-secondary-neon">
          <AvatarImage src={previewAvatarUrl} alt="Avatar Preview" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.name.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="hair" className="text-left sm:text-right text-foreground">Hair</Label>
        <Select
          value={currentOptions.hair || "none"}
          onValueChange={(value) => handleOptionChange("hair", value)}
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select hair style" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="none">Default</SelectItem>
            {HAIR_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="eyes" className="text-left sm:text-right text-foreground">Eyes</Label>
        <Select
          value={currentOptions.eyes || "none"}
          onValueChange={(value) => handleOptionChange("eyes", value)}
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select eye style" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="none">Default</SelectItem>
            {EYES_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="mouth" className="text-left sm:text-right text-foreground">Mouth</Label>
        <Select
          value={currentOptions.mouth || "none"}
          onValueChange={(value) => handleOptionChange("mouth", value)}
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select mouth style" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="none">Default</SelectItem>
            {MOUTH_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="clothing" className="text-left sm:text-right text-foreground">Clothing</Label>
        <Select
          value={currentOptions.clothing || "none"}
          onValueChange={(value) => handleOptionChange("clothing", value)}
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select clothing" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="none">Default</SelectItem>
            {CLOTHING_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="accessories" className="text-left sm:text-right text-foreground">Accessories</Label>
        <Select
          value={currentOptions.accessories || "none"}
          onValueChange={(value) => handleOptionChange("accessories", value)}
          disabled={isSaving}
        >
          <SelectTrigger className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select accessories" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="none">None</SelectItem>
            {ACCESSORIES_OPTIONS.filter(opt => opt !== "none").map((option) => (
              <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Avatar"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AvatarCustomizerForm;