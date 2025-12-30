import React from 'react';

const Contact = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-lg">Have questions? Feel free to reach out!</p>
      <p className="mt-2">You can contact us via email at <a href="mailto:info@example.com" className="text-blue-600 hover:underline">info@example.com</a>.</p>
    </div>
  );
};

export default Contact;