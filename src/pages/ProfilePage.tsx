"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider"; 
import { useNavigate, Link } from "react-router-dom";
import DeveloperChatbox from "@/components/DeveloperChatbox";
import { useAuth } from "@/context/AuthContext";
import GraduationMeter from "@/components/GraduationMeter";
import { 
  User, Wallet, Shield, LogOut, Moon, Sun, 
  LayoutDashboard, ChevronRight, MessageSquare 
} from "lucide-react";

const ProfilePage = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();

  const isDeveloper = userProfile?.role === "developer";

  const handleProfileSectionClick = (path: string, sectionName: string) => {
    toast.info(`Navigating to "${sectionName}"...`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      
      {/* HEADER */}
      <h1 className="text-4xl font-black italic tracking-tighter mb-6 text-center text-foreground">
        MY <span className="text-secondary-neon">ZONE</span>
      </h1>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* --- 1. PROGRESS (UNTOUCHED) --- */}
        <GraduationMeter />

        {/* --- 2. ESSENTIALS GRID --- */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-card hover:bg-secondary/5 border-border hover:border-secondary-neon/50 cursor-pointer transition-all active:scale-95" 
            onClick={() => handleProfileSectionClick("/profile/details", "User Profile")}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 gap-2">
              <div className="p-3 bg-secondary-neon/10 rounded-full">
                <User className="h-6 w-6 text-secondary-neon" />
              </div>
              <span className="font-bold text-sm">Identity</span>
            </CardContent>
          </Card>

          <Card 
            className="bg-card hover:bg-secondary/5 border-border hover:border-secondary-neon/50 cursor-pointer transition-all active:scale-95" 
            onClick={() => handleProfileSectionClick("/profile/wallet", "Wallet & Payments")}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32 gap-2">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <span className="font-bold text-sm">Wallet</span>
            </CardContent>
          </Card>
        </div>

        {/* --- 3. SUPPORT --- */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Support</h3>
          <DeveloperChatbox />
        </div>

        {/* --- 4. SETTINGS & UTILS --- */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Settings</h3>
          <Card className="bg-card border-border overflow-hidden">
            <div className="divide-y divide-border/50">
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-5 w-5 text-purple-400" /> : <Sun className="h-5 w-5 text-orange-400" />}
                  <Label htmlFor="dark-mode" className="font-medium cursor-pointer">Dark Mode</Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  className="data-[state=checked]:bg-secondary-neon"
                />
              </div>

              {/* Policies */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/5 transition-colors"
                onClick={() => handleProfileSectionClick("/profile/policies", "Policies")}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-sm">App Policies</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Developer Dashboard (Conditional) */}
              {isDeveloper && (
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/5 transition-colors"
                  onClick={() => navigate("/developer-dashboard")}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-sm text-red-500">Developer Dashboard</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-500/50" />
                </div>
              )}

            </div>
          </Card>
        </div>

        {/* --- 5. LOGOUT --- */}
        <Button
          variant="outline"
          onClick={logout}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive font-bold"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ProfilePage;