# Создание резюме на основе transcript из Supadata

Этот модуль позволяет получать результаты batch job из Supadata, извлекать transcript поля и создавать резюме с помощью OpenAI.

## Установка зависимостей

Все необходимые зависимости уже установлены в `package.json`:
- `@supadata/js` - для работы с Supadata API
- `openai` - для работы с OpenAI API

## Настройка

1. Убедитесь, что у вас есть API ключ Supadata (уже настроен в коде)
2. Установите переменную окружения `OPENAI_API_KEY`:

```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

## Использование

### Основная функция

```javascript
import { getTranscriptSummary } from './transcript-summarizer.js';

const jobId = 'your-batch-job-id';
const userQuery = 'Какие основные темы обсуждаются в этих видео?';

try {
    const result = await getTranscriptSummary(jobId, userQuery);
    console.log('Резюме:', result.summary);
    console.log('Количество transcript:', result.transcriptCount);
} catch (error) {
    console.error('Ошибка:', error.message);
}
```

### Получение только transcript

```javascript
import { getTranscriptsOnly } from './transcript-summarizer.js';

const jobId = 'your-batch-job-id';

try {
    const transcripts = await getTranscriptsOnly(jobId);
    console.log('Transcript:', transcripts);
} catch (error) {
    console.error('Ошибка:', error.message);
}
```

### Запуск из командной строки

```bash
# С параметрами
node transcript-summarizer.js "job-id" "ваш запрос"

# С параметрами по умолчанию
node transcript-summarizer.js
```

## Структура ответа

Функция `getTranscriptSummary` возвращает объект:

```javascript
{
    summary: "Созданное резюме...",
    transcriptCount: 5,
    totalResults: 10,
    jobId: "job-id",
    userQuery: "ваш запрос"
}
```

## Обработка ошибок

Функции могут выбросить следующие ошибки:
- `Batch job не завершен` - если batch job еще выполняется
- `Не найдено ни одного transcript` - если в результатах нет transcript полей
- Ошибки API Supadata или OpenAI

## Примеры запросов для OpenAI

Вот несколько примеров запросов, которые можно использовать:

- "Какие основные темы обсуждаются в этих видео?"
- "Создай краткое резюме ключевых моментов"
- "Какие выводы можно сделать из этих видео?"
- "Сравни мнения авторов по основным вопросам"
- "Выдели главные идеи и концепции"

## Примечания

- Убедитесь, что batch job в Supadata завершен перед вызовом функции
- OpenAI API имеет лимиты на количество токенов, учитывайте это при больших transcript
- Функция автоматически фильтрует объекты без transcript полей 