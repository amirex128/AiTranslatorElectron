import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { AppSettings } from '../types/settings';
import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { ModelSelector } from '../components/translation/ModelSelector/ModelSelector';
import { AIModel, AI_MODELS } from '../models/AIModel';
import { Toast } from '../components/ui/Toast/Toast';
import { OllamaGuideModal } from '../components/ui/OllamaGuideModal/OllamaGuideModal';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { settings, loadSettings } = useSettingsStore();
  const [showOllamaGuide, setShowOllamaGuide] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تنظیمات
          </h1>
          <Button variant="ghost" onClick={handleBack}>
            بازگشت
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  تنظیمات از فایل .env خوانده می‌شوند
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  برای تغییر تنظیمات، فایل .env را ویرایش کنید و برنامه را مجدداً راه‌اندازی کنید.
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مدل هوش مصنوعی
            </label>
            <ModelSelector
              selectedModel={settings.selectedModel}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onModelChange={() => {}} // Disabled
              disabled={true}
            />
          </div>

          {/* AI Provider URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                آدرس AI Provider (Ollama)
              </label>
              <button
                onClick={() => setShowOllamaGuide(true)}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                راهنمای نصب Ollama
              </button>
            </div>
            <Input
              type="text"
              value={settings.aiProviderUrl}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onChange={() => {}} // Disabled
              placeholder="http://localhost:11434"
              disabled={true}
            />
          </div>

          {/* OpenRouter Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              تنظیمات OpenRouter
            </h2>

            <div className="space-y-4">
              <Input
                label="Base URL"
                type="text"
                value={settings.openRouterBaseUrl}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                placeholder="https://openrouter.ai/api/v1"
                disabled={true}
              />

              <Input
                label="API Key 1"
                type="password"
                value={settings.openRouterApiKey1}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                placeholder="sk-or-v1-..."
                disabled={true}
              />

              <Input
                label="API Key 2"
                type="password"
                value={settings.openRouterApiKey2}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                placeholder="sk-or-v1-..."
                disabled={true}
              />

              <Input
                label="Referer"
                type="text"
                value={settings.openRouterReferer}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                placeholder="http://localhost:3000"
                disabled={true}
              />

              <Input
                label="Site Name"
                type="text"
                value={settings.openRouterSiteName}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                placeholder="AI Translator"
                disabled={true}
              />
            </div>
          </div>

          {/* AI Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              تنظیمات AI
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onChange={() => {}} // Disabled
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled={true}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>
            </div>
          </div>

          {/* UI Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              تنظیمات رابط کاربری
            </h2>

            <div className="space-y-4">
              <Input
                label="اندازه فونت"
                type="number"
                min="10"
                max="24"
                value={settings.fontSize}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Disabled
                disabled={true}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="عرض پنجره"
                  type="number"
                  min="600"
                  value={settings.windowSize.width}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onChange={() => {}} // Disabled
                  disabled={true}
                />

                <Input
                  label="ارتفاع پنجره"
                  type="number"
                  min="400"
                  value={settings.windowSize.height}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onChange={() => {}} // Disabled
                  disabled={true}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Ollama Guide Modal */}
        <OllamaGuideModal
          isOpen={showOllamaGuide}
          onClose={() => setShowOllamaGuide(false)}
          />
      </div>
    </div>
  );
};

