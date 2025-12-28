"use client";

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;