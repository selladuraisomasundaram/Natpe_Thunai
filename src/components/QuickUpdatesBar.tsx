"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const QuickUpdatesBar = () => {
  const navigate = useNavigate();

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "post-job":
        toast.info("Navigating to Services section...");
        navigate("/services"); // Navigate to main services page
        break;
      case "list-item":
        toast.info("Navigating to Market section...");
        navigate("/market"); // Navigate to main market page
        break;
      case "cash-exchange":
        toast.info("Navigating to Activity section...");
        navigate("/activity"); // Navigate to main activity page
        break;
      default:
        toast.info(`"${actionType}" feature coming soon!`);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardContent className="p-4 flex justify-around items-center gap-2">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-foreground hover:bg-primary/10 hover:text-secondary-neon"
          onClick={() => handleAction("post-job")}
        >
          <Briefcase className="h-5 w-5" />
          <span className="text-xs">Post a Job</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-foreground hover:bg-primary/10 hover:text-secondary-neon"
          onClick={() => handleAction("list-item")}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs">List an Item</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-foreground hover:bg-primary/10 hover:text-secondary-neon"
          onClick={() => handleAction("cash-exchange")}
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-xs">Cash Exchange</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickUpdatesBar;