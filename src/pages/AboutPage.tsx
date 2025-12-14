import React from 'react';
import { Button } from '../components/ui/Button/Button';

interface AboutPageProps {
  onBack?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const handleLinkedInClick = () => {
    window.open('https://www.linkedin.com/in/amirex128/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            درباره ما
          </h1>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              بازگشت
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">AS</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              مترجم هوش مصنوعی
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              یک ابزار پیشرفته برای ترجمه و آموزش گرامر با استفاده از هوش مصنوعی
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                سازنده
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                امیر شیردل
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ارتباط با سازنده
              </h3>
              <Button
                variant="primary"
                onClick={handleLinkedInClick}
                className="flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn Profile
              </Button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ویژگی‌ها
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>ترجمه دوطرفه فارسی و انگلیسی</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>اصلاح و آموزش گرامر انگلیسی</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>پشتیبانی از مدل‌های مختلف AI (Ollama و OpenRouter)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>پخش صدا برای متن‌های انگلیسی</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>ذخیره تاریخچه ترجمه‌ها</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


