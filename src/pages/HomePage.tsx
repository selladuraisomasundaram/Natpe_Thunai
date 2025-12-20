"use client";

import React, { useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShoppingBag, Briefcase, NotebookPen, Search, DollarSign, Users, Utensils, Trophy, MessageSquareText } from "lucide-react";
import { useDiscoveryFeed } from "@/hooks/useDiscoveryFeed"; // NEW IMPORT
import { cn } from "@/lib/utils";

const HomePage = () => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const { feed, isLoading: isFeedLoading, error: feedError } = useDiscoveryFeed(userProfile?.collegeName); // Use the new hook

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">
        Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}!
      </h1>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/products">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Buy & Sell</div>
                <p className="text-xs text-muted-foreground">Find items or sell yours</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/freelance">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Freelance</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Services</div>
                <p className="text-xs text-muted-foreground">Offer or find services</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/errands">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errands</CardTitle>
                <NotebookPen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Campus Help</div>
                <p className="text-xs text-muted-foreground">Get help with tasks</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/short-term-needs">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Short-Term Needs</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Urgent Tasks</div>
                <p className="text-xs text-muted-foreground">For immediate assistance</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/cash-exchange">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Exchange</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Currency</div>
                <p className="text-xs text-muted-foreground">Exchange with peers</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/collaborators">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Find Teams</div>
                <p className="text-xs text-muted-foreground">Project partners</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/food-wellness">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Food & Wellness</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Canteen & More</div>
                <p className="text-xs text-muted-foreground">Food orders & health tips</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/tournaments">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Compete</div>
                <p className="text-xs text-muted-foreground">Join campus events</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/developer-dashboard">
            <Card className="bg-card text-card-foreground shadow-lg border-border hover:bg-card/90 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Developer</CardTitle>
                <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Dashboard</div>
                <p className="text-xs text-muted-foreground">Admin tools</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Discovery Feed Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Discovery Feed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {!userProfile?.collegeName ? (
              <p className="text-center text-muted-foreground py-4">
                Please select your college in your profile to see personalized feed.
              </p>
            ) : isFeedLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading discovery feed...</p>
              </div>
            ) : feedError ? (
              <p className="text-center text-destructive py-4">Error loading feed: {feedError}</p>
            ) : feed.length > 0 ? (
              feed.map((item) => (
                <div key={item.$id} className="p-3 border border-border rounded-md bg-background">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      item.type === 'product' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'cash-exchange' ? 'bg-green-100 text-green-800' :
                      item.type === 'service' ? 'bg-purple-100 text-purple-800' :
                      item.type === 'errand' ? 'bg-yellow-100 text-yellow-800' :
                      item.type === 'lost-found' ? 'bg-orange-100 text-orange-800' :
                      item.type === 'canteen' ? 'bg-red-110 text-red-800' :
                      item.type === 'tournament' ? 'bg-indigo-100 text-indigo-800' :
                      item.type === 'collaborator' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    )}>
                      {item.type.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-md mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  {item.price !== undefined && <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-foreground">₹{item.price.toFixed(2)}</span></p>}
                  <p className="text-xs text-muted-foreground">Posted by: <span className="font-medium text-foreground">{item.posterName} ({item.collegeName})</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(item.$createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent activity in your college feed.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default HomePage;