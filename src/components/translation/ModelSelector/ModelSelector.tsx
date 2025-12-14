import React from 'react';
import { Select } from '../../ui/Select/Select';
import { AIModel, AI_MODELS } from '../../../models/AIModel';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  className?: string;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className = '',
  disabled = false,
}) => {
  const options = AI_MODELS.map((model) => ({
    key: model.key,
    value: model.value,
    label: model.label,
  }));

  return (
    <Select
      label="مدل هوش مصنوعی"
      options={options}
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value as AIModel)}
      className={className}
      disabled={disabled}
    />
  );
};

