import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { TitleBar } from './components/ui/TitleBar/TitleBar';
import { QuickTranslateProvider } from './components/quickTranslate/QuickTranslateProvider/QuickTranslateProvider';
import { ApiKeySetupModal } from './components/ui/ApiKeySetupModal/ApiKeySetupModal';
import { useSettingsStore } from './stores/settingsStore';
// Import the icon - webpack will handle it
import iconPath from './assets/images.png';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'main' | 'settings' | 'about' | 'bookmarks'>('main');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { settings, loadSettings, checkApiKeyValid } = useSettingsStore();

  // Always enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check API key validity when settings are loaded
  useEffect(() => {
    if (settings) {
      const isValid = checkApiKeyValid();
      setShowApiKeyModal(!isValid);
    }
  }, [settings, checkApiKeyValid]);

  // Listen for settings and about page open events
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onSettingsOpenPage(() => {
        setCurrentPage('settings');
      });

      window.electronAPI.onAboutOpenPage(() => {
        setCurrentPage('about');
      });

      // Listen for add-bookmark shortcut
      window.electronAPI.onShortcut((shortcut: { type: string; text: string }) => {
        if (shortcut.type === 'add-bookmark') {
          // Add bookmark from clipboard text
          if (shortcut.text && shortcut.text.trim()) {
            // Check if text is English (basic check)
            const isEnglish = /^[a-zA-Z0-9\s.,!?'"-]+$/.test(shortcut.text.trim());
            if (isEnglish) {
              // Import bookmark store and add bookmark
              import('./stores/bookmarkStore').then(({ useBookmarkStore }) => {
                const store = useBookmarkStore.getState();
                store.addBookmark(shortcut.text.trim()).then((bookmark) => {
                  if (bookmark) {
                    console.log('[App] Bookmark added from shortcut:', bookmark);
                    // Optionally show a notification or navigate to bookmarks page
                    setCurrentPage('bookmarks');
                  }
                });
              });
            } else {
              console.log('[App] Text is not English, skipping bookmark');
            }
          }
        }
      });

      // Listen for data imported event to reload stores
      window.electronAPI.onDataImported(() => {
        console.log('[App] Data imported, reloading stores...');
        // Reload bookmark store
        import('./stores/bookmarkStore').then(({ useBookmarkStore }) => {
          const bookmarkStore = useBookmarkStore.getState();
          bookmarkStore.loadBookmarks(bookmarkStore.filters);
        });
        // Reload history store
        import('./stores/historyStore').then(({ useHistoryStore }) => {
          const historyStore = useHistoryStore.getState();
          historyStore.loadEntries();
        });
      });
    }
  }, []);

  const handleApiKeySaved = async () => {
    // Reload settings to get the updated API key
    await loadSettings();
    
    // Wait a bit to ensure settings are fully updated in the store
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check again if API key is valid
    const isValid = checkApiKeyValid();
    if (isValid) {
      setShowApiKeyModal(false);
    } else {
      // If still not valid, try reloading one more time
      console.log('[App] API key still not valid after reload, trying again...');
      await loadSettings();
      await new Promise(resolve => setTimeout(resolve, 300));
      const isValidAfterReload = checkApiKeyValid();
      if (isValidAfterReload) {
        setShowApiKeyModal(false);
      } else {
        console.error('[App] API key validation failed even after reload');
      }
    }
  };

  // Don't show main content if API key modal is open
  const shouldShowContent = !showApiKeyModal;

  return (
    <QuickTranslateProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {shouldShowContent && (
          <TitleBar 
            title="مترجم هوش مصنوعی" 
            iconPath={iconPath}
            onOpenBookmarks={() => setCurrentPage('bookmarks')}
            onGoToMain={() => setCurrentPage('main')}
          />
        )}
        {shouldShowContent ? (
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
            {currentPage === 'bookmarks' && (
              <BookmarksPage onBack={() => setCurrentPage('main')} />
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <ApiKeySetupModal
          isOpen={showApiKeyModal}
          onApiKeySaved={handleApiKeySaved}
        />
      </div>
    </QuickTranslateProvider>
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
