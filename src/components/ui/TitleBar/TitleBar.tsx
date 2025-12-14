import React, { useState, useRef, useEffect } from 'react';

interface TitleBarProps {
  title?: string;
  iconPath?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title = 'AI Translator', iconPath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimize();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      try {
        // Toggle maximize/restore
        const isMaximized = await window.electronAPI.isMaximized();
        console.log('Current maximize state:', isMaximized);
        if (isMaximized) {
          console.log('Restoring window...');
          await window.electronAPI.restore();
        } else {
          console.log('Maximizing window...');
          await window.electronAPI.maximize();
        }
      } catch (error) {
        console.error('Error in handleMaximize:', error);
      }
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.close();
    }
  };

  const handleOpenSettings = () => {
    if (window.electronAPI) {
      window.electronAPI.openSettings();
    }
    setIsMenuOpen(false);
  };

  const handleOpenAbout = () => {
    if (window.electronAPI) {
      window.electronAPI.openAbout();
    }
    setIsMenuOpen(false);
  };

  const handleClearCache = async () => {
    if (window.electronAPI) {
      try {
        const response = await window.electronAPI.clearHistoryWithConfirmation();
        if (response.success && response.data?.confirmed) {
          // History cleared, page will be notified via history:cleared event
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
    setIsMenuOpen(false);
  };

  const handleOpenDevTools = async () => {
    if (window.electronAPI) {
      await window.electronAPI.openDevTools();
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="title-bar bg-gray-800 dark:bg-gray-900 h-8 flex items-center justify-between px-2 select-none">
      {/* Left side - Logo and Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0 drag-region">
        {iconPath && (
          <img 
            src={iconPath} 
            alt="Logo" 
            className="w-4 h-4 flex-shrink-0"
          />
        )}
        <span className="text-xs text-gray-300 dark:text-gray-200 truncate">
          {title}
        </span>
      </div>

      {/* Right side - Menu and Window controls */}
      <div className="flex items-center gap-1 no-drag">
        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors rounded-sm group"
            title="Menu"
          >
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-gray-700 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-600 dark:border-gray-700 z-50">
              <div className="py-1">
                <button
                  onClick={handleOpenSettings}
                  className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  تنظیمات
                </button>
                <button
                  onClick={handleOpenAbout}
                  className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  درباره ما
                </button>
                <button
                  onClick={handleClearCache}
                  className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  پاکسازی کش
                </button>
                <div className="border-t border-gray-600 dark:border-gray-700 my-1"></div>
                <button
                  onClick={handleOpenDevTools}
                  className="w-full text-right px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors rounded-sm group"
          title="Minimize"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        {/* Maximize/Restore Button */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors rounded-sm group"
          title="Maximize/Restore"
        >
          {/* Maximize icon (when not maximized) */}
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-gray-200 maximize-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          {/* Restore icon (when maximized) - hidden by default */}
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-gray-200 restore-icon hidden"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3m0 0V9m0 0H8m8 0v8m0 0H8"
            />
          </svg>
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-700 transition-colors rounded-sm group"
          title="Close"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

