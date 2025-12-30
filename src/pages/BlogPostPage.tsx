"use client";

import React from 'react';
import { useParams } from 'react-router-dom';

const BlogPostPage = () => {
  const { id } = useParams();
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Blog Post {id}</h1>
      <p className="text-lg">This is a specific blog post.</p>
    </div>
  );
};

export default BlogPostPage;