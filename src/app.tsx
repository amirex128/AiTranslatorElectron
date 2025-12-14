import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { TitleBar } from './components/ui/TitleBar/TitleBar';
// Import the icon - webpack will handle it
import iconPath from './assets/images.png';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'main' | 'settings' | 'about'>('main');

  // Always enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Listen for settings and about page open events
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onSettingsOpenPage(() => {
        setCurrentPage('settings');
      });

      window.electronAPI.onAboutOpenPage(() => {
        setCurrentPage('about');
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar title="AI Translator" iconPath={iconPath} />
      <div className="flex-1 overflow-y-auto">
        {currentPage === 'main' && (
          <MainPage onOpenSettings={() => setCurrentPage('settings')} />
        )}
        {currentPage === 'settings' && (
          <SettingsPage onBack={() => setCurrentPage('main')} />
        )}
        {currentPage === 'about' && (
          <AboutPage onBack={() => setCurrentPage('main')} />
        )}
      </div>
    </div>
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
