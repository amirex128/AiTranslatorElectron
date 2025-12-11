import React from 'react';
import { Button } from '../Button/Button';

interface ErrorDisplayProps {
  error: string;
  details?: string;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  details,
  showDetails = false,
  onToggleDetails,
}) => {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          {details && onToggleDetails && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetails}
                className="text-red-600 dark:text-red-400"
              >
                {showDetails ? 'مخفی کردن جزئیات' : 'نمایش جزئیات'}
              </Button>
              {showDetails && (
                <pre className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto">
                  {details}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

