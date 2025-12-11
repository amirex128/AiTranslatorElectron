import React, { useState } from 'react';
import { TranslationResult as TranslationResultType } from '../../../utils/validation';
import { Accordion } from '../../ui/Accordion/Accordion';
import { Button } from '../../ui/Button/Button';
import { Textarea } from '../../ui/Textarea/Textarea';

interface TranslationResultProps {
  result: TranslationResultType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onCopy: (text: string) => void;
  confidenceScore?: number;
  fontSize?: number;
  rtlDirection?: boolean;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  result,
  selectedIndex,
  onSelect,
  onCopy,
  confidenceScore,
  fontSize = 16,
  rtlDirection = false,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTexts, setEditedTexts] = useState<
    Record<string, { english: string; persian: string }>
  >({});

  const handleEdit = (index: number, type: 'english' | 'persian') => {
    setEditingIndex(index);
    const key = `${index}_${type}`;
    if (!editedTexts[key]) {
      const englishKey = `english_${index}` as keyof TranslationResultType;
      const persianKey = `persian_${index}` as keyof TranslationResultType;
      setEditedTexts({
        ...editedTexts,
        [key]: {
          english: result[englishKey] as string,
          persian: result[persianKey] as string,
        },
      });
    }
  };

  const handleSaveEdit = (index: number, type: 'english' | 'persian') => {
    setEditingIndex(null);
  };

  const handleCopy = (index: number, type: 'english' | 'persian') => {
    const key = `${index}_${type}`;
    const text =
      editedTexts[key]?.[type] ||
      (result[`${type}_${index}` as keyof TranslationResultType] as string);
    onCopy(text);
  };

  const getResultText = (index: number, type: 'english' | 'persian') => {
    const key = `${index}_${type}`;
    if (editedTexts[key]) {
      return editedTexts[key][type];
    }
    return result[`${type}_${index}` as keyof TranslationResultType] as string;
  };

  const items = [1, 2, 3].map((index) => {
    const englishText = getResultText(index, 'english');
    const persianText = getResultText(index, 'persian');
    const isSelected = selectedIndex === index;
    const isEditing = editingIndex === index;

    return {
      id: `result-${index}`,
      title: `ترجمه ${index}${confidenceScore ? ` (امتیاز: ${confidenceScore}%)` : ''}`,
      defaultOpen: index === 1,
      content: (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                انگلیسی:
              </label>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveEdit(index, 'english')}
                    >
                      ذخیره
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingIndex(null)}
                    >
                      لغو
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(index, 'english')}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCopy(index, 'english')}
                    >
                      کپی
                    </Button>
                  </>
                )}
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={editedTexts[`${index}_english`]?.english || englishText}
                onChange={(e) =>
                  setEditedTexts({
                    ...editedTexts,
                    [`${index}_english`]: {
                      ...editedTexts[`${index}_english`],
                      english: e.target.value,
                    },
                  })
                }
                rows={3}
              />
            ) : (
              <div
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                style={{ fontSize: `${fontSize}px` }}
              >
                {englishText}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                فارسی:
              </label>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveEdit(index, 'persian')}
                    >
                      ذخیره
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingIndex(null)}
                    >
                      لغو
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(index, 'persian')}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCopy(index, 'persian')}
                    >
                      کپی
                    </Button>
                  </>
                )}
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={editedTexts[`${index}_persian`]?.persian || persianText}
                onChange={(e) =>
                  setEditedTexts({
                    ...editedTexts,
                    [`${index}_persian`]: {
                      ...editedTexts[`${index}_persian`],
                      persian: e.target.value,
                    },
                  })
                }
                rows={3}
                dir={rtlDirection ? 'rtl' : 'ltr'}
              />
            ) : (
              <div
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                style={{
                  fontSize: `${fontSize}px`,
                  direction: rtlDirection ? 'rtl' : 'ltr',
                }}
              >
                {persianText}
              </div>
            )}
          </div>
        </div>
      ),
    };
  });

  return <Accordion items={items} />;
};

