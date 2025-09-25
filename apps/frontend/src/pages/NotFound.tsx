// src/pages/NotFound.tsx
import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="text-center text-white py-20">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-400">Sorry, the page you're looking for doesn't exist.</p>
    </div>
  );
};

export default NotFound;
