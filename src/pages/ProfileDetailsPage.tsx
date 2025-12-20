"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, GraduationCap, Mail, MapPin, Phone, User as UserIcon, Star } from "lucide-react";
import { generateAvatarUrl } from "@/lib/utils"; // Assuming this utility exists
import { useUserSellerRating } from "@/hooks/useUserSellerRating"; // NEW: Import hook
import { GraduationInfo, calculateGraduationInfo } from "@/lib/graduation"; // NEW: Import graduation logic
import EditProfileForm from "@/components/forms/EditProfileForm"; // Assuming this component exists

const ProfileDetailsPage = () => {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // NEW: Fetch seller rating for the current user
  const { averageRating: sellerRating, totalReviews, isLoading: isRatingLoading, error: ratingError } = useUserSellerRating(user?.$id);

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const publicUsername = user?.name || "CampusExplorer";
  const userEmail = user?.email || "N/A";
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;

  const avatarUrl = generateAvatarUrl(
    publicUsername,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei" // NEW: Pass avatarStyle
  );

  const handleProfileUpdate = async (data: Partial<typeof userProfile>) => {
    if (userProfile) {
      await updateUserProfile(data); // Corrected call: pass only the updates object
      setIsEditDialogOpen(false);
    }
  };

  const renderMotivationalMessage = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null; // Only for students, not developers
    }

    const userCreationDate = user?.$createdAt;
    if (!userCreationDate) return null;

    const graduationInfo: GraduationInfo = calculateGraduationInfo(userCreationDate);
    const targetLevel = 25;
    const levelsToGo = targetLevel - userProfile.level;
    const daysRemaining = graduationInfo.countdown.days;

    if (userProfile.level >= targetLevel) {
      return (
        <p className="text-sm text-green-600 font-medium">
          Congratulations! You've reached level {targetLevel} and are ready for graduation!
        </p>
      );
    }

    if (levelsToGo > 0 && daysRemaining > 0) {
      return (
        <p className="text-sm text-muted-foreground">
          You need <span className="font-semibold text-secondary-neon">{levelsToGo} more levels</span> to reach level{" "}
          {targetLevel} before graduation in{" "}
          <span className="font-semibold text-secondary-neon">{daysRemaining} days</span>!
        </p>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-4xl mx-auto bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-2 border-secondary-neon">
              <AvatarImage src={avatarUrl} alt={publicUsername} />
              <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                {publicUsername.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-4 sm:mt-0">
              <CardTitle className="text-3xl font-bold text-foreground">{publicUsername}</CardTitle>
              <p className="text-lg text-muted-foreground capitalize">{userProfile.role}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge className="bg-blue-500 text-white flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> Level {userLevel}
                </Badge>
                {userProfile.isAmbassador && (
                  <Badge className="bg-purple-500 text-white flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> Ambassador
                  </Badge>
                )}
                {userProfile.isDeveloper && (
                  <Badge className="bg-red-500 text-white flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> Developer
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <EditProfileForm
                initialData={{
                  firstName: userProfile.firstName,
                  lastName: userProfile.lastName,
                  age: userProfile.age,
                  mobileNumber: userProfile.mobileNumber,
                  upiId: userProfile.upiId,
                  gender: userProfile.gender,
                  userType: userProfile.userType,
                  collegeName: userProfile.collegeName,
                  avatarStyle: userProfile.avatarStyle, // NEW: Pass avatarStyle
                }}
                onSubmit={handleProfileUpdate}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Public Details */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">Public Details</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary-neon" /> Email:{" "}
                <span className="font-semibold text-foreground">{userEmail}</span>
              </p>
              {user?.emailVerification && (
                <Badge className="mt-1 bg-blue-500 text-white flex items-center gap-1 w-fit mx-auto sm:mx-0">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary-neon" /> College:{" "}
                <span className="font-semibold text-foreground">{userProfile.collegeName || "N/A"}</span>
              </p>
              {userProfile.role === "student" && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-secondary-neon" /> XP:{" "}
                  <span className="font-semibold text-foreground">
                    {currentXp} / {maxXp} ({xpPercentage.toFixed(0)}%)
                  </span>
                </p>
              )}
              {sellerRating > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Seller Rating:{" "}
                  <span className="font-semibold text-foreground">
                    {sellerRating.toFixed(1)} ({totalReviews} reviews)
                  </span>
                </p>
              )}
              {renderMotivationalMessage()}
            </div>

            {/* Private Details (Visible to Developers) */}
            {userProfile.isDeveloper && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground">Private Details (Visible to Developers)</h4>
                <p className="text-sm text-muted-foreground">
                  First Name: <span className="font-semibold text-foreground">{userProfile.firstName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Last Name: <span className="font-semibold text-foreground">{userProfile.lastName}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Age: <span className="font-semibold text-foreground">{userProfile.age}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Mobile: <span className="font-semibold text-foreground">{userProfile.mobileNumber || "N/A"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  UPI ID: <span className="font-semibold text-foreground">{userProfile.upiId || "N/A"}</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-secondary-neon" /> Gender:{" "}
                  <span className="font-semibold text-foreground capitalize">
                    {userProfile.gender.replace(/-/g, " ")}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-secondary-neon" /> Type:{" "}
                  <span className="font-semibold text-foreground capitalize">{userProfile.userType}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDetailsPage;