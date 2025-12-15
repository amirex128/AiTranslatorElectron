import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: number | string;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveId,
  className = '',
  onTabChange,
}) => {
  const [activeId, setActiveId] = useState<string>(
    defaultActiveId || items[0]?.id || ''
  );

  const handleTabClick = (tabId: string) => {
    setActiveId(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const activeTab = items.find((item) => item.id === activeId);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                relative px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out
                flex items-center gap-2 rounded-t-lg
                ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b-2 border-indigo-500 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {item.icon && (
                <span className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 text-xs font-semibold rounded-full
                    ${
                      isActive
                        ? 'bg-indigo-500 dark:bg-indigo-400 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab && (
          <div className="transition-all duration-300 ease-in-out">
            {activeTab.content}
          </div>
        )}
      </div>
    </div>
  );
};

