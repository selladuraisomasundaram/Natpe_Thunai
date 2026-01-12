"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, MapPin, DollarSign, Phone, Clock, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";

// Define the schema
const formSchema = z.object({
  title: z.string().min(2, { message: "Brief title required (min 2 chars)." }),
  description: z.string().min(10, { message: "Please describe the task in detail." }),
  type: z.string().min(1, { message: "Select a category." }),
  otherTypeDescription: z.string().optional(),
  compensation: z.string().min(2, { message: "What do they get? (Money/Coffee/Favor)" }),
  location: z.string().min(2, { message: "Where should this happen?" }), // NEW
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact info required." }),
});

interface PostErrandFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
  typeOptions: { value: string; label: string }[];
  initialType?: string;
}

const PostErrandForm: React.FC<PostErrandFormProps> = ({ onSubmit, onCancel, typeOptions, initialType }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      otherTypeDescription: "",
      compensation: "",
      location: "", // NEW
      deadline: undefined,
      contact: "",
    },
  });

  // Handle Initial Type Selection
  useEffect(() => {
    if (initialType) {
      const isStandardType = typeOptions.some(option => option.value === initialType);
      if (isStandardType) {
        form.setValue("type", initialType);
        form.setValue("otherTypeDescription", "");
      } else {
        form.setValue("type", "other");
        form.setValue("otherTypeDescription", initialType);
      }
    }
  }, [initialType, typeOptions, form]);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await onSubmit(data);
  };

  const selectedType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <DeletionInfoMessage />
        
        {/* Title Section */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary-neon" /> Task Title
              </FormLabel>
              <FormControl>
                <Input 
                    placeholder="e.g. Need Biology Notes from Library" 
                    {...field} 
                    className="h-12 bg-secondary/5 border-border focus:ring-secondary-neon text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type & Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground font-semibold">Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger className="h-11 bg-secondary/5 border-border">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                        {option.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Location / Meeting Spot
                </FormLabel>
                <FormControl>
                    <Input 
                        placeholder="e.g. Block A Lobby, Library" 
                        {...field} 
                        className="h-11 bg-secondary/5 border-border"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {selectedType === "other" && (
          <FormField
            control={form.control}
            name="otherTypeDescription"
            render={({ field }) => (
              <FormItem className="-mt-2">
                <FormLabel className="text-xs text-muted-foreground">Please specify the type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Queuing help" {...field} className="bg-secondary/5 border-border h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold">Details</FormLabel>
              <FormControl>
                <Textarea 
                    placeholder="Exactly what do you need help with? Be specific to get faster responses." 
                    {...field} 
                    className="bg-secondary/5 border-border min-h-[100px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Compensation & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="compensation"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground font-semibold flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-green-500" /> Compensation / Reward
                </FormLabel>
                <FormControl>
                    <Input 
                        placeholder="e.g. ₹50, Free Lunch, Notes swap" 
                        {...field} 
                        className="h-11 bg-secondary/5 border-border"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel className="text-foreground font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Deadline (Optional)
                </FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal h-11 bg-secondary/5 border-border",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* Contact */}
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Contact Info
              </FormLabel>
              <FormControl>
                <Input 
                    placeholder="WhatsApp / Telegram / Phone Number" 
                    {...field} 
                    className="h-11 bg-secondary/5 border-border"
                />
              </FormControl>
              <p className="text-[10px] text-muted-foreground">This will be revealed only after someone accepts the task.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 border-border hover:bg-background">
            Cancel
          </Button>
          <Button type="submit" className="flex-[2] h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-md">
            <CheckCircle2 className="mr-2 h-5 w-5" /> Post Task
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostErrandForm;