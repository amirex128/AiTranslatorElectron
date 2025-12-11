import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  className = '',
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div
            key={item.id}
            className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

