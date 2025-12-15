import React, { useState, useEffect } from 'react';
import { Select } from '../Select/Select';

interface ShortcutBuilderProps {
  value: string;
  onChange: (shortcut: string) => void;
  label: string;
}

// Modifier keys options
const modifierOptions = [
  { value: '', label: 'هیچکدام' },
  { value: 'Alt', label: 'Alt' },
  { value: 'Ctrl', label: 'Ctrl' },
  { value: 'Shift', label: 'Shift' },
  { value: 'Cmd', label: 'Cmd (Mac)' },
  { value: 'Meta', label: 'Meta' },
];

// Main keys (keyboard + mouse)
const mainKeyOptions = [
  { value: '', label: 'کلید را انتخاب کنید' },
  // Letters
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'H', label: 'H' },
  { value: 'I', label: 'I' },
  { value: 'J', label: 'J' },
  { value: 'K', label: 'K' },
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'N', label: 'N' },
  { value: 'O', label: 'O' },
  { value: 'P', label: 'P' },
  { value: 'Q', label: 'Q' },
  { value: 'R', label: 'R' },
  { value: 'S', label: 'S' },
  { value: 'T', label: 'T' },
  { value: 'U', label: 'U' },
  { value: 'V', label: 'V' },
  { value: 'W', label: 'W' },
  { value: 'X', label: 'X' },
  { value: 'Y', label: 'Y' },
  { value: 'Z', label: 'Z' },
  // Numbers
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  // Function keys
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
  { value: 'F6', label: 'F6' },
  { value: 'F7', label: 'F7' },
  { value: 'F8', label: 'F8' },
  { value: 'F9', label: 'F9' },
  { value: 'F10', label: 'F10' },
  { value: 'F11', label: 'F11' },
  { value: 'F12', label: 'F12' },
  // Special keys
  { value: 'Space', label: 'Space' },
  { value: 'Enter', label: 'Enter' },
  { value: 'Tab', label: 'Tab' },
  { value: 'Backspace', label: 'Backspace' },
  { value: 'Delete', label: 'Delete' },
  { value: 'Escape', label: 'Escape (Esc)' },
  { value: 'Insert', label: 'Insert' },
  { value: 'Home', label: 'Home' },
  { value: 'End', label: 'End' },
  { value: 'PageUp', label: 'Page Up' },
  { value: 'PageDown', label: 'Page Down' },
  { value: 'ArrowUp', label: 'Arrow Up (↑)' },
  { value: 'ArrowDown', label: 'Arrow Down (↓)' },
  { value: 'ArrowLeft', label: 'Arrow Left (←)' },
  { value: 'ArrowRight', label: 'Arrow Right (→)' },
  // Mouse buttons
  { value: 'LeftClick', label: 'Mouse Left Click' },
  { value: 'RightClick', label: 'Mouse Right Click' },
  { value: 'MiddleClick', label: 'Mouse Middle Click' },
  { value: 'Mouse4', label: 'Mouse Button 4' },
  { value: 'Mouse5', label: 'Mouse Button 5' },
];

// Parse existing shortcut string to extract modifiers and main key
const parseShortcut = (shortcut: string): {
  modifier1: string;
  modifier2: string;
  modifier3: string;
  modifier4: string;
  mainKey: string;
} => {
  if (!shortcut || shortcut.trim() === '') {
    return { modifier1: '', modifier2: '', modifier3: '', modifier4: '', mainKey: '' };
  }

  const parts = shortcut.split('+').map(s => s.trim());
  const modifiers: string[] = [];
  let mainKey = '';

  // Normalize modifier names (case-insensitive)
  const normalizeModifier = (part: string): string => {
    const lower = part.toLowerCase();
    if (lower === 'alt') return 'Alt';
    if (lower === 'ctrl' || lower === 'control') return 'Ctrl';
    if (lower === 'shift') return 'Shift';
    if (lower === 'cmd' || lower === 'command') return 'Cmd';
    if (lower === 'meta') return 'Meta';
    return '';
  };

  for (const part of parts) {
    const normalizedModifier = normalizeModifier(part);
    if (normalizedModifier) {
      modifiers.push(normalizedModifier);
    } else {
      // This is the main key
      // Try to find exact match first (case-sensitive)
      const exactMatch = mainKeyOptions.find(opt => opt.value === part);
      if (exactMatch) {
        mainKey = exactMatch.value;
      } else {
        // Try case-insensitive match
        const caseInsensitiveMatch = mainKeyOptions.find(
          opt => opt.value.toLowerCase() === part.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          mainKey = caseInsensitiveMatch.value;
        } else {
          // For special keys like PageUp, PageDown, etc., try to normalize
          const normalizedKey = part.charAt(0).toUpperCase() + part.slice(1);
          const normalizedMatch = mainKeyOptions.find(opt => opt.value === normalizedKey);
          if (normalizedMatch) {
            mainKey = normalizedMatch.value;
          } else {
            // Fallback: use as-is
            mainKey = part;
          }
        }
      }
    }
  }

  return {
    modifier1: modifiers[0] || '',
    modifier2: modifiers[1] || '',
    modifier3: modifiers[2] || '',
    modifier4: modifiers[3] || '',
    mainKey: mainKey || '',
  };
};

