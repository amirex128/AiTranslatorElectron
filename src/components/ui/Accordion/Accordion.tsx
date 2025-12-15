import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string | React.ReactNode;
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
            className="border-2 border-white/30 dark:border-white/20 rounded-xl overflow-hidden backdrop-blur-md bg-white/10"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white/10 hover:bg-white/20 transition-all duration-300"
            >
              <span className="text-sm font-semibold text-white">
                {item.title}
              </span>
              <svg
                className={`w-5 h-5 text-white transition-transform duration-300 ${
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
              <div className="px-4 py-3 bg-white/5 border-t border-white/20 text-sm">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

