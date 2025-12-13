import React, { useRef, useEffect, useState } from 'react';
import { Textarea } from '../../ui/Textarea/Textarea';
import { FullscreenEditor } from '../../ui/FullscreenEditor/FullscreenEditor';
import { UndoRedoManager } from '../../../utils/undoRedo';

interface TranslationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export const TranslationInput: React.FC<TranslationInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const undoRedoManager = useRef(new UndoRedoManager<string>());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value) {
      undoRedoManager.current.push(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      const previousState = undoRedoManager.current.undo();
      if (previousState !== null) {
        onChange(previousState);
      }
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'y' || (e.key === 'z' && e.shiftKey))
    ) {
      e.preventDefault();
      const nextState = undoRedoManager.current.redo();
      if (nextState !== null) {
        onChange(nextState);
      }
    }
  };

  return (
    <>
      <div className="relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            label={label}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={6}
            className={className}
          />
          {/* Fullscreen Button - Bottom Left */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-2 left-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 z-10 group"
            aria-label="تمام صفحه"
            title="تمام صفحه"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
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
          </button>
        </div>
      </div>

      {/* Fullscreen Editor Modal */}
      <FullscreenEditor
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder}
      />
    </>
  );
};

