import React, { useState, useEffect } from 'react';
import { TranslationResult as TranslationResultType } from '../../../utils/validation';
import { Accordion } from '../../ui/Accordion/Accordion';
import { Button } from '../../ui/Button/Button';
import { Textarea } from '../../ui/Textarea/Textarea';
import { ttsService } from '../../../services/tts/TTSService';
import { useTTSStore } from '../../../stores/ttsStore';

interface TranslationResultProps {
  result: TranslationResultType;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onCopy: (text: string) => void;
  fontSize?: number;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  result,
  selectedIndex,
  onSelect,
  onCopy,
  fontSize = 16,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTexts, setEditedTexts] = useState<
    Record<string, { english: string; persian: string }>
  >({});
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  const { isPlaying, progress, setIsPlaying, setProgress } = useTTSStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playingIndex !== null) {
        const currentProgress = ttsService.getProgress();
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          setIsPlaying(false);
          setPlayingIndex(null);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playingIndex, setProgress, setIsPlaying]);

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

  const handlePlay = async (index: number) => {
    // اگر همین نتیجه در حال پخش است، آن را متوقف کن
    if (playingIndex === index && isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setPlayingIndex(null);
      return;
    }

    const englishText = getResultText(index, 'english');
    if (!englishText) return;

    try {
      setPlayingIndex(index);
      setIsPlaying(true);
      setProgress(0);
      await ttsService.speak(englishText, 1.0);
      setIsPlaying(false);
      setProgress(100);
      setPlayingIndex(null);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setPlayingIndex(null);
    }
  };

  const handleCancel = () => {
    ttsService.stop();
    setIsPlaying(false);
    setPlayingIndex(null);
  };

  const items = [1, 2, 3].map((index) => {
    const englishText = getResultText(index, 'english');
    const persianText = getResultText(index, 'persian');
    const isSelected = selectedIndex === index;
    const isEditing = editingIndex === index;

    return {
      id: `result-${index}`,
      title: `ترجمه ${index}`,
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
                    {playingIndex === index && isPlaying ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleCancel}
                        isLoading={true}
                      >
                        لغو
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePlay(index)}
                        disabled={playingIndex !== null && playingIndex !== index}
                      >
                        پخش صدا
                      </Button>
                    )}
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
                dir="ltr"
              />
            ) : (
              <div
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                style={{ fontSize: `${fontSize}px` }}
                dir="ltr"
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
                dir="rtl"
              />
            ) : (
              <div
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                style={{
                  fontSize: `${fontSize}px`,
                }}
                dir="rtl"
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

