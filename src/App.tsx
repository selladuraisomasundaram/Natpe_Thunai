import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Ensure BrowserRouter is NOT imported here
import Index from './pages/Index'; // Assuming you have an Index page
import About from './pages/About'; // Assuming you have an About page
import Contact from './pages/Contact'; // Assuming you have a Contact page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      {/* Add more routes here as needed */}
    </Routes>
  );
}

export default App;