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
import { Loader2, Briefcase, Clock, RefreshCcw, Link as LinkIcon, IndianRupee, LayoutGrid, Zap } from "lucide-react";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";
import { cn } from "@/lib/utils";

// Enhanced Schema
const ServiceFormSchema = z.object({
  title: z.string().min(2, { message: "Brief title required." }),
  description: z.string().min(10, { message: "Describe what you offer/need." }),
  category: z.string().min(1, { message: "Select a category." }),
  otherCategoryDescription: z.string().optional(),
  price: z.string().min(1, { message: "Price required." }),
  pricingModel: z.enum(["fixed", "hourly"]), // NEW
  deliveryTime: z.string().min(1, { message: "Timeframe required." }), // NEW
  revisions: z.string().optional(), // NEW
  portfolioUrl: z.string().url().optional().or(z.literal("")), // NEW
  contact: z.string().min(5, { message: "Contact info required." }),
  isCustomOrder: z.boolean().default(false),
  customOrderDescription: z.string().optional(),
  ambassadorDelivery: z.boolean().default(false),
  ambassadorMessage: z.string().optional(),
});

interface PostServiceFormProps {
  onSubmit: (data: z.infer<typeof ServiceFormSchema>) => Promise<void>;
  onCancel: () => void;
  categoryOptions: { value: string; label: string }[];
  initialCategory?: string;
  isCustomOrder?: boolean;
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({
  onSubmit,
  onCancel,
  categoryOptions,
  initialCategory,
  isCustomOrder = false,
}) => {
  const form = useForm<z.infer<typeof ServiceFormSchema>>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: initialCategory || "",
      otherCategoryDescription: "",
      price: "",
      pricingModel: "fixed",
      deliveryTime: "",
      revisions: "1",
      portfolioUrl: "",
      contact: "",
      isCustomOrder: isCustomOrder,
      customOrderDescription: "",
      ambassadorDelivery: false,
      ambassadorMessage: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Handle Logic for "Other" category and Custom Order defaults
  useEffect(() => {
    if (initialCategory) form.setValue("category", initialCategory);
    form.setValue("isCustomOrder", isCustomOrder);
  }, [initialCategory, isCustomOrder, form]);

  const handleSubmit = async (data: z.infer<typeof ServiceFormSchema>) => {
    // If custom order, map description fields appropriately before sending
    if (data.isCustomOrder && data.customOrderDescription) {
        data.description = `${data.description}\n\nSpecifics: ${data.customOrderDescription}`;
    }
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <DeletionInfoMessage />

        {/* --- HEADER SECTION --- */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-secondary-neon" /> 
                {isCustomOrder ? "Request Title" : "Gig Title"}
              </FormLabel>
              <FormControl>
                <Input 
                    placeholder={isCustomOrder ? "e.g. Need a Python Tutor" : "e.g. I will design your event posters"} 
                    {...field} 
                    className="h-12 bg-secondary/5 border-border focus:ring-secondary-neon text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- DETAILS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-foreground font-semibold">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger className="h-11 bg-secondary/5 border-border">
                        <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            {/* Other Category Input */}
            {form.watch("category") === "other" && (
                <FormField
                control={form.control}
                name="otherCategoryDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-foreground font-semibold">Specify Category</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Video Editing" {...field} className="h-11 bg-secondary/5 border-border" />
                    </FormControl>
                    </FormItem>
                )}
                />
            )}
        </div>

        {/* --- PRICING SECTION --- */}
        <div className="grid grid-cols-5 gap-3">
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                <FormItem className="col-span-3">
                    <FormLabel className="text-foreground font-semibold">Rate</FormLabel>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="number" 
                            placeholder="500" 
                            {...field} 
                            className="pl-9 h-11 bg-secondary/5 border-border" 
                        />
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                <FormItem className="col-span-2">
                    <FormLabel className="text-foreground font-semibold">Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger className="h-11 bg-secondary/5 border-border">
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Per Hour</SelectItem>
                    </SelectContent>
                    </Select>
                </FormItem>
                )}
            />
        </div>

        {/* --- LOGISTICS (Time & Revisions) --- */}
        {!isCustomOrder && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="deliveryTime"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-blue-500" /> Timeframe
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 2 Days" {...field} className="h-11 bg-secondary/5 border-border" />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="revisions"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                            <RefreshCcw className="h-3.5 w-3.5 text-green-500" /> Revisions
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11 bg-secondary/5 border-border">
                            <SelectValue placeholder="Select" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="0">No Revisions</SelectItem>
                            <SelectItem value="1">1 Revision</SelectItem>
                            <SelectItem value="2">2 Revisions</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                        </Select>
                    </FormItem>
                    )}
                />
            </div>
        )}

        {/* --- DESCRIPTION --- */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Details
              </FormLabel>
              <FormControl>
                <Textarea 
                    placeholder="Describe your skills, what tools you use, or exactly what you need help with." 
                    {...field} 
                    className="bg-secondary/5 border-border min-h-[100px] resize-none" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- PORTFOLIO & CONTACT --- */}
        {!isCustomOrder && (
            <FormField
            control={form.control}
            name="portfolioUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground font-semibold flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-secondary-neon" /> Sample Work (Optional)
                </FormLabel>
                <FormControl>
                    <Input 
                        placeholder="Link to Drive / Behance / Github" 
                        {...field} 
                        className="h-11 bg-secondary/5 border-border" 
                    />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">Show students what you can do!</p>
                </FormItem>
            )}
            />
        )}

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-semibold">Contact Method</FormLabel>
              <FormControl>
                <Input 
                    placeholder="WhatsApp / Telegram / Phone" 
                    {...field} 
                    className="h-11 bg-secondary/5 border-border" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- OPTIONAL DELIVERY (Hidden for purely digital, but kept for hybrid) --- */}
        <div className="opacity-80 hover:opacity-100 transition-opacity">
            <AmbassadorDeliveryOption
                ambassadorDelivery={form.watch('ambassadorDelivery')}
                setAmbassadorDelivery={(val) => form.setValue('ambassadorDelivery', val)}
                ambassadorMessage={form.watch('ambassadorMessage') || ''}
                setAmbassadorMessage={(val) => form.setValue('ambassadorMessage', val)}
            />
        </div>

        {/* --- ACTIONS --- */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-12 border-border hover:bg-background">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-[2] h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-md">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isCustomOrder ? "Post Request" : "Launch Gig")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostServiceForm;