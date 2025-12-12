import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import { SettingsPage } from './pages/SettingsPage';
import { MenuBar } from './components/layout/MenuBar/MenuBar';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'main' | 'settings'>('main');

  // Always enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Listen for settings page open event
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onSettingsOpenPage(() => {
        setCurrentPage('settings');
      });

      window.electronAPI.onSettingsChange(() => {
        // Reload settings when they change
        // This will be handled by individual components that use settingsStore
      });
    }
  }, []);

  return (
    <>
      <MenuBar />
      {currentPage === 'main' ? (
        <MainPage onOpenSettings={() => setCurrentPage('settings')} />
      ) : (
        <SettingsPage onBack={() => setCurrentPage('main')} />
      )}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
