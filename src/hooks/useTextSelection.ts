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

  const handleSelection = useCallback((e?: Event) => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    // Ignore if click is on QuickTranslateBox or its children
    if (e && e.target) {
      // Check if target is an HTMLElement (has closest method)
      // In selectionchange event, target might be a Node, not HTMLElement
      if (e.target instanceof HTMLElement) {
        const target = e.target;
        // Check if click is inside QuickTranslateBox (has specific class or is inside a fixed positioned element)
        const quickTranslateBox = target.closest('[class*="fixed"][class*="z-50"]');
        if (quickTranslateBox) {
          // Don't process selection if clicking inside QuickTranslateBox
          return;
        }
      } else if (e.target instanceof Node) {
        // If target is a Node (like TextNode), check its parent element
        const parentElement = e.target.parentElement;
        if (parentElement) {
          const quickTranslateBox = parentElement.closest('[class*="fixed"][class*="z-50"]');
          if (quickTranslateBox) {
            // Don't process selection if clicking inside QuickTranslateBox
            return;
          }
        }
      }
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

