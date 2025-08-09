import React, { useState, useEffect } from 'react';
import './ThumbnailImage.css';
import { getAllImageVariants } from '../utils/imageUtils';

const ThumbnailImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackIcon = '🎬',
  maxRetries = 3,
  retryDelay = 1000,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageVariants] = useState(() => getAllImageVariants(src, maxRetries));

  // Сброс состояния при изменении src
  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    console.log('✅ [THUMBNAIL] Image loaded successfully:', currentSrc);
  };

  const handleError = () => {
    const currentAttempt = retryCount + 1;
    const totalAttempts = Math.min(maxRetries, imageVariants.length - 1);
    
    console.warn(`⚠️ [THUMBNAIL] Failed to load image (attempt ${currentAttempt}/${totalAttempts + 1}):`, currentSrc);
    
    if (retryCount < totalAttempts && retryCount + 1 < imageVariants.length) {
      setTimeout(() => {
        const nextRetryCount = retryCount + 1;
        const nextUrl = imageVariants[nextRetryCount];
        
        setRetryCount(nextRetryCount);
        setCurrentSrc(nextUrl);
        
        console.log(`🔄 [THUMBNAIL] Trying variant ${nextRetryCount + 1} (attempt ${nextRetryCount + 1}/${totalAttempts + 1}):`, nextUrl);
      }, retryDelay);
    } else {
      console.error('❌ [THUMBNAIL] All image variants failed, showing fallback');
      console.log('📋 [THUMBNAIL] Tried variants:', imageVariants);
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Если есть ошибка и исчерпаны попытки, показываем fallback
  if (hasError) {
    return (
      <div 
        className={`thumbnail-fallback ${className}`} 
        title={`Не удалось загрузить изображение. Попробовано ${imageVariants.length} вариантов.`}
        {...props}
      >
        <span className="thumbnail-fallback-icon">{fallbackIcon}</span>
        <span className="thumbnail-fallback-text">
          {imageVariants.length > 1 ? 'Изображение недоступно' : 'Нет изображения'}
        </span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`thumbnail-loading ${className}`} {...props}>
          <div className="thumbnail-spinner"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'thumbnail-hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        {...props}
        style={{ 
          display: isLoading ? 'none' : 'block',
          ...props.style 
        }}
      />
    </>
  );
};

export default ThumbnailImage;
