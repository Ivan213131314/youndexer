import React, { useState, useEffect } from 'react';
import './ModelSelector.css';

const ModelSelector = ({ selectedModel, onModelChange, disabled = false }) => {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Кастомный список моделей
  useEffect(() => {
    const customModels = [
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', price: '$5.00/1M' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', price: '$3.50/1M' },
      { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', price: '$0.50/1M' },
      { id: 'google/gemini-2.5-flash-lite-preview-06-17', name: 'Gemini 2.5 Flash Lite Preview', provider: 'Google', price: '$0.50/1M' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', price: '$2.00/1M' },
      { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite', provider: 'Google', price: '$0.25/1M' },
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', price: '$15.00/1M' },
      { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', price: '$3.00/1M' },
      { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', price: '$0.15/1M' },
      { id: 'qwen/qwen-turbo', name: 'Qwen Turbo', provider: 'Qwen', price: '$0.50/1M' },
      { id: 'google/gemini-flash-1.5-8b', name: 'Gemini Flash 1.5 8B', provider: 'Google', price: '$0.10/1M' },
      { id: 'amazon/nova-lite-v1', name: 'Nova Lite v1', provider: 'Amazon', price: '$0.20/1M' },
      { id: 'openrouter/horizon-beta', name: 'Horizon Beta', provider: 'OpenRouter', price: '$0.00/1M' },
      { id: 'anthropic/claude-3-haiku:beta', name: 'Claude 3 Haiku Beta', provider: 'Anthropic', price: '$0.25/1M' },
      { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera', provider: 'TNG Tech', price: '$0.00/1M' },
      { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528', provider: 'DeepSeek', price: '$0.00/1M' },
      { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera', provider: 'TNG Tech', price: '$0.00/1M' },
      { id: 'microsoft/mai-ds-r1:free', name: 'Microsoft MAI DS R1', provider: 'Microsoft', price: '$0.00/1M' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'DeepSeek', price: '$0.00/1M' },
      { id: 'moonshotai/kimi-dev-72b:free', name: 'Kimi Dev 72B', provider: 'Moonshot AI', price: '$0.00/1M' },
      { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', name: 'Llama 3.1 Nemotron Ultra 253B', provider: 'NVIDIA', price: '$0.00/1M' }
    ];

    // Сортируем по цене (от дешевых к дорогим)
    const sortedModels = customModels.sort((a, b) => {
      const getPriceValue = (priceStr) => {
        const match = priceStr.match(/\$([0-9.]+)/);
        return match ? parseFloat(match[1]) : 999;
      };
      
      const priceA = getPriceValue(a.price);
      const priceB = getPriceValue(b.price);
      return priceA - priceB;
    });

    setModels(sortedModels);
    console.log('✅ [ModelSelector] Custom models loaded:', sortedModels);
    setModelsLoading(false);
  }, []);

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    onModelChange(modelId);
  };

  // Проверяем, есть ли выбранная модель в списке
  const selectedModelExists = models.some(model => model.id === selectedModel);

  return (
    <select
      className="model-select"
      value={selectedModelExists ? selectedModel : ''}
      onChange={handleModelChange}
      disabled={disabled || modelsLoading}
    >
      {modelsLoading ? (
        <option>Загрузка моделей...</option>
      ) : models.length > 0 ? (
        <>
          {!selectedModelExists && selectedModel && (
            <option value={selectedModel} disabled>
              {selectedModel} (не найдена)
            </option>
          )}
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.price})
            </option>
          ))}
        </>
      ) : (
        <option>Нет доступных моделей</option>
      )}
    </select>
  );
};

export default ModelSelector;