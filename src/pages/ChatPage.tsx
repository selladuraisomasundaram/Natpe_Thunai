"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquareText, Send, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, APPWRITE_CHAT_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { Models, ID, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "@/components/made-with-dyad";

// --- INTERFACES ---
interface ChatRoom extends Models.Document {
  transactionId: string;
  serviceId: string;
  buyerId: string;
  providerId: string;
  buyerUsername: string;
  providerUsername: string;
  status: "active" | "closed";
}

interface ChatMessage extends Models.Document {
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
}

const ChatPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIAL FETCH & REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (isAuthLoading || !user || !chatRoomId) return;

    let unsubscribe: () => void;

    const setupChat = async () => {
      setIsLoadingChat(true);
      try {
        // A. Fetch Room Details
        const roomDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_ROOMS_COLLECTION_ID,
          chatRoomId
        ) as unknown as ChatRoom;

        // Security: Ensure user is part of the room
        if (roomDoc.buyerId !== user.$id && roomDoc.providerId !== user.$id) {
          toast.error("Access denied.");
          navigate("/tracking");
          return;
        }
        setChatRoom(roomDoc);

        // B. Fetch Message History
        const messagesResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
          [
            Query.equal('chatRoomId', chatRoomId),
            Query.orderAsc('$createdAt'),
            Query.limit(100)
          ]
        );
        setMessages(messagesResponse.documents as unknown as ChatMessage[]);

        // C. Subscribe to NEW Messages (Appwrite Realtime)
        unsubscribe = databases.client.subscribe(
          `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CHAT_MESSAGES_COLLECTION_ID}.documents`,
          (response) => {
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              const payload = response.payload as unknown as ChatMessage;
              if (payload.chatRoomId === chatRoomId) {
                setMessages((prev) => {
                    // Prevent duplicates
                    if (prev.some(m => m.$id === payload.$id)) return prev;
                    return [...prev, payload];
                });
              }
            }
          }
        );

      } catch (error: any) {
        console.error("Chat Error:", error);
        toast.error("Could not load chat.");
        navigate("/tracking");
      } finally {
        setIsLoadingChat(false);
      }
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, chatRoomId, isAuthLoading, navigate]);

  // --- 2. AUTO-SCROLL ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoadingChat]);

  // --- 3. SEND MESSAGE HANDLER ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage || !user || !chatRoomId) return;

    setIsSendingMessage(true);
    try {
      // Create Message Directly in Appwrite
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          chatRoomId: chatRoomId,
          senderId: user.$id,
          senderUsername: user.name,
          content: trimmedMessage,
        }
      );
      setNewMessage(""); // Clear input
    } catch (error: any) {
      console.error("Send Error:", error);
      toast.error("Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoadingChat || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (!chatRoom || !user) return null;

  const isBuyer = user.$id === chatRoom.buyerId;
  const otherParticipantName = isBuyer ? chatRoom.providerUsername : chatRoom.buyerUsername;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card className="bg-card text-card-foreground shadow-xl border-border h-[80vh] flex flex-col">
          <CardHeader className="p-4 border-b border-border/50 bg-secondary/5">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-secondary-neon" /> {otherParticipantName}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <MessageSquareText className="h-12 w-12 mb-2" />
                    <p>Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.$id;
                  return (
                    <div key={msg.$id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm", isMe ? "bg-secondary-neon text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                        <p>{msg.content}</p>
                        <p className="text-[9px] text-right mt-1 opacity-60">{new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-3 bg-background border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                    autoFocus
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow"
                    disabled={isSendingMessage}
                />
                <Button type="submit" size="icon" className="bg-secondary-neon" disabled={isSendingMessage || !newMessage.trim()}>
                    {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                </form>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ChatPage;