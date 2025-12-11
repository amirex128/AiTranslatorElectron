import React, { useEffect } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Button } from '../../ui/Button/Button';
import { OLLAMA_MODELS } from '../../../models/OllamaModel';
import { OllamaModel } from '../../../models/OllamaModel';

interface SettingsPanelProps {
  onClose?: () => void;
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  className = '',
}) => {
  const {
    selectedModel,
    ollamaUrl,
    temperature,
    fontSize,
    rtlDirection,
    darkMode,
    setSelectedModel,
    setOllamaUrl,
    setTemperature,
    setFontSize,
    setRtlDirection,
    setDarkMode,
  } = useSettingsStore();

  const [localOllamaUrl, setLocalOllamaUrl] = React.useState(ollamaUrl);
  const [localTemperature, setLocalTemperature] = React.useState(temperature.toString());
  const [localFontSize, setLocalFontSize] = React.useState(fontSize.toString());

  useEffect(() => {
    setLocalOllamaUrl(ollamaUrl);
    setLocalTemperature(temperature.toString());
    setLocalFontSize(fontSize.toString());
  }, [ollamaUrl, temperature, fontSize]);

  const handleSave = () => {
    setOllamaUrl(localOllamaUrl);
    setTemperature(parseFloat(localTemperature) || 0.7);
    setFontSize(parseInt(localFontSize) || 16);
    if (onClose) {
      onClose();
    }
  };

  const modelOptions = OLLAMA_MODELS.map((model) => ({
    value: model.value,
    label: model.label,
  }));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        تنظیمات
      </h2>

      <div className="space-y-4">
        <Select
          label="مدل هوش مصنوعی"
          options={modelOptions}
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as OllamaModel)}
        />

        <Input
          label="آدرس Ollama"
          type="text"
          value={localOllamaUrl}
          onChange={(e) => setLocalOllamaUrl(e.target.value)}
          placeholder="http://localhost:11434"
          helperText="آدرس سرور Ollama"
        />

        <Input
          label="Temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={localTemperature}
          onChange={(e) => setLocalTemperature(e.target.value)}
          helperText="مقدار Temperature برای مدل (0-2)"
        />

        <Input
          label="سایز فونت"
          type="number"
          min="12"
          max="24"
          value={localFontSize}
          onChange={(e) => setLocalFontSize(e.target.value)}
          helperText="سایز فونت برای نمایش نتایج (12-24)"
        />

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            جهت راست به چپ (RTL)
          </label>
          <input
            type="checkbox"
            checked={rtlDirection}
            onChange={(e) => setRtlDirection(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            حالت تاریک (Dark Mode)
          </label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="primary" onClick={handleSave} className="flex-1">
            ذخیره
          </Button>
          {onClose && (
            <Button variant="secondary" onClick={onClose} className="flex-1">
              بستن
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

