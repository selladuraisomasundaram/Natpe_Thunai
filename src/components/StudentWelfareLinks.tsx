"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap, Laptop, BookOpen } from "lucide-react";
import { toast } from "sonner";

const welfareLinks = [
  { name: "Educational Resources", icon: BookOpen, url: "https://www.tntextbooks.in/", platform: "TN Textbooks" },
  { name: "Student Electronics Deals", icon: Laptop, url: "https://www.amazon.in/b?node=1375424031", platform: "Amazon Student" },
  { name: "General Student Welfare", icon: GraduationCap, url: "https://www.aicte-india.org/schemes/students-development-schemes", platform: "AICTE Schemes" },
];

const StudentWelfareLinks = () => {
  const handleRedirect = (platform: string, url: string) => {
    window.open(url, "_blank");
    toast.info(`Redirecting to ${platform}...`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Student Welfare & E-commerce
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          Access affiliated e-commerce sites and student welfare resources relevant to Tamil Nadu.
        </p>
        <div className="space-y-2">
          {welfareLinks.map((link) => (
            <Button
              key={link.name}
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleRedirect(link.platform, link.url)}
            >
              <link.icon className="mr-2 h-4 w-4" /> {link.name} <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Disclaimer: External links. Natpe🤝Thunai is not responsible for content on partner sites.
        </p>
      </CardContent>
    </Card>
  );
};

export default StudentWelfareLinks;