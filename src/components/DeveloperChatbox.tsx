"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useDeveloperMessages, DeveloperMessage } from "@/hooks/useDeveloperMessages"; // Import the hook

interface DeveloperChatboxProps {
  // No props needed if using the hook internally
}

const DeveloperChatbox: React.FC<DeveloperChatboxProps> = () => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const { messages, isLoading, error, refetch } = useDeveloperMessages(); // Use the hook
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages load or new message arrives
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user) {
      toast.error("You must be logged in to send a message.");
      return;
    }
    if (newMessage.trim() === "") {
      toast.warning("Message cannot be empty.");
      return;
    }

    try {
      const messageData = {
        senderId: user.$id,
        senderName: user.name,
        message: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false, // Default to unread for developer to review
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );
      setNewMessage("");
      toast.success("Message sent to developer!");
      refetch(); // Refresh messages after sending
    } catch (e: any) {
      console.error("Error sending message:", e);
      toast.error(e.message || "Failed to send message.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground">Developer Chat</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea ref={scrollAreaRef} className="h-64 w-full rounded-md border p-4 bg-background">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading messages...</p>
          ) : error ? (
            <p className="text-center text-destructive">Error: {error}</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No messages yet. Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.$id} className={`mb-2 ${msg.senderId === user?.$id ? "text-right" : "text-left"}`}>
                <div className={`inline-block p-2 rounded-lg max-w-[80%] ${msg.senderId === user?.$id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <p className="text-xs font-semibold">{msg.senderName}</p>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-right opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
        <Separator className="my-4" />
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            disabled={!user || isLoading}
          />
          <Button onClick={handleSendMessage} disabled={!user || isLoading}>Send</Button>
        </div>
        {!user && <p className="text-sm text-destructive-foreground mt-2">Please log in to chat with the developer.</p>}
      </CardContent>
    </Card>
  );
};

export default DeveloperChatbox;