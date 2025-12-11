import React from 'react';
import { Button } from '../Button/Button';

interface LoadingProps {
  progress?: number;
  estimatedTime?: number;
  onCancel?: () => void;
}

export const Loading: React.FC<LoadingProps> = ({
  progress = 0,
  estimatedTime,
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 mb-4">
        <svg
          className="animate-spin h-16 w-16 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        در حال ترجمه...
      </p>
      {progress > 0 && (
        <div className="w-64 mb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {estimatedTime && (
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          زمان تقریبی باقی‌مانده: {estimatedTime} ثانیه
        </p>
      )}
      {onCancel && (
        <Button variant="secondary" size="sm" onClick={onCancel}>
          لغو
        </Button>
      )}
    </div>
  );
};

