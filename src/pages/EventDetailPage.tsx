"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const EventDetailPage = () => {
  const { id } = useParams();
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Event Details for {id}</h1>
      <p className="text-lg">This page shows details for a specific event.</p>
    </div>
  );
};

export default EventDetailPage;