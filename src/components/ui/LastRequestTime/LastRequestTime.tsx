import React, { useEffect, useState } from 'react';

interface LastRequestTimeProps {
  elapsedTime: number | null;
}

export const LastRequestTime: React.FC<LastRequestTimeProps> = ({ elapsedTime }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (elapsedTime !== null && elapsedTime > 0) {
      setIsVisible(true);
      
      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [elapsedTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (elapsedTime === null || elapsedTime === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-900 border-t border-gray-700 px-4 py-2 z-40 transition-opacity duration-300 opacity-100">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-300 dark:text-gray-400">
        <span>زمان آخرین درخواست:</span>
        <span className="font-medium text-indigo-400 dark:text-indigo-300">
          {formatTime(elapsedTime)}
        </span>
      </div>
    </div>
  );
};

