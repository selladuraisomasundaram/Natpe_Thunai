"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";

const DeletionInfoMessage: React.FC = () => {
  return (
    <Alert className="bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertTitle className="font-semibold text-blue-600 dark:text-blue-400">Important Post Information</AlertTitle>
      <AlertDescription className="text-sm space-y-1">
        <p>Once a post is published, it cannot be deleted by yourself.</p>
        <p>If you need to remove or modify your post, please contact the developers directly via the <Link to="/profile" className="text-secondary-neon hover:underline">"Chat with Developers"</Link> section in your profile.</p>
      </AlertDescription>
    </Alert>
  );
};

export default DeletionInfoMessage;