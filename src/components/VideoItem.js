import React from 'react';
import './VideoItem.css';
import ThumbnailImage from './ThumbnailImage';

const VideoItem = ({ video, index }) => {
  // Функция для конвертации ISO 8601 длительности в читаемый формат
  const formatDuration = (duration) => {
    if (!duration || duration === 'N/A') return 'N/A';
    
    // Если уже в читаемом формате (содержит двоеточие), возвращаем как есть
    if (duration.includes(':')) return duration;
    
    // Если это ISO 8601 формат (PT10M47S)
    if (duration.startsWith('PT')) {
      const durationStr = duration.replace('PT', '');
      
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      
      // Извлекаем часы
      const hoursMatch = durationStr.match(/(\d+)H/);
      if (hoursMatch) {
        hours = parseInt(hoursMatch[1]);
      }
      
      // Извлекаем минуты
      const minutesMatch = durationStr.match(/(\d+)M/);
      if (minutesMatch) {
        minutes = parseInt(minutesMatch[1]);
      }
      
      // Извлекаем секунды
      const secondsMatch = durationStr.match(/(\d+)S/);
      if (secondsMatch) {
        seconds = parseInt(secondsMatch[1]);
      }
      
      // Форматируем результат
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Если неизвестный формат, возвращаем как есть
    return duration;
  };

  const handleVideoClick = () => {
    if (video.url) {
      window.open(video.url, '_blank');
    }
  };

  return (
    <div className="video-item">
      <div className="video-header">
        <h4>{video.title}</h4>
        {video.thumbnail && (
          <div className="video-thumbnail-container">
            <ThumbnailImage
              src={video.thumbnail} 
              alt={video.title}
              className="video-thumbnail"
              onClick={handleVideoClick}
              fallbackIcon="🎬"
              maxRetries={2}
              retryDelay={1000}
            />
            {video.url && (
              <div className="video-link-overlay">
                <span className="play-icon">▶</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="video-details">
        <p>Channel: {video.author}</p>
        <p>Duration: {formatDuration(video.duration)}</p>
        {video.views && <p>👁️ Views: {video.views}</p>}
        {video.publishedAt && <p>📅 Published: {video.publishedAt}</p>}
        
        {video.url && (
          <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="video-link"
          >
            Watch on YouTube
          </a>
        )}
      </div>

      {video.transcript && (
        <details className="transcript-details">
          <summary>
            ► Show {video.isTranscriptSummarized ? 'summary' : 'transcript'}
            {video.isTranscriptSummarized && <span className="summary-badge">✨ Summary</span>}
          </summary>
          <div className="transcript-content">
            {video.isTranscriptSummarized && (
              <div className="summary-notice">
                📝 This is a brief video summary created due to overly long content
              </div>
            )}
            {typeof video.transcript === 'string' ? video.transcript : 'Transcript unavailable'}
          </div>
        </details>
      )}
    </div>
  );
};

export default VideoItem;