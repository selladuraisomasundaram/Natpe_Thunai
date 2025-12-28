"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useDeveloperMessages } from '@/hooks/useDeveloperMessages';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DeveloperChatbox = () => {
  const { user, userPreferences, loading: isAuthLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const collegeName = userPreferences?.collegeName;
  const { allMessages: messages, isLoading, error, sendMessage, refetch } = useDeveloperMessages(collegeName);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user || !userPreferences?.collegeName) {
      toast.error("Please log in and set your college name to send messages.");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage("");
    } catch (err) {
      // Error handled in hook
    } finally {
      setIsSending(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Developer Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-neon" />
        </CardContent>
      </Card>
    );
  }

  if (!userPreferences?.isDeveloper) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Developer Chat</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground p-4">
          <p>You must be a developer to access this chat.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Developer Chat</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive-foreground bg-destructive/10 p-4 rounded-lg">
          <p>Error loading messages: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Developer Chat ({collegeName || 'All Colleges'})</CardTitle>
      </CardHeader>
      <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 border-t border-b border-border">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary-neon" />
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.$id} className={`flex ${msg.senderId === user?.$id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg ${msg.senderId === user?.$id ? 'bg-secondary-neon text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <p className="text-xs font-semibold mb-1">
                  {msg.senderId === user?.$id ? 'You' : msg.senderName}
                </p>
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="p-4">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending || !user}
            className="flex-1 bg-input text-foreground border-border"
          />
          <Button type="submit" disabled={isSending || !user}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default DeveloperChatbox;