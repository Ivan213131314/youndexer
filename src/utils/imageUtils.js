// Утилиты для работы с изображениями и обхода CORS ограничений

/**
 * Получает альтернативные URL для YouTube thumbnail'ов
 * @param {string} originalUrl - Оригинальный URL изображения
 * @returns {string[]} - Массив альтернативных URL
 */
export const getYoutubeThumbnailAlternatives = (originalUrl) => {
  if (!originalUrl) return [];
  
  const alternatives = [];
  
  // Для YouTube channel thumbnails (yt3.googleusercontent.com)
  if (originalUrl.includes('yt3.googleusercontent.com')) {
    const baseUrl = originalUrl.split('=')[0];
    
    // Различные размеры и форматы
    alternatives.push(
      `${baseUrl}=s240-c-k-c0x00ffffff-no-rj`,
      `${baseUrl}=s176-c-k-c0x00ffffff-no-rj`, 
      `${baseUrl}=s88-c-k-c0x00ffffff-no-rj`,
      `${baseUrl}=s48-c-k-c0x00ffffff-no-rj`,
      // Без некоторых параметров
      `${baseUrl}=s240`,
      `${baseUrl}=s176`,
      `${baseUrl}=s88`
    );
  }
  
  // Для YouTube video thumbnails (img.youtube.com)
  if (originalUrl.includes('img.youtube.com') || originalUrl.includes('i.ytimg.com')) {
    const videoIdMatch = originalUrl.match(/\/vi\/([^\/]+)\//);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      alternatives.push(
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        `https://img.youtube.com/vi/${videoId}/default.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/default.jpg`
      );
    }
  }
  
  return [...new Set(alternatives)]; // Убираем дубликаты
};

/**
 * Создает URL с cache busting параметрами
 * @param {string} url - Оригинальный URL
 * @param {number} attempt - Номер попытки
 * @returns {string} - URL с cache busting параметрами
 */
export const addCacheBusting = (url, attempt = 1) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}&attempt=${attempt}`;
};

/**
 * Проверяет, является ли URL изображением YouTube
 * @param {string} url - URL для проверки
 * @returns {boolean} - true если это YouTube изображение
 */
export const isYouTubeImage = (url) => {
  return url && (
    url.includes('yt3.googleusercontent.com') ||
    url.includes('img.youtube.com') ||
    url.includes('i.ytimg.com')
  );
};

/**
 * Получает все возможные варианты URL для retry
 * @param {string} originalUrl - Оригинальный URL
 * @param {number} maxAlternatives - Максимальное количество альтернатив
 * @returns {string[]} - Массив URL для попыток загрузки
 */
export const getAllImageVariants = (originalUrl, maxAlternatives = 3) => {
  if (!originalUrl) return [];
  
  const variants = [originalUrl];
  
  if (isYouTubeImage(originalUrl)) {
    const alternatives = getYoutubeThumbnailAlternatives(originalUrl);
    variants.push(...alternatives.slice(0, maxAlternatives));
  }
  
  // Добавляем cache busting варианты
  variants.push(addCacheBusting(originalUrl, 1));
  variants.push(addCacheBusting(originalUrl, 2));
  
  return [...new Set(variants)]; // Убираем дубликаты
};
