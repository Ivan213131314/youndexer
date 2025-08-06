import React, { useState } from 'react';
import { parseChannel, validateChannelUrl } from './channelService';
import { addTranscriptsToVideos } from '../ytSearchModule';
import TranscriptSummary from '../TranscriptSummary';
import VideoItem from '../components/VideoItem';
import './ChannelParsing.css';

function ChannelParsing({ onBackToMain }) {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsingResults, setParsingResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedVideoCount, setSelectedVideoCount] = useState(10);
  const [channelVideosResults, setChannelVideosResults] = useState(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

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

  const handleGetVideos = async () => {
    if (!channelUrl.trim()) {
      setError('Пожалуйста, введите ссылку на канал');
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      setError('Неверный формат ссылки на YouTube канал');
      return;
    }
    
    console.log(`\n🚀 [CHANNEL] Getting videos for channel: "${channelUrl}" with limit: ${selectedVideoCount}`);
    setIsLoadingVideos(true);
    setChannelVideosResults(null);
    setSummaryData(null);
    setError(null);
    
    try {
      // Получаем видео канала через Supadata
      const { Supadata } = await import('@supadata/js');
      const supadata = new Supadata({
        apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
      });
      
      const channelVideos = await supadata.youtube.channel.videos({
        id: channelUrl,
        type: 'all',
        limit: selectedVideoCount,
      });
      
      console.log(`✅ [CHANNEL] Channel videos received:`, channelVideos);
      
             // Преобразуем в формат как на главном экране
       const videoIds = channelVideos.videoIds || [];
       
               // Получаем полную информацию о видео через Supadata
        console.log(`📝 [CHANNEL] Getting full video info for ${videoIds.length} videos...`);
        const videosWithInfo = await Promise.all(
          videoIds.map(async (videoId) => {
            try {
              const videoInfo = await supadata.youtube.video({
                id: videoId
              });
              
              return {
                videoId: videoId,
                title: videoInfo.title || `Video ${videoId}`,
                author: videoInfo.channel?.name || parsingResults.channelName,
                duration: videoInfo.duration || 'N/A',
                url: `https://youtube.com/watch?v=${videoId}`,
                thumbnail: videoInfo.thumbnail || `https://img.youtube.com/vi/${videoId}/default.jpg`,
                views: videoInfo.viewCount || 'N/A',
                publishedAt: videoInfo.uploadDate || 'N/A'
              };
            } catch (error) {
              console.warn(`⚠️ [CHANNEL] Failed to get info for video ${videoId}:`, error);
              // Fallback если не удалось получить информацию
              return {
                videoId: videoId,
                title: `Video ${videoId}`,
                author: parsingResults.channelName,
                duration: 'N/A',
                url: `https://youtube.com/watch?v=${videoId}`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
                views: 'N/A',
                publishedAt: 'N/A'
              };
            }
          })
        );
       
       console.log(`✅ [CHANNEL] Full video info received:`, videosWithInfo);
      
             console.log(`📝 [CHANNEL] Getting transcripts for ${videosWithInfo.length} videos...`);
       const videosWithTranscripts = await addTranscriptsToVideos(videosWithInfo);
      
      setChannelVideosResults({
        videos: videosWithTranscripts,
        totalCount: videosWithTranscripts.length
      });
      
      console.log(`✅ [CHANNEL] Channel videos with transcripts received successfully:`, videosWithTranscripts);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error getting channel videos:', error);
      setError('Ошибка при получении видео канала. Попробуйте еще раз.');
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel videos request completed`);
      setIsLoadingVideos(false);
    }
  };

  const handleSummaryComplete = async (summaryResult) => {
    console.log(`📋 [CHANNEL] Summary completed:`, summaryResult);
    setSummaryData(summaryResult);
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
                {/* Кнопки управления - перемещены наверх контейнера channel-info */}
                <div className="channel-actions-top">
                  <h2>📺 Информация о канале</h2>
                  <div className="channel-actions-right">
                    <div className="video-count-selector">
                      <label htmlFor="videoCount">Количество видео:</label>
                      <select 
                        id="videoCount" 
                        className="video-count-select"
                        value={selectedVideoCount}
                        onChange={(e) => setSelectedVideoCount(parseInt(e.target.value))}
                      >
                        <option value="1">1</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <button 
                      className="get-videos-button"
                      onClick={handleGetVideos}
                      disabled={isLoadingVideos}
                    >
                      {isLoadingVideos ? 'Получение...' : 'Получить видео'}
                    </button>
                  </div>
                </div>
                <div className="channel-info-content">
                  <div className="channel-details">
                    <div className="detail-item">
                      <span className="detail-label">Название канала:</span>
                      <span className="detail-value">{parsingResults.channelName || 'Не найдено'}</span>
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
                          </div>

            {/* Результаты получения видео в двух колонках */}
            {channelVideosResults && (
              <div className="videos-results-section">
                {/* Левая колонка - Общий вывод */}
                <div className="left-column">
                  <div className="summary-section">
                    <h2>📋 Общий вывод</h2>
                    
                    {/* Показываем компонент для создания резюме */}
                    {channelVideosResults.videos && channelVideosResults.videos.length > 0 && (
                      <TranscriptSummary 
                        videos={channelVideosResults.videos}
                        userQuery={`Канал: ${parsingResults.channelName}`}
                        onSummaryComplete={handleSummaryComplete}
                      />
                    )}

                    {/* Отображение готового резюме */}
                    {summaryData && (
                      <div className="summary-display">
                        <div className="summary-stats">
                          <div className="stat-item">
                            <span className="stat-label">Всего результатов:</span>
                            <span className="stat-value">{summaryData.totalResults}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Transcript найдено:</span>
                            <span className="stat-value">{summaryData.transcriptCount}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Канал:</span>
                            <span className="stat-value">{parsingResults.channelName}</span>
                          </div>
                        </div>

                        <div className="summary-content">
                          <h4>📋 Резюме канала: "{parsingResults.channelName}"</h4>
                          <div className="summary-text">
                            {summaryData.summary.split('\n').map((line, index) => (
                              <p key={index}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Плейсхолдер когда нет данных */}
                    {!summaryData && (
                      <div className="placeholder">
                        <p>Нажмите "Получить видео" чтобы увидеть общий вывод по всем транскриптам</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка - Найденные видео */}
                <div className="right-column">
                  <div className="videos-section">
                    <h2>📺 Найденные видео ({channelVideosResults.totalCount})</h2>
                    <div className="videos-list">
                      {channelVideosResults.videos.map((video, index) => (
                        <VideoItem key={index} video={video} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Старый список видео (убираем) */}
            {!channelVideosResults && (
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
                        {video.transcript && (
                          <details>
                            <summary>► Показать transcript</summary>
                            <div className="transcript-content">
                              {typeof video.transcript === 'string' ? video.transcript : 'Transcript недоступен'}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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