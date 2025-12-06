"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { QrCode, Heart, X } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import { toast } from "sonner";

interface ContributionStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContributionStoryDialog: React.FC<ContributionStoryDialogProps> = ({ isOpen, onClose }) => {
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI_ID);
    toast.success("UPI ID copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Heart className="h-5 w-5 text-secondary-neon" /> Our Story & Your Support
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Learn about our journey and how your contribution helps.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Card className="bg-background border-border shadow-none">
            <CardContent className="p-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Natpe🤝Thunai, meaning "Friendship🤝Support" in Tamil, was born from a simple idea: to bridge gaps and foster a stronger, more supportive community within our college campus. We saw students struggling to find help for small errands, sell unused items, or even connect for projects.
              </p>
              <p>
                This app is our passion project, built with countless hours and a deep desire to make campus life easier and more connected for everyone. It's a platform for students, by students (and a few dedicated staff!), aiming to create a self-sustaining ecosystem of mutual aid.
              </p>
              <p className="font-semibold text-foreground">
                Your contributions, no matter how small, fuel this dream. They help us maintain servers, develop new features, and ensure Natpe🤝Thunai continues to be a reliable friend and support system for generations of students to come.
              </p>
              <p className="text-center text-secondary-neon font-bold text-lg mt-4">
                Thank you for being a part of our story.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-secondary-neon" /> Our UPI ID
            </h3>
            <div className="flex flex-col items-center space-y-2 p-3 border border-border rounded-md bg-background">
              <img src="/qr.jpg" alt="Developer UPI QR Code" className="w-32 h-32 object-contain rounded-md" />
              <p className="text-lg font-bold text-foreground">
                <span className="text-secondary-neon">{DEVELOPER_UPI_ID}</span>
              </p>
              <Button
                onClick={handleCopyUpiId}
                variant="outline"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Copy UPI ID
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Scan the QR code or copy the UPI ID to contribute.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContributionStoryDialog;