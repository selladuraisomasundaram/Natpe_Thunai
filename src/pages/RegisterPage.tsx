"use client";

import React from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Register</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Join the Campus Connect community.
      </p>
      {/* Add your registration form here */}
      <MadeWithDyad />
    </div>
  );
};

export default RegisterPage;