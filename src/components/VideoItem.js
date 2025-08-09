import React from 'react';
import './VideoItem.css';
import ThumbnailImage from './ThumbnailImage';

const VideoItem = ({ video, index }) => {
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
        <p>Канал: {video.author}</p>
        <p>Длительность: {video.duration}</p>
        {video.views && <p>👁️ Просмотры: {video.views}</p>}
        {video.publishedAt && <p>📅 Дата публикации: {video.publishedAt}</p>}
        
        {video.url && (
          <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="video-link"
          >
            Смотреть на YouTube
          </a>
        )}
      </div>

      {video.transcript && (
        <details className="transcript-details">
          <summary>► Показать transcript</summary>
          <div className="transcript-content">
            {typeof video.transcript === 'string' ? video.transcript : 'Transcript недоступен'}
          </div>
        </details>
      )}
    </div>
  );
};

export default VideoItem;