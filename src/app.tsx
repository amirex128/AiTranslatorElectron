import React from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.body);
root.render(
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Hello from React!
      </h2>
      <p className="text-gray-60 bg-red-500">
        Tailwind CSS is now configured and ready to use! 🎉
      </p>
    </div>
  </div>
);