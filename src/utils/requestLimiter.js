// Утилита для отслеживания лимита запросов
const REQUESTS_KEY = 'daily_requests';
const MAX_FREE_REQUESTS = 3;

// Получить текущую дату в формате YYYY-MM-DD
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Получить данные о запросах из localStorage
const getRequestsData = () => {
  try {
    const data = localStorage.getItem(REQUESTS_KEY);
    return data ? JSON.parse(data) : { date: getCurrentDate(), count: 0 };
  } catch (error) {
    console.error('Ошибка при получении данных о запросах:', error);
    return { date: getCurrentDate(), count: 0 };
  }
};

// Сохранить данные о запросах в localStorage
const saveRequestsData = (data) => {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка при сохранении данных о запросах:', error);
  }
};

// Проверить, можно ли выполнить запрос
export const canMakeRequest = () => {
  const requestsData = getRequestsData();
  const currentDate = getCurrentDate();
  
  // Если дата изменилась, сбрасываем счетчик
  if (requestsData.date !== currentDate) {
    saveRequestsData({ date: currentDate, count: 0 });
    return true;
  }
  
  return requestsData.count < MAX_FREE_REQUESTS;
};

// Увеличить счетчик запросов
export const incrementRequestCount = () => {
  const requestsData = getRequestsData();
  const currentDate = getCurrentDate();
  
  if (requestsData.date !== currentDate) {
    // Новая дата, начинаем с 1
    saveRequestsData({ date: currentDate, count: 1 });
  } else {
    // Та же дата, увеличиваем счетчик
    saveRequestsData({ date: currentDate, count: requestsData.count + 1 });
  }
};

// Получить количество оставшихся запросов
export const getRemainingRequests = () => {
  const requestsData = getRequestsData();
  const currentDate = getCurrentDate();
  
  if (requestsData.date !== currentDate) {
    return MAX_FREE_REQUESTS;
  }
  
  return Math.max(0, MAX_FREE_REQUESTS - requestsData.count);
};

// Получить количество использованных запросов сегодня
export const getUsedRequestsToday = () => {
  const requestsData = getRequestsData();
  const currentDate = getCurrentDate();
  
  if (requestsData.date !== currentDate) {
    return 0;
  }
  
  return requestsData.count;
};

// Сбросить счетчик запросов (для тестирования)
export const resetRequestCount = () => {
  saveRequestsData({ date: getCurrentDate(), count: 0 });
};
