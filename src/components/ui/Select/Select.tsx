import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  key?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white dark:text-gray-200 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2 bg-white/20 dark:bg-gray-800/50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-purple-400 text-white dark:text-gray-200 font-medium ${
          error
            ? 'ring-2 ring-red-500 focus:ring-red-500'
            : ''
        } ${className}`}
        {...props}
      >
        {options.map((option, index) => (
          <option key={option.key || option.value || index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

