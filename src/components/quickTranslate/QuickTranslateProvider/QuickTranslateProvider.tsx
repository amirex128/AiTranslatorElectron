import React, { useState, useEffect, useRef } from 'react';
import { useTextSelection } from '../../../hooks/useTextSelection';
import { QuickTranslateBox } from '../QuickTranslateBox/QuickTranslateBox';
import { useSettingsStore } from '../../../stores/settingsStore';

interface QuickTranslateProviderProps {
  children: React.ReactNode;
}

export const QuickTranslateProvider: React.FC<QuickTranslateProviderProps> = ({ children }) => {
  const { settings } = useSettingsStore();
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showBox, setShowBox] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const enabled = settings?.quickTranslateEnabled ?? true;
  const timeout = settings?.quickTranslateTimeout ?? 5;

  const selection = useTextSelection(enabled, (newSelection) => {
    if (newSelection) {
      setSelectedText(newSelection.text);
      setPosition(newSelection.position);
      setShowBox(true);
      setTranslation(null);
    } else {
      setShowBox(false);
      setSelectedText(null);
      setTranslation(null);
    }
  });

  // Translate selected text
  useEffect(() => {
    if (!selectedText || !showBox || !enabled) {
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const translate = async () => {
      if (!window.electronAPI) {
        console.error('[QuickTranslate] electronAPI not available');
        return;
      }

      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await window.electronAPI.quickTranslateTranslate(selectedText);
        
        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response && 'success' in response) {
          if (response.success && 'data' in response) {
            setTranslation(response.data);
          } else if ('error' in response) {
            console.error('[QuickTranslate] Translation error:', response.error);
            setTranslation(null);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, ignore
          return;
        }
        console.error('[QuickTranslate] Error translating:', error);
        setTranslation(null);
      } finally {
        setIsLoading(false);
      }
    };

    translate();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedText, showBox, enabled]);

  const handleClose = () => {
    setShowBox(false);
    setSelectedText(null);
    setTranslation(null);
    
    // Clear selection
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {showBox && selectedText && (
        <QuickTranslateBox
          text={selectedText}
          translation={translation}
          isLoading={isLoading}
          position={position}
          onClose={handleClose}
          timeout={timeout}
        />
      )}
    </>
  );
};

