import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import { SettingsPage } from './pages/SettingsPage';
import { MenuBar } from './components/layout/MenuBar/MenuBar';

type Page = 'home' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Always enable dark mode
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <MenuBar currentPage={currentPage} onPageChange={setCurrentPage} />
      {currentPage === 'home' && <MainPage />}
      {currentPage === 'settings' && <SettingsPage />}
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
