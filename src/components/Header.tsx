"use client";

import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">My App</Link>
        <ul className="flex space-x-4">
          <li><Link to="/about" className="hover:text-gray-300">About</Link></li>
          <li><Link to="/contact" className="hover:text-gray-300">Contact</Link></li>
          <li><Link to="/events" className="hover:text-gray-300">Events</Link></li>
          <li><Link to="/blog" className="hover:text-gray-300">Blog</Link></li>
          <li><Link to="/the-edit" className="hover:text-gray-300">The Edit</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;