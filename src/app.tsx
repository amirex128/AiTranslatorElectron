import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import { MenuBar } from './components/layout/MenuBar/MenuBar';

const App: React.FC = () => {
  // Always enable dark mode
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <MenuBar />
      <MainPage />
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
