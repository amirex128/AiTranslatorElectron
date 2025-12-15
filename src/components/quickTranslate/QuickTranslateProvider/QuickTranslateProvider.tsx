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
  const [translationDirection, setTranslationDirection] = useState<'en-to-fa' | 'fa-to-en'>('en-to-fa');

  // Detect if text is Persian or English
  const detectLanguage = (text: string): 'en-to-fa' | 'fa-to-en' => {
    // Simple detection: if text contains Persian characters (Arabic script), it's Persian
    // Persian Unicode range: \u0600-\u06FF
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianRegex.test(text) ? 'fa-to-en' : 'en-to-fa';
  };

  const selection = useTextSelection(enabled, (newSelection) => {
    if (newSelection) {
      // Only update if text actually changed (to avoid resetting when clicking TTS button)
      if (newSelection.text !== selectedText) {
      setSelectedText(newSelection.text);
      setPosition(newSelection.position);
      setShowBox(true);
      setTranslation(null);
      // Detect and set translation direction
      const direction = detectLanguage(newSelection.text);
      setTranslationDirection(direction);
      }
    } else {
      // Only close box if selection is actually cleared (not just a click on the box)
      // Check if selection is really empty, not just a click event
      const currentSelection = window.getSelection()?.toString().trim() || '';
      if (!currentSelection || currentSelection.length === 0) {
        setShowBox(false);
        setSelectedText(null);
        setTranslation(null);
      }
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
        // Use the detected direction
        // quickTranslateTranslate now returns string directly (unwrapped from IPCResponse)
        const translation = await window.electronAPI.quickTranslateTranslate(selectedText, translationDirection);
        
        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (translation && translation.trim()) {
          setTranslation(translation);
        } else {
          console.error('[QuickTranslate] Translation is empty');
          setTranslation(null);
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
          direction={translationDirection}
        />
      )}
    </>
  );
};

