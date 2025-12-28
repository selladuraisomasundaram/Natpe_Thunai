"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "react-hot-toast"; // Assuming react-hot-toast is available

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker"; // Import the new DatePicker component

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tournament name must be at least 2 characters.",
  }).max(50, {
    message: "Tournament name must not exceed 50 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not exceed 500 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }).max(100, {
    message: "Location must not exceed 100 characters.",
  }),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
  }),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

export function PostTournamentForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startDate: undefined,
      endDate: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // For now, just log the values and show a toast.
    // In a real application, you would send this data to an API.
    console.log("Tournament data submitted:", values);
    toast.success(`Tournament "${values.name}" posted successfully!`);
    form.reset(); // Reset the form after successful submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center">Post New Tournament</h2>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer Clash 2024" {...field} />
              </FormControl>
              <FormDescription>
                This is the public name of the tournament.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little about your tournament..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about the tournament, rules, prizes, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Online, City Arena" {...field} />
              </FormControl>
              <FormDescription>
                Where will the tournament take place?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Pick a start date"
                />
              </FormControl>
              <FormDescription>
                When does the tournament begin?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Pick an end date"
                  disabled={!form.watch("startDate")} // Disable end date picker if start date is not set
                />
              </FormControl>
              <FormDescription>
                When does the tournament conclude?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Post Tournament</Button>
      </form>
    </Form>
  );
}