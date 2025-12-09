"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DICEBEAR_AVATAR_STYLES } from "@/utils/avatarGenerator"; // Import avatar styles

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  age: z.number().min(16, "Must be at least 16 years old."),
  mobileNumber: z.string().min(10, "Mobile number is required.").max(10, "Mobile number must be 10 digits."),
  upiId: z.string().min(5, "UPI ID is required."),
  gender: z.enum(["male", "female", "prefer-not-to-say"]),
  userType: z.enum(["student", "staff"]),
  collegeName: z.string().min(1, "College name is required."),
  avatarStyle: z.string().min(1, "Avatar style is required."), // NEW: Avatar style
});

interface EditProfileFormProps {
  initialData: z.infer<typeof formSchema>;
  onSave: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void; // Add onCancel prop
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleSave = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Profile updated successfully!");
      onCancel(); // Close dialog on successful save
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">First Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Last Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Age</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Mobile Number</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="upiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">UPI ID</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Gender</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4" disabled={isSaving}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="gender-male" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="gender-male" className="text-foreground">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="gender-female" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="gender-female" className="text-foreground">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="gender-prefer-not-to-say" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="gender-prefer-not-to-say" className="text-foreground">Prefer not to say</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">User Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4" disabled={isSaving}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="user-type-student" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="user-type-student" className="text-foreground">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staff" id="user-type-staff" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="user-type-staff" className="text-foreground">Staff</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collegeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">College Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Avatar Style</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select avatar style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border max-h-60 overflow-y-auto">
                  {DICEBEAR_AVATAR_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>{style.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EditProfileForm;