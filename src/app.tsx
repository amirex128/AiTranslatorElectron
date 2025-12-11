import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MainPage />
  </React.StrictMode>
);
