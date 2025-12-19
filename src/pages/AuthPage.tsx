"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MadeWithDyad } from "@/components/made-with-dyad";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  collegeName: z.string().min(2, { message: "College name is required." }),
  age: z.preprocess(
    (val) => Number(val),
    z.number().min(18, { message: "You must be at least 18 years old." })
  ),
  role: z.enum(["student", "faculty", "alumni"], { message: "Please select a role." }),
  collegeIdFile: typeof window === 'undefined' ? z.any().optional() : z.instanceof(FileList).optional(),
});

const AuthPage = () => {
  const { login, register, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      collegeName: "",
      age: 18,
      role: "student",
      collegeIdFile: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register(values.email, values.password, values.name);
        if (user) { // Check if user is successfully registered and logged in
          // Upload college ID if provided
          let collegeIdFileUrl = '';
          if (values.collegeIdFile && values.collegeIdFile.length > 0) {
            const file = values.collegeIdFile[0];
            const response = await storage.createFile(
              APPWRITE_COLLEGE_ID_BUCKET_ID,
              ID.unique(),
              file
            );
            collegeIdFileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_COLLEGE_ID_BUCKET_ID}/files/${response.$id}/view?project=${APPWRITE_PROJECT_ID}`;
          }

          // Create user profile
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_PROFILES_COLLECTION_ID,
            user.$id, // Use user's Appwrite ID as document ID
            {
              userId: user.$id,
              name: values.name,
              email: values.email,
              collegeName: values.collegeName,
              age: values.age,
              role: values.role,
              collegeIdUrl: collegeIdFileUrl,
              isVerified: false, // Default to false, requires admin verification
            }
          );
          toast.success("Profile created. Awaiting college ID verification.");
        }
      } else {
        await login(values.email, values.password);
      }
      navigate("/"); // Redirect to home on success
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-2xl font-bold text-center text-card-foreground">
            {isRegistering ? "Register" : "Login"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegistering && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>College Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your University" {...field} />
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
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="18" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="student" id="r1" />
                              <Label htmlFor="r1">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="faculty" id="r2" />
                              <Label htmlFor="r2">Faculty</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="alumni" id="r3" />
                              <Label htmlFor="r3">Alumni</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collegeIdFile"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Upload College ID (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...fieldProps}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(event) => onChange(event.target.files)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={authLoading || isSubmitting}>
                {authLoading || isSubmitting ? "Processing..." : (isRegistering ? "Register" : "Login")}
              </Button>
            </form>
          </Form>
          <Button
            variant="link"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full mt-4 text-secondary-neon"
            disabled={authLoading || isSubmitting}
          >
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </Button>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default AuthPage;