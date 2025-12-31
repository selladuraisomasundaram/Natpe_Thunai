"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast"; // Assuming react-hot-toast is installed

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isRegister?: boolean;
}

export function AuthForm({ isRegister = false, className, ...props }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const url = isRegister ? "/api/register" : "/api/login";
    const method = "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // If the server responded with an error status (e.g., 400, 401, 500)
        const errorData = await response.json();
        console.error("API Error:", response.status, response.statusText, errorData);
        toast.error(errorData.message || `Operation failed: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log("Success:", data);
      toast.success(isRegister ? "Registration successful!" : "Login successful!");
      // Here you would typically handle successful login/registration,
      // e.g., store a token, redirect the user, update global state.
    } catch (error) {
      // This catch block handles network errors (e.g., "Failed to fetch")
      // or other unexpected client-side errors.
      console.error("Network or unexpected error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error("Failed to connect to the server. Please check your internet connection or try again later.");
      } else if (error instanceof Error) {
        toast.error(`An error occurred: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6" {...props}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="m@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isRegister ? "Register" : "Log In"}
          </Button>
        </div>
      </form>
    </div>
  );
}