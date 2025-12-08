"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Trophy, Users, Award } from "lucide-react";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TournamentManagementFormProps {
  tournament: Tournament;
  onClose: () => void;
}

const TournamentManagementForm: React.FC<TournamentManagementFormProps> = ({ tournament, onClose }) => {
  const { updateTournament } = useTournamentData();
  const [currentStandings, setCurrentStandings] = useState<TeamStanding[]>(tournament.standings || []);
  const [currentWinners, setCurrentWinners] = useState<Winner[]>(tournament.winners || []);
  const [isUpdating, setIsUpdating] = useState(false);

  // State for new standing entry
  const [newStandingRank, setNewStandingRank] = useState("");
  const [newStandingTeamName, setNewStandingTeamName] = useState("");
  const [newStandingStatus, setNewStandingStatus] = useState<TeamStanding['status']>("Participating");
  const [newStandingPoints, setNewStandingPoints] = useState("");

  // State for new winner entry
  const [newWinnerTeamName, setNewWinnerTeamName] = useState("");
  const [newWinnerPrize, setNewWinnerPrize] = useState("");

  useEffect(() => {
    setCurrentStandings(tournament.standings || []);
    setCurrentWinners(tournament.winners || []);
  }, [tournament]);

  // --- Standings Management ---
  const handleAddStanding = () => {
    if (!newStandingRank || !newStandingTeamName || !newStandingPoints) {
      toast.error("Please fill all fields for new standing.");
      return;
    }
    const newRank = parseInt(newStandingRank);
    const newPoints = parseInt(newStandingPoints);
    if (isNaN(newRank) || newRank <= 0 || isNaN(newPoints) || newPoints < 0) {
      toast.error("Rank and Points must be valid numbers.");
      return;
    }
    setCurrentStandings(prev => [...prev, {
      rank: newRank,
      teamName: newStandingTeamName,
      status: newStandingStatus,
      points: newPoints,
    }].sort((a, b) => a.rank - b.rank)); // Sort by rank
    setNewStandingRank("");
    setNewStandingTeamName("");
    setNewStandingStatus("Participating");
    setNewStandingPoints("");
  };

  const handleRemoveStanding = (rankToRemove: number) => {
    setCurrentStandings(prev => prev.filter(s => s.rank !== rankToRemove));
  };

  const handleUpdateStandings = async () => {
    setIsUpdating(true);
    try {
      await updateTournament(tournament.$id, { standings: currentStandings });
      toast.success("Tournament standings updated!");
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Winners Management ---
  const handleAddWinner = () => {
    if (!newWinnerTeamName || !newWinnerPrize) {
      toast.error("Please fill all fields for new winner.");
      return;
    }
    setCurrentWinners(prev => [...prev, {
      tournament: tournament.name, // Auto-fill tournament name
      winner: newWinnerTeamName,
      prize: newWinnerPrize,
    }]);
    setNewWinnerTeamName("");
    setNewWinnerPrize("");
  };

  const handleRemoveWinner = (indexToRemove: number) => {
    setCurrentWinners(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAnnounceWinners = async () => {
    setIsUpdating(true);
    try {
      await updateTournament(tournament.$id, { winners: currentWinners });
      toast.success("Tournament winners announced!");
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-2xl font-bold text-foreground text-center">{tournament.name} Management</h2>

      {/* Standings Section */}
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary-neon" /> Manage Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="max-h-60 overflow-y-auto border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-foreground">Rank</TableHead>
                  <TableHead className="text-foreground">Team</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-right text-foreground">Points</TableHead>
                  <TableHead className="text-right text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStandings.length > 0 ? (
                  currentStandings.map((team) => (
                    <TableRow key={team.rank}>
                      <TableCell className="font-medium text-foreground">{team.rank}</TableCell>
                      <TableCell className="text-foreground">{team.teamName}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs font-semibold",
                            team.status === "1st" && "bg-secondary-neon text-primary-foreground",
                            team.status === "2nd" && "bg-blue-500 text-white",
                            team.status === "Eliminated" && "bg-destructive text-destructive-foreground",
                            team.status === "Participating" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {team.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">{team.points}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="icon" onClick={() => handleRemoveStanding(team.rank)} disabled={isUpdating}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No standings yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newStandingRank" className="text-foreground">Rank</Label>
              <Input type="number" id="newStandingRank" value={newStandingRank} onChange={(e) => setNewStandingRank(e.target.value)} placeholder="e.g., 1" disabled={isUpdating} />
            </div>
            <div>
              <Label htmlFor="newStandingTeamName" className="text-foreground">Team Name</Label>
              <Input type="text" id="newStandingTeamName" value={newStandingTeamName} onChange={(e) => setNewStandingTeamName(e.target.value)} placeholder="e.g., Team Alpha" disabled={isUpdating} />
            </div>
            <div>
              <Label htmlFor="newStandingStatus" className="text-foreground">Status</Label>
              <Select value={newStandingStatus} onValueChange={(value: TeamStanding['status']) => setNewStandingStatus(value)} disabled={isUpdating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st</SelectItem>
                  <SelectItem value="2nd">2nd</SelectItem>
                  <SelectItem value="Eliminated">Eliminated</SelectItem>
                  <SelectItem value="Participating">Participating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newStandingPoints" className="text-foreground">Points</Label>
              <Input type="number" id="newStandingPoints" value={newStandingPoints} onChange={(e) => setNewStandingPoints(e.target.value)} placeholder="e.g., 1500" disabled={isUpdating} />
            </div>
          </div>
          <Button onClick={handleAddStanding} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isUpdating}>
            <Plus className="mr-2 h-4 w-4" /> Add Standing
          </Button>
          <Button onClick={handleUpdateStandings} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Standings"}
          </Button>
        </CardContent>
      </Card>

      {/* Winners Section */}
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-secondary-neon" /> Announce Winners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="max-h-40 overflow-y-auto border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Winner Team</TableHead>
                  <TableHead className="text-foreground">Prize</TableHead>
                  <TableHead className="text-right text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentWinners.length > 0 ? (
                  currentWinners.map((winner, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-foreground">{winner.winner}</TableCell>
                      <TableCell className="text-foreground">{winner.prize}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="icon" onClick={() => handleRemoveWinner(index)} disabled={isUpdating}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No winners announced yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newWinnerTeamName" className="text-foreground">Winner Team Name</Label>
              <Input type="text" id="newWinnerTeamName" value={newWinnerTeamName} onChange={(e) => setNewWinnerTeamName(e.target.value)} placeholder="e.g., Team Delta" disabled={isUpdating} />
            </div>
            <div>
              <Label htmlFor="newWinnerPrize" className="text-foreground">Prize</Label>
              <Input type="text" id="newWinnerPrize" value={newWinnerPrize} onChange={(e) => setNewWinnerPrize(e.target.value)} placeholder="e.g., ₹2000, Trophy" disabled={isUpdating} />
            </div>
          </div>
          <Button onClick={handleAddWinner} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isUpdating}>
            <Plus className="mr-2 h-4 w-4" /> Add Winner
          </Button>
          <Button onClick={handleAnnounceWinners} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Announce Winners"}
          </Button>
        </CardContent>
      </Card>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="border-border text-primary-foreground hover:bg-muted" disabled={isUpdating}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
};

export default TournamentManagementForm;