"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Building2, Image, RotateCw, User, Mail, Phone, CreditCard, Calendar, Lock, Upload } from "lucide-react";
import { APP_HOST_URL } from "@/lib/config";
import { largeIndianColleges } from "@/lib/largeIndianColleges";
import CollegeCombobox from "@/components/CollegeCombobox";
import { generateAvatarUrl, DICEBEAR_AVATAR_STYLES } from "@/utils/avatarGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportMissingCollegeForm from "@/components/forms/ReportMissingCollegeForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Helper function to generate a random username
const generateRandomUsername = (): string => {
  const adjectives = ["swift", "brave", "silent", "golden", "shadow", "mystic", "cosmic", "iron", "ruby", "emerald", "Hidden", "Veiled", "Phantom", "Ghost", "Arcane", "Cryptic", "Shrouded", "Astral"];
  const nouns = ["wolf", "eagle", "phoenix", "dragon", "tiger", "badger", "viper", "golem", "knight", "wizard", "Lynx", "Panther", "Falcon", "Shark", "Cobra", "Grizzly", "Leopard", "Raptor"];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

// Helper function to generate multiple unique username options
const generateUsernameOptions = (count: number = 3): string[] => {
  const options = new Set<string>();
  while (options.size < count) {
    options.add(generateRandomUsername());
  }
  return Array.from(options);
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [collegeIdPhoto, setCollegeIdPhoto] = useState<File | null>(null);
  
  // Registration Flow States
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [initialUsernames, setInitialUsernames] = useState<string[]>([]); // To store the very first batch
  const [refreshCount, setRefreshCount] = useState(0); // Track refreshes
  const [selectedUsername, setSelectedUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">("prefer-not-to-say");
  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [collegeName, setCollegeName] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("lorelei");
  
  const [studyYear, setStudyYear] = useState("1");
  const [isReportMissingCollegeDialogOpen, setIsReportMissingCollegeDialogOpen] = useState(false);

  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle redirection for authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Generate usernames for registration
  useEffect(() => {
    if (!isLogin && generatedUsernames.length === 0) {
      const initial = generateUsernameOptions();
      setGeneratedUsernames(initial);
      setInitialUsernames(initial);
    }
  }, [isLogin]);

  // --- LOGIC: Refresh Usernames with Limit ---
  const handleRefreshUsernames = () => {
    if (refreshCount < 5) {
      // Generate new names
      setGeneratedUsernames(generateUsernameOptions());
      setRefreshCount(prev => prev + 1);
      toast.info(`Suggestions refreshed (${refreshCount + 1}/5)`);
    } else {
      // Reset to initial batch
      setGeneratedUsernames(initialUsernames);
      setRefreshCount(0);
      toast.info("Back to original suggestions.");
    }
    setSelectedUsername(""); // Clear selection on refresh
  };

  const handleCollegeIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const MAX_FILE_SIZE_MB = 1;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; 

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB. Please compress your image.`);
        setCollegeIdPhoto(null);
        e.target.value = '';
        return;
      }
    }
    setCollegeIdPhoto(file);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        await account.createEmailPasswordSession(email, password);
        await login(); 
        toast.success("Logged in successfully!");
      } else {
        // --- REGISTRATION FLOW ---
        
        // 1. Validations
        if (!termsAccepted) { toast.error("You must accept the terms and conditions."); setLoading(false); return; }
        if (!selectedUsername) { toast.error("Please select a username."); setLoading(false); return; }
        if (!collegeIdPhoto) { toast.error("Please upload your college ID card photo."); setLoading(false); return; }
        if (!collegeName) { toast.error("Please select your college."); setLoading(false); return; }
        if (!avatarStyle) { toast.error("Please select an avatar style."); setLoading(false); return; }

        // 2. Create Auth Account
        const user = await account.create("unique()", email, password, selectedUsername);
        
        // 3. Upload ID Photo
        let collegeIdPhotoFileId = null;
        if (collegeIdPhoto) {
          try {
            const uploadedFile = await storage.createFile(
              APPWRITE_COLLEGE_ID_BUCKET_ID,
              ID.unique(),
              collegeIdPhoto
            );
            collegeIdPhotoFileId = uploadedFile.$id;
            toast.info("College ID photo uploaded.");
          } catch (uploadError: any) {
            console.error("Error uploading college ID photo:", uploadError);
            toast.error("Failed to upload college ID photo.");
            setLoading(false);
            return; 
          }
        }

        // 4. --- LOGIC: Calculate Graduation Date ---
        const calculateGradDate = () => {
          const date = new Date();
          // Logic: 1st Year = +4 yrs, 2nd Year = +3 yrs, 3rd Year = +2 yrs, Others = +1 yr
          const yearsToAdd = studyYear === '1' ? 4 : studyYear === '2' ? 3 : studyYear === '3' ? 2 : 1;
          date.setFullYear(date.getFullYear() + yearsToAdd);
          return date.toISOString();
        };

        // 5. Create Database Profile
        try {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_PROFILES_COLLECTION_ID,
            ID.unique(),
            {
              userId: user.$id,
              firstName,
              lastName,
              age: parseInt(age),
              mobileNumber,
              upiId,
              collegeIdPhotoId: collegeIdPhotoFileId,
              role: "user",
              gender,
              userType,
              collegeName,
              graduationDate: calculateGradDate(), 
              level: 1,
              currentXp: 0,
              maxXp: 100,
              ambassadorDeliveriesCount: 0,
              lastQuestCompletedDate: null,
              itemsListedToday: 0,
              avatarStyle: avatarStyle,
            }
          );
          toast.success("User profile saved.");
        } catch (profileError: any) {
          console.error("Error creating user profile document:", profileError);
          toast.error(`Failed to create user profile: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        await account.createVerification(`${APP_HOST_URL}/verify-email`);
        toast.info("Verification email sent!");

        // 6. Auto-Login after Signup
        await account.createEmailPasswordSession(email, password);
        await login(); 
        toast.success("You are now logged in!");
        
        // Reset Form
        setFirstName("");
        setLastName("");
        setAge("");
        setMobileNumber("");
        setUpiId("");
        setCollegeIdPhoto(null);
        setGeneratedUsernames([]);
        setSelectedUsername("");
        setTermsAccepted(false);
        setGender("prefer-not-to-say");
        setUserType("student");
        setCollegeName("");
        setAvatarStyle("lorelei");
        setStudyYear("1"); 
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-lg bg-card text-foreground shadow-2xl rounded-xl border-border/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-extrabold text-foreground tracking-tight">
            {isLogin ? "Welcome Back!" : "Join the Community"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            {isLogin ? "Log in to connect and thrive." : "Sign up and unlock campus potential."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-6">
                
                {/* SECTION 1: PERSONAL INFO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-secondary-neon uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-foreground/90">First Name</Label>
                      <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1.5 bg-input/50" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-foreground/90">Last Name</Label>
                      <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1.5 bg-input/50" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age" className="text-foreground/90">Age</Label>
                      <Input id="age" type="number" placeholder="18" value={age} onChange={(e) => setAge(e.target.value)} required min="16" className="mt-1.5 bg-input/50" />
                    </div>
                    <div>
                      <Label className="block text-foreground/90 mb-2">Gender</Label>
                      <RadioGroup value={gender} onValueChange={(value: any) => setGender(value)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="m" />
                          <Label htmlFor="m">M</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="f" />
                          <Label htmlFor="f">F</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* SECTION 2: CONTACT & PAYMENT */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-secondary-neon uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contact & Pay
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobileNumber" className="text-foreground/90">Mobile Number</Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="mobileNumber" type="tel" placeholder="9876543210" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required className="pl-9 bg-input/50" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="upiId" className="text-foreground/90">UPI ID</Label>
                      <div className="relative mt-1.5">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="upiId" type="text" placeholder="user@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} required className="pl-9 bg-input/50" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* SECTION 3: ACADEMIC INFO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-secondary-neon uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Academic Info
                  </h3>
                  
                  <div>
                    <Label className="block text-foreground/90 mb-2">Role</Label>
                    <RadioGroup value={userType} onValueChange={(value: any) => setUserType(value)} className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="role-s" />
                        <Label htmlFor="role-s" className="cursor-pointer">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staff" id="role-st" />
                        <Label htmlFor="role-st" className="cursor-pointer">Staff</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="collegeName" className="text-foreground/90">Your College</Label>
                    <div className="mt-1.5">
                      <CollegeCombobox collegeList={largeIndianColleges} value={collegeName} onValueChange={setCollegeName} placeholder="Select your college" disabled={loading} />
                    </div>
                    <Dialog open={isReportMissingCollegeDialogOpen} onOpenChange={setIsReportMissingCollegeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-secondary-neon mt-1.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Cannot find my college?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Report Missing College</DialogTitle>
                        </DialogHeader>
                        <ReportMissingCollegeForm onReportSubmitted={() => setIsReportMissingCollegeDialogOpen(false)} onCancel={() => setIsReportMissingCollegeDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    <Label htmlFor="year" className="text-foreground/90">Current Year</Label>
                    <div className="relative mt-1.5">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={studyYear} onValueChange={setStudyYear} disabled={loading}>
                        <SelectTrigger className="w-full pl-9 bg-input/50">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">I - First Year</SelectItem>
                          <SelectItem value="2">II - Second Year</SelectItem>
                          <SelectItem value="3">III - Third Year</SelectItem>
                          <SelectItem value="4">IV - Fourth Year</SelectItem>
                          <SelectItem value="5">V - Fifth Year</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="collegeIdPhoto" className="text-foreground/90">College ID Photo</Label>
                    <div className="mt-1.5 relative group">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="collegeIdPhoto" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-input rounded-lg cursor-pointer bg-input/20 hover:bg-input/40 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Click to upload</span> (Max 1MB)</p>
                                </div>
                                <Input id="collegeIdPhoto" type="file" accept="image/*" onChange={handleCollegeIdPhotoChange} required className="hidden" />
                            </label>
                        </div>
                    </div>
                    {collegeIdPhoto && <p className="text-xs text-secondary-neon mt-1 font-medium truncate">Selected: {collegeIdPhoto.name}</p>}
                    <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-secondary-neon flex items-center gap-1 mt-1 justify-end">
                      <Image className="h-3 w-3" /> Compress Image
                    </a>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* SECTION 4: ACCOUNT SETUP */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-secondary-neon uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Account Identity
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-foreground/90">Public Username</Label>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleRefreshUsernames}
                            className="h-6 text-xs text-secondary-neon hover:bg-secondary-neon/10 gap-1 px-2"
                        >
                            <RotateCw className={`h-3 w-3 ${refreshCount > 0 ? 'animate-spin-once' : ''}`} /> 
                            {refreshCount === 5 ? "Reset" : "Refresh"}
                        </Button>
                    </div>
                    <RadioGroup value={selectedUsername} onValueChange={setSelectedUsername} className="grid grid-cols-1 gap-2">
                      {generatedUsernames.map((username) => (
                        <div key={username} className={`flex items-center space-x-2 p-2 rounded-md border transition-all ${selectedUsername === username ? 'border-secondary-neon bg-secondary-neon/10' : 'border-input hover:bg-accent'}`}>
                          <RadioGroupItem value={username} id={username} className="border-border text-secondary-neon" />
                          <Label htmlFor={username} className="text-foreground cursor-pointer flex-1 font-mono text-sm">{username}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="avatarStyle" className="text-foreground/90">Avatar Style</Label>
                    <Select value={avatarStyle} onValueChange={setAvatarStyle} required disabled={loading}>
                      <SelectTrigger className="w-full mt-1.5 bg-input/50">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {DICEBEAR_AVATAR_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                    <p className="text-xs text-destructive text-center font-medium leading-relaxed">
                        Note: Your Name, Age, Mobile, and College ID are collected for verification safety only. 
                        Only your <span className="font-bold underline">Username</span> and <span className="font-bold underline">Avatar</span> will be public.
                    </p>
                </div>

                <div className="flex items-center space-x-2 bg-secondary/10 p-3 rounded-md">
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                    I agree to the <Link to="/profile/policies" className="text-secondary-neon hover:underline font-medium">Terms & Conditions</Link> and Privacy Policy.
                  </Label>
                </div>
              </div>
            )}

            {/* LOGIN / EMAIL FIELDS (Always Visible) */}
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="email" className="text-foreground/90">Email Address</Label>
                <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9 bg-input/50" />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground/90">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9 pr-10 bg-input/50" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-medium text-secondary-neon hover:underline">
                  Forgot Password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold shadow-lg hover:bg-primary/90 h-11" disabled={loading}>
              {loading ? (
                  <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processing...</span>
              ) : (
                  isLogin ? "Log In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{isLogin ? "New to Natpe Thunai? " : "Already have an account? "}</span>
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-0 h-auto font-bold text-secondary-neon hover:text-secondary-neon/80" disabled={loading}>
              {isLogin ? "Sign Up Now" : "Log In"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;