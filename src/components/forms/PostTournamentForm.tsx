"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // Ensure toast is imported
import { useTournamentData } from '@/hooks/useTournamentData';

interface PostTournamentFormProps {
  onTournamentPosted: () => void;
  onCancel: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onTournamentPosted, onCancel }) => {
  const { user, userPreferences } = useAuth();
  const { postTournament } = useTournamentData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [platform, setPlatform] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userPreferences?.collegeName) {
      toast.error("Please log in and set your college name to post a tournament.");
      return;
    }
    if (!title || !game || !platform || !date || !time || !prizePool || !entryFee || !maxParticipants) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postTournament({
        title,
        game,
        platform,
        date: date.toISOString(),
        time,
        prizePool,
        entryFee,
        maxParticipants: parseInt(maxParticipants),
        description: description || undefined,
      });
      onTournamentPosted();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Tournament Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="game">Game</Label>
        <Input id="game" value={game} onChange={(e) => setGame(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select value={platform} onValueChange={setPlatform} required>
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PC">PC</SelectItem>
            <SelectItem value="PlayStation">PlayStation</SelectItem>
            <SelectItem value="Xbox">Xbox</SelectItem>
            <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
            <SelectItem value="Mobile">Mobile</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="prizePool">Prize Pool</Label>
        <Input id="prizePool" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} placeholder="e.g., ₹5000, Gift Cards" required />
      </div>
      <div>
        <Label htmlFor="entryFee">Entry Fee</Label>
        <Input id="entryFee" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="e.g., ₹50, Free" required />
      </div>
      <div>
        <Label htmlFor="maxParticipants">Max Participants</Label>
        <Input id="maxParticipants" type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min="2" required />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Tournament'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PostTournamentForm;