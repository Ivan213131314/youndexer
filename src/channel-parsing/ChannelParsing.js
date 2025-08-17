import React, { useState } from 'react';
import { parseChannel, validateChannelUrl } from './channelService';
import { addTranscriptsToVideos } from '../ytSearchModule';
import SearchProgress from '../components/SearchProgress';
import TranscriptSummary from '../TranscriptSummary';
import VideoItem from '../components/VideoItem';
import ThumbnailImage from '../components/ThumbnailImage';
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
  const [searchProgress, setSearchProgress] = useState(null);
  const [progressDetails, setProgressDetails] = useState('');
  const [summaryProgress, setSummaryProgress] = useState(0);

  const handleChannelParse = async () => {
    if (!channelUrl.trim()) {
      setError('Пожалуйста, введите ссылку на канал');
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      setError('Неверный формат ссылки на YouTube канал');
      setSearchProgress(null);
      setProgressDetails('');
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
      setSearchProgress(null);
      setProgressDetails('');
      return;
    }
    
    console.log(`\n🚀 [CHANNEL] Getting videos for channel: "${channelUrl}" with limit: ${selectedVideoCount}`);
    setIsLoadingVideos(true);
    setChannelVideosResults(null);
    setSummaryData(null);
    setError(null);
    setSearchProgress('searching');
    setProgressDetails('Getting channel video list...');
    
    let channelCompleted = false;
    
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
      
      setSearchProgress('filtering');
      setProgressDetails(`Getting information about ${videoIds.length} videos...`);
      
      // Получаем полную информацию о видео через Supadata инкрементально
      console.log(`📝 [CHANNEL] Getting full video info for ${videoIds.length} videos...`);
         
         const videosWithInfo = [];
         
         // Обрабатываем видео по одному для инкрементального отображения
         for (let i = 0; i < videoIds.length; i++) {
           const videoId = videoIds[i];
           console.log(`📝 [CHANNEL] Processing video ${i + 1}/${videoIds.length}: ${videoId}`);
           
           try {
             const videoInfo = await supadata.youtube.video({
               id: videoId
             });
             
             const video = {
               videoId: videoId,
               title: videoInfo.title || `Video ${videoId}`,
               author: videoInfo.channel?.name || parsingResults.channelName,
               duration: videoInfo.duration || 'N/A',
               url: `https://youtube.com/watch?v=${videoId}`,
               thumbnail: videoInfo.thumbnail || `https://img.youtube.com/vi/${videoId}/default.jpg`,
               views: videoInfo.viewCount || 'N/A',
               publishedAt: videoInfo.uploadDate || 'N/A'
             };
             
             videosWithInfo.push(video);
             
             // Немедленно обновляем состояние для отображения видео
             setChannelVideosResults(prev => ({
               videos: [...videosWithInfo],
               totalCount: videosWithInfo.length
             }));
             
             console.log(`✅ [CHANNEL] Video ${i + 1}/${videoIds.length} added to display:`, video.title);
             
           } catch (error) {
             console.warn(`⚠️ [CHANNEL] Failed to get info for video ${videoId}:`, error);
             // Fallback если не удалось получить информацию
             const fallbackVideo = {
               videoId: videoId,
               title: `Video ${videoId}`,
               author: parsingResults.channelName,
               duration: 'N/A',
               url: `https://youtube.com/watch?v=${videoId}`,
               thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
               views: 'N/A',
               publishedAt: 'N/A'
             };
             
             videosWithInfo.push(fallbackVideo);
             
             // Немедленно обновляем состояние для отображения видео
             setChannelVideosResults(prev => ({
               videos: [...videosWithInfo],
               totalCount: videosWithInfo.length
             }));
             
             console.log(`⚠️ [CHANNEL] Fallback video ${i + 1}/${videoIds.length} added to display:`, fallbackVideo.title);
           }
         }
        
        console.log(`✅ [CHANNEL] Full video info received for all ${videosWithInfo.length} videos`);
       
        // Теперь получаем transcriptы инкрементально
        console.log(`📝 [CHANNEL] Getting transcripts for ${videosWithInfo.length} videos...`);
        setSearchProgress('transcribing');
        setProgressDetails(`Preparing to get transcripts for ${videosWithInfo.length} videos...`);
        const videosWithTranscripts = await addTranscriptsToVideos(videosWithInfo, (updatedVideos) => {
          // Callback для обновления состояния при получении каждого transcript
          setChannelVideosResults(prev => ({
            videos: updatedVideos,
            totalCount: updatedVideos.length
          }));
        }, (stepProgress) => {
          // Callback для обновления прогресса шага
          setProgressDetails(stepProgress.details);
        });
       
               // Финальное обновление состояния
        setChannelVideosResults({
          videos: videosWithTranscripts,
          totalCount: videosWithTranscripts.length
        });
        
                                   // Step 4: Show summarizing step (резюме создается автоматически в TranscriptSummary)
          setSearchProgress('summarizing');
          setProgressDetails(`Creating summary based on ${videosWithTranscripts.filter(v => v.transcript).length} transcripts...`);
          setSummaryProgress(0);
          
          // НЕ делаем анимацию здесь - прогресс будет обновляться через callback из TranscriptSummary
      
      console.log(`✅ [CHANNEL] Channel videos with transcripts received successfully:`, videosWithTranscripts);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error getting channel videos:', error);
      setError('Error getting channel videos. Please try again.');
      setSearchProgress(null);
      setProgressDetails('');
      channelCompleted = true;
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel videos request completed`);
      setIsLoadingVideos(false);
      // НЕ сбрасываем прогресс здесь - он будет сброшен в handleSummaryComplete после создания резюме
    }
  };

  const handleSummaryComplete = async (summaryResult) => {
    console.log(`📋 [CHANNEL] Summary completed:`, summaryResult);
    setSummaryData(summaryResult);
    
    // Сбрасываем прогресс-индикатор после завершения создания резюме
    setTimeout(() => {
      setSearchProgress(null);
      setProgressDetails('');
      setSummaryProgress(0);
    }, 1000);
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
            placeholder="Paste channel link..."
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

      {/* Индикатор прогресса поиска */}
      {searchProgress && (
        <SearchProgress 
          currentStep={searchProgress}
          stepDetails={progressDetails}
          progressPercentage={summaryProgress}
        />
      )}

      {/* Основной контент */}
      <div className="main-content">
        <div className="channel-results">
          {parsingResults ? (
            <div className="results-section">
              <div className="channel-info">
                {/* Кнопки управления - перемещены наверх контейнера channel-info */}
                <div className="channel-actions-top">
                                     <h2>📺 Channel Information</h2>
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
                      {isLoadingVideos ? 'Getting...' : 'Get Videos'}
                    </button>
                  </div>
                </div>
                <div className="channel-info-content">
                  <div className="channel-details">
                    <div className="detail-item">
                      <span className="detail-label">Channel name:</span>
                      <span className="detail-value">{parsingResults.channelName || 'Not found'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Subscribers:</span>
                      <span className="detail-value">{parsingResults.subscriberCount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Number of videos:</span>
                      <span className="detail-value">{parsingResults.videoCount}</span>
                    </div>
                    {parsingResults.description && (
                      <div className="detail-item">
                        <span className="detail-label">Description:</span>
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
                    <h2>📋 General Summary</h2>
                    
                                         {/* Показываем компонент для создания резюме */}
                     {channelVideosResults.videos && channelVideosResults.videos.length > 0 && (
                       <TranscriptSummary 
                         videos={channelVideosResults.videos}
                         userQuery={`Канал: ${parsingResults.channelName}`}
                         onSummaryComplete={handleSummaryComplete}
                         onProgressUpdate={setSummaryProgress}
                       />
                     )}

                    {/* Отображение готового резюме */}
                    {summaryData && (
                      <div className="summary-display">
                        <div className="summary-stats">
                          <div className="stat-item">
                            <span className="stat-label">Total results:</span>
                            <span className="stat-value">{summaryData.totalResults}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Transcripts found:</span>
                            <span className="stat-value">{summaryData.transcriptCount}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Channel:</span>
                            <span className="stat-value">{parsingResults.channelName}</span>
                          </div>
                        </div>

                        <div className="summary-content">
                          <h4>📋 Channel Summary: "{parsingResults.channelName}"</h4>
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
                        <p>Click "Get Videos" to see the general summary for all transcripts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка - Найденные видео */}
                <div className="right-column">
                  <div className="videos-section">
                    <h2>📺 Found Videos ({channelVideosResults.totalCount})</h2>
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
                <h2>📋 Video List ({parsingResults.videos.length})</h2>
                <div className="videos-list">
                  {parsingResults.videos.map((video, index) => (
                    <div key={index} className="video-item">
                      <div className="video-header">
                        <h4>{video.title}</h4>
                        <ThumbnailImage
                          src={video.thumbnail} 
                          alt={video.title}
                          className="video-thumbnail"
                          fallbackIcon="🎬"
                          maxRetries={2}
                          retryDelay={1000}
                        />
                      </div>
                      <div className="video-details">
                        <p>👁️ Views: {video.views}</p>
                        <p>📅 Published: {video.publishedAt}</p>
                        <p>⏱️ Duration: {video.duration}</p>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-link">
                          Watch on YouTube
                        </a>
                        {video.transcript && (
                          <details>
                            <summary>► Show transcript</summary>
                            <div className="transcript-content">
                              {typeof video.transcript === 'string' ? video.transcript : 'Transcript unavailable'}
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
              <p>Paste a YouTube channel link to start parsing</p>
                              <p className="placeholder-examples">
                  Examples of supported formats:<br/>
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