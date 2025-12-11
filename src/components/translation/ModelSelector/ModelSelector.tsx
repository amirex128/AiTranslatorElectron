import React from 'react';
import { Select } from '../../ui/Select/Select';
import { OllamaModel, OLLAMA_MODELS } from '../../../models/OllamaModel';

interface ModelSelectorProps {
  selectedModel: OllamaModel;
  onModelChange: (model: OllamaModel) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className = '',
}) => {
  const options = OLLAMA_MODELS.map((model) => ({
    value: model.value,
    label: model.label,
  }));

  return (
    <Select
      label="مدل هوش مصنوعی"
      options={options}
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value as OllamaModel)}
      className={className}
    />
  );
};

