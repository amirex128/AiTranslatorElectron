import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-white dark:text-gray-200 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-500 text-gray-900 dark:text-white transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
          error
            ? 'ring-2 ring-red-500 focus:ring-red-500'
            : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

