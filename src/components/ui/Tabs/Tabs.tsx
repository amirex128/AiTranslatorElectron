import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string | React.ReactNode;
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
      <div className="flex flex-wrap gap-2 border-b-2 border-white/30 dark:border-white/20 mb-4 pb-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                relative px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out
                flex items-start gap-2 rounded-t-xl min-w-0 backdrop-blur-md
                ${
                  isActive
                    ? 'text-white bg-gradient-to-b from-blue-500/40 to-purple-500/40 border-b-2 border-blue-400 shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/20 border-b-2 border-transparent'
                }
              `}
            >
              {item.icon && (
                <span className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/80'}`}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1 min-w-0 text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 text-xs font-semibold rounded-full
                    ${
                      isActive
                        ? 'bg-blue-500 dark:bg-blue-400 text-white'
                        : 'bg-white/20 dark:bg-gray-700 text-white/80 dark:text-gray-300'
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