// Build shortcut string from modifiers and main key
const buildShortcut = (
  modifier1: string,
  modifier2: string,
  modifier3: string,
  modifier4: string,
  mainKey: string
): string => {
  const modifiers = [modifier1, modifier2, modifier3, modifier4].filter(m => m !== '');
  
  if (!mainKey) {
    return '';
  }

  if (modifiers.length === 0) {
    return mainKey;
  }

  return [...modifiers, mainKey].join('+');
};

export const ShortcutBuilder: React.FC<ShortcutBuilderProps> = ({
  value,
  onChange,
  label,
}) => {
  const parsed = parseShortcut(value);
  const [modifier1, setModifier1] = useState(parsed.modifier1);
  const [modifier2, setModifier2] = useState(parsed.modifier2);
  const [modifier3, setModifier3] = useState(parsed.modifier3);
  const [modifier4, setModifier4] = useState(parsed.modifier4);
  const [mainKey, setMainKey] = useState(parsed.mainKey);

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = parseShortcut(value);
    setModifier1(parsed.modifier1);
    setModifier2(parsed.modifier2);
    setModifier3(parsed.modifier3);
    setModifier4(parsed.modifier4);
    setMainKey(parsed.mainKey);
  }, [value]);

  // Build and emit shortcut when any part changes
  useEffect(() => {
    const newShortcut = buildShortcut(modifier1, modifier2, modifier3, modifier4, mainKey);
    if (newShortcut !== value) {
      onChange(newShortcut);
    }
  }, [modifier1, modifier2, modifier3, modifier4, mainKey]);

  const currentShortcut = buildShortcut(modifier1, modifier2, modifier3, modifier4, mainKey);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-white dark:text-gray-200">
        {label}
      </label>

      <div className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Modifier 1 */}
          <div>
            <label className="block text-xs text-white/70 dark:text-gray-300 mb-1.5">
              Modifier 1
            </label>
            <Select
              options={modifierOptions}
              value={modifier1}
              onChange={(e) => setModifier1(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Modifier 2 */}
          <div>
            <label className="block text-xs text-white/70 dark:text-gray-300 mb-1.5">
              Modifier 2
            </label>
            <Select
              options={modifierOptions}
              value={modifier2}
              onChange={(e) => setModifier2(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Modifier 3 */}
          <div>
            <label className="block text-xs text-white/70 dark:text-gray-300 mb-1.5">
              Modifier 3
            </label>
            <Select
              options={modifierOptions}
              value={modifier3}
              onChange={(e) => setModifier3(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Modifier 4 */}
          <div>
            <label className="block text-xs text-white/70 dark:text-gray-300 mb-1.5">
              Modifier 4
            </label>
            <Select
              options={modifierOptions}
              value={modifier4}
              onChange={(e) => setModifier4(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Main Key */}
          <div>
            <label className="block text-xs text-white/70 dark:text-gray-300 mb-1.5">
              کلید اصلی
            </label>
            <Select
              options={mainKeyOptions}
              value={mainKey}
              onChange={(e) => setMainKey(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {currentShortcut && (
        <div className="mt-3 p-3 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30">
          <p className="text-xs text-white/80 dark:text-gray-300 mb-1.5">پیش‌نمایش:</p>
          <p className="text-sm font-mono text-white dark:text-gray-100 dir-ltr text-left bg-white/10 dark:bg-gray-900/20 px-3 py-2 rounded-lg">
            {currentShortcut}
          </p>
        </div>
      )}

      {!mainKey && (
        <p className="text-xs text-white/70 dark:text-gray-400">
          لطفاً یک کلید اصلی انتخاب کنید
        </p>
      )}
    </div>
  );
};

