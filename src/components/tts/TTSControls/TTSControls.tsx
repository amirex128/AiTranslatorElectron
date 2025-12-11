import React, { useEffect } from 'react';
import { Button } from '../../ui/Button/Button';
import { useTTSStore } from '../../../stores/ttsStore';
import { ttsService } from '../../../services/tts/TTSService';

interface TTSControlsProps {
  text: string;
}

export const TTSControls: React.FC<TTSControlsProps> = ({ text }) => {
  const { isPlaying, progress, speed, setIsPlaying, setProgress, setSpeed } =
    useTTSStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        const currentProgress = ttsService.getProgress();
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          setIsPlaying(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, setProgress, setIsPlaying]);

  const handlePlay = async () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    } else {
      try {
        setIsPlaying(true);
        setProgress(0);
        await ttsService.speak(text, speed);
        setIsPlaying(false);
        setProgress(100);
      } catch (error) {
        console.error('TTS Error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    ttsService.setSpeed(newSpeed);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant={isPlaying ? 'danger' : 'primary'}
          size="sm"
          onClick={handlePlay}
        >
          {isPlaying ? 'توقف' : 'پخش صدا'}
        </Button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            سرعت:
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {speed.toFixed(1)}x
          </span>
        </div>
      </div>
      {isPlaying && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

