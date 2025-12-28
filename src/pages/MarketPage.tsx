"use client";

import React from 'react';
import Header from '../components/Header';

const MarketPage = () => {
  return (
    <div className="container mx-auto p-4 pb-20">
      <Header />
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Exchange (Market)</h1>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Masonry Grid layout for product cards */}
        <div className="masonry-grid">
          {/* Product cards */}
          <div className="product-card">
            <img src="/used-engineering-books.jpg" alt="Used Engineering Books" />
            <div className="price-tag">
              <span className="text-bright-yellow">$10</span>
            </div>
          </div>
          <div className="product-card">
            <img src="/wireless-earbuds.jpg" alt="Wireless Earbuds" />
            <div className="price-tag">
              <span className="text-bright-yellow">$20</span>
            </div>
          </div>
          <div className="product-card">
            <img src="/drafter.jpg" alt="Drafter" />
            <div className="price-tag">
              <span className="text-bright-yellow">$30</span>
            </div>
          </div>
          <div className="product-card">
            <img src="/scientific-calculator.jpg" alt="Scientific Calculator" />
            <div className="price-tag">
              <span className="text-bright-yellow">$40</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating "SELL" button */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center mb-4">
        <button className="sell-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-matte-black"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MarketPage;