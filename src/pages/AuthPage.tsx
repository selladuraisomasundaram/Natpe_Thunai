import React, { useState } from 'react';

const AuthPage = () => {
  const [studyYear, setStudyYear] = useState("1");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... existing validation ...

    const calculateGradDate = () => {
      const date = new Date();
      const yearsToAdd = studyYear === '1' ? 4 : studyYear === '2' ? 3 : studyYear === '3' ? 2 : 1;
      date.setFullYear(date.getFullYear() + yearsToAdd);
      return date.toISOString();
    };

    try {
      // Assuming register function is defined elsewhere
      // await register(email, password, name, collegeName, calculateGradDate());
      console.log('Registration successful');
    } catch (error) {
      // ... error handling
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="year">Current Year of Study</label>
      <select
        id="year"
        value={studyYear}
        onChange={(e) => setStudyYear(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="1">I - First Year</option>
        <option value="2">II - Second Year</option>
        <option value="3">III - Third Year</option>
        <option value="4">IV - Fourth Year</option>
        <option value="5">V - Fifth Year</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};

export default AuthPage;