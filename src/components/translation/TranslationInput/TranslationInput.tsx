import React, { useRef, useEffect } from 'react';
import { Textarea } from '../../ui/Textarea/Textarea';
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
  );
};

