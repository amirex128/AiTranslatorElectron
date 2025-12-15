import React, { useState, useEffect } from 'react';
import { TranslationResult as TranslationResultType } from '../../../utils/validation';
import { Tabs, TabItem } from '../../ui/Tabs/Tabs';
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

  // Find all available results
  const availableResults = [1, 2, 3].filter((index) => {
    const englishText = getResultText(index, 'english');
    const persianText = getResultText(index, 'persian');
    return englishText || persianText;
  });

  // If only one result exists, display it directly without tabs
  if (availableResults.length === 1) {
    const index = availableResults[0];
    const englishText = getResultText(index, 'english');
    const persianText = getResultText(index, 'persian');
    const isEditing = editingIndex === index;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              انگلیسی:
            </label>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSaveEdit(index, 'english')}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    ذخیره
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingIndex(null)}
                    className="rounded-full"
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
                    className="rounded-full"
                  >
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCopy(index, 'english')}
                    className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                  >
                    کپی
                  </Button>
                  {playingIndex === index && isPlaying ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleCancel}
                      isLoading={true}
                      className="rounded-full"
                    >
                      لغو
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePlay(index)}
                      disabled={playingIndex !== null && playingIndex !== index}
                      className="rounded-full"
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
              className="p-4 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-100"
              style={{ fontSize: `${fontSize}px` }}
              dir="ltr"
            >
              {englishText}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              فارسی:
            </label>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSaveEdit(index, 'persian')}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    ذخیره
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingIndex(null)}
                    className="rounded-full"
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
                    className="rounded-full"
                  >
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCopy(index, 'persian')}
                    className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
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
              className="p-4 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-100"
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
    );
  }

  // If multiple results exist, show them in tabs (starting from the first available result)
  const tabItems: TabItem[] = availableResults.map((index) => {
      const englishText = getResultText(index, 'english');
      const persianText = getResultText(index, 'persian');
      const isSelected = selectedIndex === index;
      const isEditing = editingIndex === index;

      return {
        id: `result-${index}`,
        label: `ترجمه ${index}`,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        ),
        content: (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-white dark:text-gray-200">
                  انگلیسی:
                </label>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveEdit(index, 'english')}
                        className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        ذخیره
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingIndex(null)}
                        className="rounded-full"
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
                        className="rounded-full"
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCopy(index, 'english')}
                        className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                      >
                        کپی
                      </Button>
                      {playingIndex === index && isPlaying ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={handleCancel}
                          isLoading={true}
                          className="rounded-full"
                        >
                          لغو
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlay(index)}
                          disabled={playingIndex !== null && playingIndex !== index}
                          className="rounded-full"
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
                  className="p-4 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-100"
                  style={{ fontSize: `${fontSize}px` }}
                  dir="ltr"
                >
                  {englishText}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-white dark:text-gray-200">
                  فارسی:
                </label>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveEdit(index, 'persian')}
                        className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        ذخیره
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingIndex(null)}
                        className="rounded-full"
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
                        className="rounded-full"
                      >
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCopy(index, 'persian')}
                        className="rounded-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
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
                  className="p-4 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-100"
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

  // Set default active tab to first translation or selected index
  const defaultActiveId = selectedIndex ? `result-${selectedIndex}` : (tabItems.length > 0 ? tabItems[0].id : '');

  return tabItems.length > 0 ? <Tabs items={tabItems} defaultActiveId={defaultActiveId} /> : null;
};

