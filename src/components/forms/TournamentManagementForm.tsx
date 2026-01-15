import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { databases, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; // Make sure to add COLLECTION_ID for REGISTRATIONS
import { Loader2, Save, Trash2, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { Tournament } from "@/hooks/useTournamentData";
import { Query } from "appwrite";

// You need to ensure you have a 'registrations' collection in Appwrite
const APPWRITE_REGISTRATIONS_COLLECTION_ID = "registrations"; 

interface TournamentManagementFormProps {
  tournament: Tournament;
  onClose: () => void;
}

interface Registration {
  $id: string;
  teamName: string;
  contactEmail: string;
  players: string[]; // Stored as array of strings or JSON string in DB
}

const TournamentManagementForm = ({ tournament, onClose }: TournamentManagementFormProps) => {
  const [activeTab, setActiveTab] = useState("teams");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  
  // Standings State (Simplified for brevity - assume existing logic usually goes here)
  const [standings, setStandings] = useState(tournament.standings || []);

  // Fetch Registrations when tab changes to teams
  useEffect(() => {
    if (activeTab === "teams") {
      fetchRegistrations();
    }
  }, [activeTab]);

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
        // Query registrations where tournamentId matches
        const res = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_REGISTRATIONS_COLLECTION_ID,
            [Query.equal("tournamentId", tournament.$id)]
        );
        // Map data safely
        const regs = res.documents.map((doc: any) => ({
            $id: doc.$id,
            teamName: doc.teamName,
            contactEmail: doc.contactEmail,
            players: doc.players // Appwrite stores arrays
        }));
        setRegistrations(regs);
    } catch (error) {
        console.error("Failed to fetch teams", error);
        toast.error("Could not load registered teams");
    } finally {
        setLoadingRegs(false);
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied!");
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="teams" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams">Registered Teams</TabsTrigger>
          <TabsTrigger value="standings">Manage Standings</TabsTrigger>
        </TabsList>

        {/* --- VIEW REGISTERED TEAMS TAB --- */}
        <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center mt-4">
                <h3 className="text-lg font-medium">Total Teams: {registrations.length}</h3>
                <Button variant="outline" size="sm" onClick={fetchRegistrations}>Refresh</Button>
            </div>

            <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Captain Email</TableHead>
                            <TableHead>Players</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingRegs ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2"/>
                                    Loading data...
                                </TableCell>
                            </TableRow>
                        ) : registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No teams registered yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => (
                                <TableRow key={reg.$id}>
                                    <TableCell className="font-medium">{reg.teamName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {reg.contactEmail}
                                            <Copy className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => copyEmail(reg.contactEmail)} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1">
                                            {/* Assuming players is an array of strings like "Name (ID)" or Objects */}
                                            {Array.isArray(reg.players) && reg.players.map((p: any, i: number) => (
                                                <div key={i} className="bg-muted/50 px-1 rounded">
                                                    {/* Handle if player is object or string */}
                                                    {typeof p === 'string' ? p : `${p.name} (${p.inGameId})`}
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>

        {/* --- MANAGE STANDINGS TAB --- */}
        <TabsContent value="standings">
            <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                    Update the points table. This will be visible to all users.
                </p>
                {/* Add your existing logic here for adding/editing standings rows.
                    Since I don't have your specific implementation for this part, 
                    I'm leaving a placeholder structure.
                */}
                <div className="p-10 border border-dashed rounded-md text-center">
                    <p>Standings Management Interface</p>
                    <p className="text-xs text-muted-foreground">(Insert your existing standings table logic here)</p>
                </div>
                
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button className="bg-secondary-neon text-primary-foreground">Save Changes</Button>
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentManagementForm;