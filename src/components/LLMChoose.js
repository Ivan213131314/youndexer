import React, { useState, useEffect } from 'react';
import './LLMChoose.css';

const LLMChoose = ({ selectedModel, onModelChange }) => {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Кастомный список моделей
  useEffect(() => {
    const customModels = [
      { 
        id: 'google/gemini-pro-1.5', 
        name: 'Gemini Pro 1.5', 
        provider: 'Google', 
        description: 'Мощная модель от Google для сложных задач',
        price: '$3.50/1M tokens',
        speed: 'Быстро'
      },
      { 
        id: 'google/gemini-2.5-flash-lite', 
        name: 'Gemini 2.5 Flash Lite', 
        provider: 'Google', 
        description: 'Быстрая и эффективная модель',
        price: '$0.50/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'google/gemini-2.5-flash-lite-preview-06-17', 
        name: 'Gemini 2.5 Flash Lite Preview', 
        provider: 'Google', 
        description: 'Предварительная версия Flash Lite',
        price: '$0.50/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'meta-llama/llama-4-maverick', 
        name: 'Llama 4 Maverick', 
        provider: 'Meta', 
        description: 'Инновационная модель от Meta',
        price: '$2.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'google/gemini-2.0-flash-lite-001', 
        name: 'Gemini 2.0 Flash Lite', 
        provider: 'Google', 
        description: 'Обновленная версия Flash Lite',
        price: '$0.25/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'openai/gpt-4.1', 
        name: 'GPT-4.1', 
        provider: 'OpenAI', 
        description: 'Самая мощная модель OpenAI',
        price: '$15.00/1M tokens',
        speed: 'Медленно'
      },
      { 
        id: 'openai/gpt-4.1-mini', 
        name: 'GPT-4.1 Mini', 
        provider: 'OpenAI', 
        description: 'Компактная версия GPT-4.1',
        price: '$3.00/1M tokens',
        speed: 'Быстро'
      },
      { 
        id: 'openai/gpt-4.1-nano', 
        name: 'GPT-4.1 Nano', 
        provider: 'OpenAI', 
        description: 'Самая быстрая версия GPT-4.1',
        price: '$0.15/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'qwen/qwen-turbo', 
        name: 'Qwen Turbo', 
        provider: 'Qwen', 
        description: 'Быстрая модель от Alibaba',
        price: '$0.50/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'google/gemini-flash-1.5-8b', 
        name: 'Gemini Flash 1.5 8B', 
        provider: 'Google', 
        description: 'Легковесная модель для быстрых задач',
        price: '$0.10/1M tokens',
        speed: 'Очень быстро'
      },
      { 
        id: 'amazon/nova-lite-v1', 
        name: 'Nova Lite v1', 
        provider: 'Amazon', 
        description: 'Модель от Amazon для повседневных задач',
        price: '$0.20/1M tokens',
        speed: 'Быстро'
      },
      { 
        id: 'openrouter/horizon-beta', 
        name: 'Horizon Beta', 
        provider: 'OpenRouter', 
        description: 'Экспериментальная модель OpenRouter',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'anthropic/claude-3-haiku:beta', 
        name: 'Claude 3 Haiku Beta', 
        provider: 'Anthropic', 
        description: 'Бета версия Claude 3 Haiku',
        price: '$0.25/1M tokens',
        speed: 'Быстро'
      },
      { 
        id: 'tngtech/deepseek-r1t2-chimera:free', 
        name: 'DeepSeek R1T2 Chimera', 
        provider: 'TNG Tech', 
        description: 'Бесплатная модель DeepSeek',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'deepseek/deepseek-r1-0528:free', 
        name: 'DeepSeek R1 0528', 
        provider: 'DeepSeek', 
        description: 'Бесплатная модель от DeepSeek',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'tngtech/deepseek-r1t-chimera:free', 
        name: 'DeepSeek R1T Chimera', 
        provider: 'TNG Tech', 
        description: 'Еще одна бесплатная модель DeepSeek',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'microsoft/mai-ds-r1:free', 
        name: 'Microsoft MAI DS R1', 
        provider: 'Microsoft', 
        description: 'Бесплатная модель от Microsoft',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'deepseek/deepseek-r1:free', 
        name: 'DeepSeek R1', 
        provider: 'DeepSeek', 
        description: 'Базовая бесплатная модель DeepSeek',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'moonshotai/kimi-dev-72b:free', 
        name: 'Kimi Dev 72B', 
        provider: 'Moonshot AI', 
        description: 'Бесплатная модель для разработчиков',
        price: '$0.00/1M tokens',
        speed: 'Средне'
      },
      { 
        id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', 
        name: 'Llama 3.1 Nemotron Ultra 253B', 
        provider: 'NVIDIA', 
        description: 'Мощная бесплатная модель от NVIDIA',
        price: '$0.00/1M tokens',
        speed: 'Медленно'
      }
    ];

    // Сортируем по цене (от дешевых к дорогим)
    const sortedModels = customModels.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 999;
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 999;
      return priceA - priceB;
    });

    setModels(sortedModels);
    console.log('✅ [LLMChoose] Custom models loaded:', sortedModels);
    setModelsLoading(false);
  }, []);

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    onModelChange(modelId);
  };

  const selectedModelInfo = models.find(model => model.id === selectedModel);

  return (
    <div className="llm-choose">
      <div className="llm-header">
        <h3>🤖 Выберите LLM модель</h3>
        <p className="llm-description">
          Выберите модель для создания резюме. Разные модели имеют разную скорость и качество.
        </p>
      </div>
      
      <div className="llm-selector">
        <label htmlFor="model-select" className="llm-label">
          Модель:
        </label>
        <select
          id="model-select"
          className="llm-select"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={modelsLoading}
        >
          {modelsLoading ? (
            <option>Загрузка моделей...</option>
          ) : models.length > 0 ? (
            models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider}) - {model.price}
              </option>
            ))
          ) : (
            <option>Нет доступных моделей</option>
          )}
        </select>
      </div>

      {selectedModelInfo && (
        <div className="model-info">
          <div className="model-details">
            <div className="model-name">
              <strong>{selectedModelInfo.name}</strong>
              <span className="model-provider">by {selectedModelInfo.provider}</span>
            </div>
            <div className="model-description">{selectedModelInfo.description}</div>
            <div className="model-stats">
              <span className="model-price">💰 {selectedModelInfo.price}</span>
              <span className="model-speed">⚡ {selectedModelInfo.speed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMChoose;