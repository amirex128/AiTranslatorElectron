import React from 'react';
import { Button } from '../../ui/Button/Button';

type Page = 'home' | 'settings';

interface MenuBarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ currentPage, onPageChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <nav className="flex gap-4">
          <Button
            variant={currentPage === 'home' ? 'primary' : 'ghost'}
            onClick={() => onPageChange('home')}
            className="px-4"
          >
            صفحه اصلی
          </Button>
          <Button
            variant={currentPage === 'settings' ? 'primary' : 'ghost'}
            onClick={() => onPageChange('settings')}
            className="px-4"
          >
            تنظیمات
          </Button>
        </nav>
      </div>
    </div>
  );
};

