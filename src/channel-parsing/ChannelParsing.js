import React, { useState } from 'react';
import { parseChannel, validateChannelUrl } from './channelService';
import './ChannelParsing.css';

function ChannelParsing({ onBackToMain }) {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsingResults, setParsingResults] = useState(null);
  const [error, setError] = useState(null);

  const handleChannelParse = async () => {
    if (!channelUrl.trim()) {
      setError('Пожалуйста, введите ссылку на канал');
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      setError('Неверный формат ссылки на YouTube канал');
      return;
    }
    
    console.log(`\n🚀 [CHANNEL] Starting channel parsing for URL: "${channelUrl}"`);
    setIsLoading(true);
    setParsingResults(null);
    setError(null);
    
    try {
      const results = await parseChannel(channelUrl);
      setParsingResults(results);
      console.log(`✅ [CHANNEL] Channel parsed successfully:`, results);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error in channel parsing:', error);
      setError('Ошибка при парсинге канала. Попробуйте еще раз.');
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel parsing completed`);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleChannelParse();
    }
  };

  return (
    <div className="channel-parsing">
      {/* Верхнее меню */}
      <div className="top-menu">
        <button 
          className="menu-button"
          onClick={onBackToMain}
        >
          Main
        </button>
        <button className="menu-button">History</button>
        <button className="menu-button active">Channel parsing</button>
        <button className="menu-button">About us</button>
      </div>

      <div className="header">
        <h1 className="main-heading">YouTube Channel Parser</h1>
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Вставьте ссылку на канал..."
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            className="search-button"
            onClick={handleChannelParse}
            disabled={isLoading}
          >
            {isLoading ? 'Parsing...' : 'Parse Channel'}
          </button>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Основной контент */}
      <div className="main-content">
        <div className="channel-results">
          {parsingResults ? (
            <div className="results-section">
              <div className="channel-info">
                <h2>📺 Информация о канале</h2>
                <div className="channel-details">
                  <div className="detail-item">
                    <span className="detail-label">Название канала:</span>
                    <span className="detail-value">{parsingResults.channelName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Подписчики:</span>
                    <span className="detail-value">{parsingResults.subscriberCount?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Количество видео:</span>
                    <span className="detail-value">{parsingResults.videoCount}</span>
                  </div>
                  {parsingResults.description && (
                    <div className="detail-item">
                      <span className="detail-label">Описание:</span>
                      <span className="detail-value description">{parsingResults.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="videos-section">
                <h2>📋 Список видео ({parsingResults.videos.length})</h2>
                <div className="videos-list">
                  {parsingResults.videos.map((video, index) => (
                    <div key={index} className="video-item">
                      <div className="video-header">
                        <h4>{video.title}</h4>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="video-thumbnail"
                        />
                      </div>
                      <div className="video-details">
                        <p>👁️ Просмотры: {video.views}</p>
                        <p>📅 Дата публикации: {video.publishedAt}</p>
                        <p>⏱️ Длительность: {video.duration}</p>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-link">
                          Смотреть на YouTube
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <p>Вставьте ссылку на YouTube канал для начала парсинга</p>
              <p className="placeholder-examples">
                Примеры поддерживаемых форматов:<br/>
                • https://youtube.com/channel/UC...<br/>
                • https://youtube.com/c/ChannelName<br/>
                • https://youtube.com/@username<br/>
                • https://youtube.com/user/username
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChannelParsing;