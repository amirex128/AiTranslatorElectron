import { useState, useEffect, useCallback, useRef } from 'react';

interface TextSelection {
  text: string;
  position: { x: number; y: number };
}

/**
 * Hook to detect English text selection
 * Returns selected text and mouse position when English text is selected
 */
export const useTextSelection = (
  enabled: boolean,
  onSelectionChange?: (selection: TextSelection | null) => void
): TextSelection | null => {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check if text is English (basic regex check)
  const isEnglishText = (text: string): boolean => {
    // Remove whitespace and check if contains English characters
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    
    // Check if text contains English letters (a-z, A-Z)
    const englishPattern = /[a-zA-Z]/;
    return englishPattern.test(trimmed);
  };

  const handleSelection = useCallback(() => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce selection detection
    debounceRef.current = setTimeout(() => {
      const selectedText = window.getSelection()?.toString().trim() || '';
      
      if (selectedText && isEnglishText(selectedText)) {
        // Get mouse position from selection
        const range = window.getSelection()?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const position = {
            x: rect.right,
            y: rect.top,
          };

          const newSelection: TextSelection = {
            text: selectedText,
            position,
          };

          setSelection(newSelection);
          onSelectionChange?.(newSelection);
        }
      } else {
        setSelection(null);
        onSelectionChange?.(null);
      }
    }, 300); // 300ms debounce
  }, [enabled, onSelectionChange]);

  useEffect(() => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    // Listen to mouseup and selectionchange events
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, handleSelection]);

  return selection;
};

