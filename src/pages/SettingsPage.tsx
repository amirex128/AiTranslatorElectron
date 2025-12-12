import React, { useEffect, useState } from 'react';
import { useSettingsStore, AppSettings } from '../stores/settingsStore';
import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { ModelSelector } from '../components/translation/ModelSelector/ModelSelector';
import { AIModel, AI_MODELS } from '../models/AIModel';
import { Toast } from '../components/ui/Toast/Toast';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { settings, loadSettings, updateSettings, resetSettings } = useSettingsStore();
  const [formData, setFormData] = useState<Partial<AppSettings>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings(formData);
      setToast({ message: 'تنظیمات با موفقیت ذخیره شد', type: 'success' });
    } catch (error) {
      setToast({ message: 'خطا در ذخیره تنظیمات', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetSettings();
      setToast({ message: 'تنظیمات به حالت پیش‌فرض بازگشت', type: 'success' });
      // Reload settings to update form
      await loadSettings();
    } catch (error) {
      setToast({ message: 'خطا در بازگشت به پیش‌فرض', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

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
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مدل هوش مصنوعی
            </label>
            <ModelSelector
              selectedModel={(formData.selectedModel as AIModel) || settings.selectedModel}
              onModelChange={(model) => handleChange('selectedModel', model)}
            />
          </div>

          {/* AI Provider URL */}
          <div>
            <Input
              label="آدرس AI Provider (Ollama)"
              type="text"
              value={formData.aiProviderUrl || settings.aiProviderUrl}
              onChange={(e) => handleChange('aiProviderUrl', e.target.value)}
              placeholder="http://localhost:11434"
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
                value={formData.openRouterBaseUrl || settings.openRouterBaseUrl}
                onChange={(e) => handleChange('openRouterBaseUrl', e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
              />

              <Input
                label="API Key 1"
                type="password"
                value={formData.openRouterApiKey1 || settings.openRouterApiKey1}
                onChange={(e) => handleChange('openRouterApiKey1', e.target.value)}
                placeholder="sk-or-v1-..."
              />

              <Input
                label="API Key 2"
                type="password"
                value={formData.openRouterApiKey2 || settings.openRouterApiKey2}
                onChange={(e) => handleChange('openRouterApiKey2', e.target.value)}
                placeholder="sk-or-v1-..."
              />

              <Input
                label="Referer"
                type="text"
                value={formData.openRouterReferer || settings.openRouterReferer}
                onChange={(e) => handleChange('openRouterReferer', e.target.value)}
                placeholder="http://localhost:3000"
              />

              <Input
                label="Site Name"
                type="text"
                value={formData.openRouterSiteName || settings.openRouterSiteName}
                onChange={(e) => handleChange('openRouterSiteName', e.target.value)}
                placeholder="AI Translator"
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
                  Temperature: {formData.temperature !== undefined ? formData.temperature : settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature !== undefined ? formData.temperature : settings.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
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
                value={formData.fontSize || settings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value, 10))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="عرض پنجره"
                  type="number"
                  min="600"
                  value={formData.windowSize?.width || settings.windowSize.width}
                  onChange={(e) =>
                    handleChange('windowSize', {
                      ...(formData.windowSize || settings.windowSize),
                      width: parseInt(e.target.value, 10),
                    })
                  }
                />

                <Input
                  label="ارتفاع پنجره"
                  type="number"
                  min="400"
                  value={formData.windowSize?.height || settings.windowSize.height}
                  onChange={(e) =>
                    handleChange('windowSize', {
                      ...(formData.windowSize || settings.windowSize),
                      height: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
            >
              ذخیره
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isSaving}
            >
              بازگشت به پیش‌فرض
            </Button>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

