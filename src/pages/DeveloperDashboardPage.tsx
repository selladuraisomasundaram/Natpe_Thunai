"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Flag, Ban, DollarSign, Users, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID, APPWRITE_PROJECT_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query, ID } from "appwrite";
import { useDeveloperMessages, DeveloperMessage } from "@/hooks/useDeveloperMessages";
import { useReports, Report } from "@/hooks/useReports"; // Updated import
import { useBlockedWords } from "@/hooks/useBlockedWords";
import { useTotalTransactions, Transaction } from "@/hooks/useTotalTransactions";
import { useTotalUsers } from "@/hooks/useTotalUsers";
import { useFoodOrdersAnalytics } from "@/hooks/useFoodOrdersAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ChangeUserRoleForm from "@/components/forms/ChangeUserRoleForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DeveloperDashboardPage = () => {
  const { user, userProfile } = useAuth();
  const [collegeNameForAnalytics, setCollegeNameForAnalytics] = useState(userProfile?.collegeName || "");
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);

  const { messages, isLoading: isMessagesLoading, error: messagesError, refetch: refetchMessages } = useDeveloperMessages();
  const { reports, isLoading: isReportsLoading, error: reportsError, refetch: refetchReports, updateReportStatus } = useReports(); // Updated destructuring
  const { blockedWords, isLoading: isBlockedWordsLoading, error: blockedWordsError, addBlockedWord, removeBlockedWord } = useBlockedWords();
  const { totalTransactions, totalValue, isLoading: isTransactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTotalTransactions(collegeNameForAnalytics);
  const { totalUsers, isLoading: isUsersLoading, error: usersError, refetch: refetchUsers } = useTotalUsers(collegeNameForAnalytics);
  const { totalOrders, pendingOrders, completedOrders, totalRevenue, isLoading: isFoodOrdersLoading, error: foodOrdersError, refetch: refetchFoodOrders } = useFoodOrdersAnalytics(collegeNameForAnalytics);

  useEffect(() => {
    if (userProfile?.collegeName) {
      setCollegeNameForAnalytics(userProfile.collegeName);
    }
  }, [userProfile?.collegeName]);

  const handleAddBlockedWord = async () => {
    if (newBlockedWord.trim() === "") {
      toast.error("Blocked word cannot be empty.");
      return;
    }
    const success = await addBlockedWord(newBlockedWord.trim(), "Manual addition by developer", user?.$id);
    if (success) {
      toast.success(`'${newBlockedWord}' added to blocked words.`);
      setNewBlockedWord("");
    } else {
      toast.error("Failed to add blocked word.");
    }
  };

  const handleRemoveBlockedWord = async (wordId: string, word: string) => {
    const success = await removeBlockedWord(wordId);
    if (success) {
      toast.success(`'${word}' removed from blocked words.`);
    } else {
      toast.error("Failed to remove blocked word.");
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: Report['status']) => {
    const success = await updateReportStatus(reportId, status);
    if (success) {
      toast.success(`Report status updated to ${status}.`);
    } else {
      toast.error("Failed to update report status.");
    }
  };

  const handleRoleChanged = () => {
    setIsChangeRoleDialogOpen(false);
    toast.success("User role updated successfully!");
    // Potentially refetch user profiles or trigger a global state update if needed
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "initiated":
      case "pending": // Corrected literal
        return "bg-yellow-500 text-white";
      case "payment_confirmed_to_developer":
      case "reviewed": // Corrected literal
        return "bg-blue-500 text-white";
      case "commission_deducted":
        return "bg-indigo-500 text-white";
      case "paid_to_seller":
      case "resolved": // Corrected literal
        return "bg-green-500 text-white";
      case "failed":
      case "dismissed": // Corrected literal
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (!user || userProfile?.role !== 'developer') {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <p className="text-center text-destructive text-lg">Access Denied: You must be a developer to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Developer Dashboard</h1>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Analytics Overview */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-background">
              <Users className="h-8 w-8 text-primary-neon mb-2" />
              <p className="text-lg font-semibold">Total Users</p>
              {isUsersLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <p className="text-2xl font-bold">{totalUsers}</p>}
            </div>
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-background">
              <DollarSign className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-lg font-semibold">Total Transactions Value</p>
              {isTransactionsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>}
            </div>
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-background">
              <Utensils className="h-8 w-8 text-orange-500 mb-2" />
              <p className="text-lg font-semibold">Total Food Orders</p>
              {isFoodOrdersLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <p className="text-2xl font-bold">{totalOrders}</p>}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card text-card-foreground">
            <TabsTrigger value="messages" className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center justify-center gap-2">
              <Flag className="h-4 w-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="blocked-words" className="flex items-center justify-center gap-2">
              <Ban className="h-4 w-4" /> Blocked Words
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" /> User Management
            </TabsTrigger>
          </TabsList>

          {/* Developer Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">User Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {isMessagesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                    <p className="ml-3 text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messagesError ? (
                  <p className="text-center text-destructive py-4">Error loading messages: {messagesError}</p>
                ) : messages.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.map((msg) => (
                      <div key={msg.$id} className={cn(
                        "p-3 rounded-md border",
                        msg.isDeveloper ? "bg-primary/10 border-primary" : "bg-background border-border" // Corrected property
                      )}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-foreground">{msg.senderName} ({msg.collegeName || 'N/A'})</span> {/* Corrected property */}
                          <span className="text-muted-foreground">{new Date(msg.$createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No messages from users.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">User Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {isReportsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                    <p className="ml-3 text-muted-foreground">Loading reports...</p>
                  </div>
                ) : reportsError ? (
                  <p className="text-center text-destructive py-4">Error loading reports: {reportsError}</p>
                ) : reports.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Title</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Seller ID</TableHead>
                          <TableHead>College</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.$id}>
                            <TableCell className="font-medium text-foreground">{report.productTitle || "N/A"}</TableCell> {/* Corrected property */}
                            <TableCell className="text-muted-foreground">{report.reporterName || "N/A"}</TableCell> {/* Corrected property */}
                            <TableCell className="text-muted-foreground">{report.sellerId || "N/A"}</TableCell> {/* Corrected property */}
                            <TableCell className="text-muted-foreground">{report.collegeName || "N/A"}</TableCell> {/* Corrected property */}
                            <TableCell className="text-muted-foreground">{report.reason}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">{report.message || "N/A"}</TableCell> {/* Corrected property */}
                            <TableCell>
                              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusClass(report.status))}>
                                {report.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right space-y-1 min-w-[150px]">
                              {report.status === "pending" && ( // Corrected literal
                                <>
                                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleUpdateReportStatus(report.$id, "reviewed")}>
                                    Mark Reviewed
                                  </Button>
                                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleUpdateReportStatus(report.$id, "dismissed")}>
                                    Dismiss
                                  </Button>
                                </>
                              )}
                              {(report.status === "reviewed" || report.status === "dismissed") && ( // Corrected literals
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => handleUpdateReportStatus(report.$id, "resolved")}>
                                  Mark Resolved
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No user reports.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blocked Words Tab */}
          <TabsContent value="blocked-words" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">Blocked Words</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add new blocked word"
                    value={newBlockedWord}
                    onChange={(e) => setNewBlockedWord(e.target.value)}
                  />
                  <Button onClick={handleAddBlockedWord}>Add Word</Button>
                </div>
                {isBlockedWordsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                    <p className="ml-3 text-muted-foreground">Loading blocked words...</p>
                  </div>
                ) : blockedWordsError ? (
                  <p className="text-center text-destructive py-4">Error loading blocked words: {blockedWordsError}</p>
                ) : blockedWords.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                    {blockedWords.map((word) => (
                      <div key={word.$id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <span className="font-medium text-foreground">{word.word}</span>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveBlockedWord(word.$id, word.word)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No blocked words configured.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="user-management" className="mt-4">
            <Card className="bg-card text-card-foreground shadow-lg border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">User Management</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Change User Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Change User Role</DialogTitle>
                    </DialogHeader>
                    <ChangeUserRoleForm onRoleChanged={handleRoleChanged} onCancel={() => setIsChangeRoleDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                <p className="text-sm text-muted-foreground">
                  Additional user management features (e.g., verification, banning) can be added here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default DeveloperDashboardPage;