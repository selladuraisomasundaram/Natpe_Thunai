"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, GraduationCap, ShoppingCart, Ticket } from "lucide-react";

const CampusServicesCard = () => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Campus Hub: Services & Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Explore essential campus services, e-commerce deals, event tickets, and valuable educational resources.
        </p>

        <div className="space-y-2">
          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full justify-start bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon text-foreground">
              <LinkIcon className="h-4 w-4 mr-2 text-secondary-neon" /> Student Welfare & Support
            </Button>
          </a>
          <p className="text-xs text-muted-foreground ml-6 -mt-1">
            (Note: External link. Verify information directly with campus authorities.)
          </p>

          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full justify-start bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon text-foreground">
              <ShoppingCart className="h-4 w-4 mr-2 text-secondary-neon" /> Campus E-commerce & Deals
            </Button>
          </a>
          <p className="text-xs text-muted-foreground ml-6 -mt-1">
            (Note: External links. Exercise caution and review vendor policies before purchase.)
          </p>

          <a href="#" target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full justify-start bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon text-foreground">
              <Ticket className="h-4 w-4 mr-2 text-secondary-neon" /> Event Tickets & Bookings
            </Button>
          </a>
          <p className="text-xs text-muted-foreground ml-6 -mt-1">
            (Note: External links. Confirm event details and ticket authenticity before booking.)
          </p>

          <a href="https://www.coursera.org/courses?query=college%20students" target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full justify-start bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon text-foreground">
              <GraduationCap className="h-4 w-4 mr-2 text-secondary-neon" /> Free College Educational Resources
            </Button>
          </a>
          <p className="text-xs text-muted-foreground ml-6 -mt-1">
            (Note: External link to Coursera for college-level courses. Content availability may vary.)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampusServicesCard;