import React, { useEffect } from 'react';
import { SettingsPanel } from '../components/settings/SettingsPanel/SettingsPanel';

export const SettingsPage: React.FC = () => {
  useEffect(() => {
    // Always enable dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <SettingsPanel />
      </div>
    </div>
  );
};

