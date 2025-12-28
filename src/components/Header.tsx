"use client";

import React from 'react';

const Header = () => {
  return (
    <div className="sticky top-0 z-10 bg-cream-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Campus Market</h1>
        <div className="pill-shaped-sticker">
          <input
            type="search"
            placeholder="Search"
            className="w-full pl-4 pr-10 py-2 text-sm text-foreground border-none rounded-full focus:ring-0"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-lime-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;