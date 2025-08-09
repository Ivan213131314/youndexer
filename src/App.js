import React, { useState, useEffect, useCallback } from 'react';
import { fetchVideosByPhrase, searchVideosWithPhrases, addTranscriptsToVideos } from './ytSearchModule';
import { filterVideosWithGPT, getFilteredVideos } from './videoFilter';
import TranscriptSummary from './TranscriptSummary';
import LLMChoose from './components/LLMChoose';
import History from './history/History';
import AboutUs from './AboutUs';
import Navigation from './components/Navigation';

import VideoItem from './components/VideoItem';
import DefaultQuery from './components/DefaultQuery';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { saveSearchToHistory } from './history/historyService';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { parseChannel, validateChannelUrl } from './channel-parsing/channelService';
import './App.css';

const videoSearchCountPerRequest = 10;

function AppContent() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [leftColumnWidth, setLeftColumnWidth] = useState(50); // процент от общей ширины
  const [currentPage, setCurrentPage] = useState('main'); // 'main', 'history' или 'about'
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o'); // выбранная LLM модель
  const [searchMode, setSearchMode] = useState('request'); // 'request' или 'parsing'
  
  // Состояния для парсинга каналов
  const [channelUrl, setChannelUrl] = useState('');
  const [parsingResults, setParsingResults] = useState(null);
  const [channelVideosResults, setChannelVideosResults] = useState(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideoCount, setSelectedVideoCount] = useState(10);
  const [channelError, setChannelError] = useState(null);
  const [channelSummaryData, setChannelSummaryData] = useState(null);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);





  // Функция для извлечения videoId из YouTube URL
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Функция для получения информации о видео
  const fetchVideoInfo = async (videoId) => {
    const YOUTUBE_API_KEY = 'AIzaSyCs3QZxVnZBltP2tn2_v8IkbK0_03zoaTU';
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics&id=${videoId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Ошибка при получении информации о видео');
    }
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Видео не найдено');
    }
    
    const videoData = data.items[0];
    return {
      id: videoId,
      videoId: videoId,
      title: videoData.snippet.title,
      description: videoData.snippet.description,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: videoData.snippet.thumbnails?.high?.url || videoData.snippet.thumbnails?.default?.url || '',
      author: videoData.snippet.channelTitle,
      publishedAt: videoData.snippet.publishedAt,
      duration: videoData.contentDetails.duration,
      views: videoData.statistics?.viewCount || 'Неизвестно',
      transcript: null
    };
  };

  // Функция для получения транскрипции
  const fetchTranscript = async (videoId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId })
      });

      if (!response.ok) {
        // Проверяем тип контента
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Сервер недоступен или эндпоинт не найден');
        }
        
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при получении транскрипции');
        } catch (jsonError) {
          throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (data.success && data.transcript) {
        // Преобразуем транскрипцию в строку если она пришла в формате массива
        if (Array.isArray(data.transcript)) {
          return data.transcript.map(item => item.text).join(' ');
        } else if (typeof data.transcript === 'string') {
          return data.transcript;
        } else {
          return JSON.stringify(data.transcript);
        }
      } else {
        throw new Error(data.error || 'Транскрипция недоступна');
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Сервер недоступен. Убедитесь что сервер запущен на порту 3001');
      }
      throw error;
    }
  };

  // Функция для загрузки дефолтного запроса
  const handleLoadDefaultQuery = useCallback(async (defaultQueryData) => {
    try {
      setIsLoadingDefault(true);
      console.log('🔄 [APP] Loading default query data:', defaultQueryData);

      // Устанавливаем запрос и результаты из истории
      setQuery(defaultQueryData.query);
      setSearchResults(defaultQueryData.searchResults || []);
      setSummaryData(defaultQueryData.summaryData || null);

      console.log('✅ [APP] Default query loaded successfully');
    } catch (error) {
      console.error('❌ [APP] Error loading default query:', error);
    } finally {
      setIsLoadingDefault(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      console.log('❌ [APP] Empty query provided');
      return;
    }
    
    console.log(`\n🚀 [APP] Starting search process for query: "${query}"`);
    setIsLoading(true);
    setSearchResults(null);
    setSummaryData(null);
    
    try {
      // Обычный поиск по запросу
      console.log(`\n🔍 [APP] Regular search for query: "${query}"`);
      const allVideos = await searchVideosWithPhrases([query], videoSearchCountPerRequest);
      
      // Проверяем, что получили результаты
      if (!allVideos || allVideos.length === 0) {
        console.log(`❌ [APP] No videos found for query`);
        return;
      }
        
        console.log(`\n🎉 [APP] Search Results:`);
        console.log(`- Total unique videos found: ${allVideos.length}`);
        console.log(`- All videos:`, allVideos);
        
        // Show duplicate analysis
        console.log(`\n🔄 [APP] Duplicate Analysis:`);
        const duplicateStats = {};
        allVideos.forEach(video => {
          const count = video.duplicateCount || 1;
          duplicateStats[count] = (duplicateStats[count] || 0) + 1;
        });
        
        Object.entries(duplicateStats).forEach(([count, videos]) => {
          console.log(`   - ${videos} videos appear ${count} time(s)`);
        });
        
                     // Show videos with duplicates
             const videosWithDuplicates = allVideos.filter(video => (video.duplicateCount || 1) > 1);
             if (videosWithDuplicates.length > 0) {
               console.log(`\n📺 [APP] Videos that appear multiple times:`);
               videosWithDuplicates.forEach(video => {
                 console.log(`   - "${video.title}" appears ${video.duplicateCount} times`);
               });
             }

             // Step 2: Filter videos with GPT (всегда используем GPT модель)
             console.log(`\n🤖 [APP] Starting GPT filtering...`);
             const relevantIds = await filterVideosWithGPT(allVideos, query, 'openai/gpt-4o');
             
             if (relevantIds.length > 0) {
               const filteredVideos = getFilteredVideos(allVideos, relevantIds);
               console.log(`\n🎯 [APP] GPT Filtering Results:`);
               console.log(`- Original videos: ${allVideos.length}`);
               console.log(`- Filtered videos: ${filteredVideos.length}`);
               console.log(`- Filtered video details:`, filteredVideos);
               
               // Step 3: Get transcripts for filtered videos
               console.log(`\n📝 [APP] Getting transcripts for ${filteredVideos.length} filtered videos...`);
               
               // Сначала отображаем видео без transcriptов
               setSearchResults(filteredVideos.map(video => ({
                 ...video,
                 transcript: null,
                 // Убеждаемся что есть все необходимые поля
                 thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/default.jpg`,
                 url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
                 author: video.author || video.channelTitle || 'Unknown Channel',
                 duration: video.duration || 'N/A',
                 views: video.views || 'N/A',
                 publishedAt: video.publishedAt || 'N/A'
               })));
               
               // Затем получаем transcriptы инкрементально
               const videosWithTranscripts = await addTranscriptsToVideos(filteredVideos, (updatedVideos) => {
                 // Callback для обновления состояния при получении каждого transcript
                 setSearchResults(updatedVideos);
               });
               
               console.log(`\n📊 [APP] Final Results with Transcripts:`);
               console.log(`- Videos with transcripts: ${videosWithTranscripts.filter(v => v.transcript).length}`);
               console.log(`- Videos without transcripts: ${videosWithTranscripts.filter(v => !v.transcript).length}`);
               console.log(`\n🎬 [APP] Complete video objects with transcripts:`, videosWithTranscripts);
               
               // Финальное обновление состояния
               setSearchResults(videosWithTranscripts);
             } else {
               console.log(`\n⚠️ [APP] GPT filtering failed or returned no results`);
             }
      
    } catch (error) {
      console.error('❌ [APP] Error in search process:', error);
      console.error('🔍 [APP] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      console.log(`\n🏁 [APP] Search process completed`);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSummaryComplete = async (summaryResult) => {
    console.log('🎉 [APP] Summary completed:', summaryResult);
    
    // Сохраняем результат в соответствующее состояние в зависимости от режима
    if (searchMode === 'request') {
      setSummaryData(summaryResult);
      
      // Сохраняем результаты в историю
      try {
        const searchData = {
          query: query,
          searchResults: searchResults,
          summaryData: summaryResult
        };
        
        const historyId = await saveSearchToHistory(searchData);
        if (historyId) {
          console.log('✅ [APP] Search saved to history with ID:', historyId);
        } else {
          console.log('⚠️ [APP] Failed to save to history, but continuing...');
        }
      } catch (error) {
        console.error('❌ [APP] Error saving to history:', error);
      }
    } else {
      // Режим парсинга видео или каналов
      setChannelSummaryData(summaryResult);
    }
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    
    // Ограничиваем ширину от 30% до 70% для предотвращения "плывущих" элементов
    const clampedPercentage = Math.max(30, Math.min(70, percentage));
    setLeftColumnWidth(clampedPercentage);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Функции навигации теперь обрабатываются через компонент Navigation

  // Функции для парсинга видео или каналов
  const handleVideoOrChannelParse = async () => {
    if (!channelUrl.trim()) {
      setChannelError('Пожалуйста, введите ссылку на видео или канал');
      return;
    }
    
    console.log(`\n🚀 [PARSING] Starting parsing for URL: "${channelUrl}"`);
    setIsLoading(true);
    setParsingResults(null);
    setChannelError(null);
    
    try {
      // Проверяем, является ли запрос YouTube URL видео
      const videoId = extractVideoId(channelUrl);
      
      if (videoId) {
        // Это YouTube URL видео - обрабатываем как конкретное видео
        console.log(`\n🎯 [PARSING] YouTube video URL detected, video ID: ${videoId}`);
        
        // Получаем информацию о видео
        const videoInfo = await fetchVideoInfo(videoId);
        console.log('✅ [PARSING] Video info obtained:', videoInfo);
        
        // Получаем транскрипцию
        console.log('📝 [PARSING] Getting transcript...');
        let transcript = null;
        
        try {
          transcript = await fetchTranscript(videoId);
          console.log('✅ [PARSING] Transcript obtained');
        } catch (transcriptError) {
          console.warn('⚠️ [PARSING] Could not get transcript:', transcriptError.message);
          // Показываем видео без транскрипции
        }
        
        const videoWithTranscript = {
          ...videoInfo,
          transcript: transcript
        };
        
        // Устанавливаем результаты как для отдельного видео
        setChannelVideosResults({
          videos: [videoWithTranscript],
          totalCount: 1
        });
        
        // Создаем фиктивные результаты парсинга для отображения
        setParsingResults({
          channelName: videoInfo.author,
          videoCount: 1,
          subscriberCount: null,
          description: null
        });
        
        return;
      }
      
      // Проверяем, является ли это ссылкой на канал
      if (!validateChannelUrl(channelUrl)) {
        setChannelError('Неверный формат ссылки на YouTube видео или канал');
        return;
      }
      
      // Это канал - используем существующую логику парсинга каналов
      console.log(`\n📺 [PARSING] Channel URL detected, starting channel parsing`);
      const results = await parseChannel(channelUrl);
      setParsingResults(results);
      // Очищаем результаты видео при парсинге канала
      setChannelVideosResults(null);
      setChannelSummaryData(null);
      console.log(`✅ [PARSING] Channel parsed successfully:`, results);
      
    } catch (error) {
      console.error('❌ [PARSING] Error in parsing:', error);
      setChannelError('Ошибка при обработке ссылки. Попробуйте еще раз.');
    } finally {
      console.log(`\n🏁 [PARSING] Parsing completed`);
      setIsLoading(false);
    }
  };

  const handleGetVideos = async () => {
    if (!channelUrl.trim()) {
      setChannelError('Пожалуйста, введите ссылку на канал');
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      setChannelError('Неверный формат ссылки на YouTube канал');
      return;
    }
    
    console.log(`\n🚀 [CHANNEL] Getting videos for channel: "${channelUrl}" with limit: ${selectedVideoCount}`);
    setIsLoadingVideos(true);
    setChannelVideosResults(null);
    setChannelSummaryData(null);
    setChannelError(null);
    
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
      const videosWithTranscripts = await addTranscriptsToVideos(videosWithInfo, (updatedVideos) => {
        // Callback для обновления состояния при получении каждого transcript
        setChannelVideosResults(prev => ({
          videos: updatedVideos,
          totalCount: updatedVideos.length
        }));
      });
      
      // Финальное обновление состояния
      setChannelVideosResults({
        videos: videosWithTranscripts,
        totalCount: videosWithTranscripts.length
      });
      
      console.log(`✅ [CHANNEL] Channel videos with transcripts received successfully:`, videosWithTranscripts);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error getting channel videos:', error);
      setChannelError('Ошибка при получении видео канала. Попробуйте еще раз.');
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel videos request completed`);
      setIsLoadingVideos(false);
    }
  };

  const handleChannelSummaryComplete = async (summaryResult) => {
    console.log(`📋 [CHANNEL] Summary completed:`, summaryResult);
    setChannelSummaryData(summaryResult);
    
    // Сохраняем результаты парсинга в историю
    try {
      let queryTitle;
      if (channelVideosResults && channelVideosResults.totalCount === 1) {
        // Это отдельное видео
        const videoTitle = channelVideosResults.videos[0]?.title || 'Unknown Video';
        queryTitle = `Video: ${videoTitle}`;
      } else {
        // Это канал
        const channelName = parsingResults?.channelName || 'Unknown Channel';
        queryTitle = `Channel: ${channelName}`;
      }
      
      const searchData = {
        query: queryTitle,
        searchResults: channelVideosResults?.videos || [],
        summaryData: summaryResult
      };
      
      const historyId = await saveSearchToHistory(searchData);
      if (historyId) {
        console.log('✅ [APP] Parsing results saved to history with ID:', historyId);
      } else {
        console.log('⚠️ [APP] Failed to save parsing results to history, but continuing...');
      }
    } catch (error) {
      console.error('❌ [APP] Error saving parsing results to history:', error);
    }
  };

  const handleChannelKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVideoOrChannelParse();
    }
  };

  return (
    <div className="App">
      <DefaultQuery onLoadDefaultQuery={handleLoadDefaultQuery} />
      {/* Навигация доступна на всех страницах */}
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      
      {currentPage === 'history' ? (
        <History />
      ) : currentPage === 'about' ? (
        <AboutUs />
      ) : (
        <>

          <div className="header">
            <h1 className="main-heading">YouTube Semantic Searcher</h1>
            <div className="search-box">
              <div className="search-input-group">
                <div className="search-input-row">
                  <input
                    type="text"
                    className="search-input"
                    placeholder={searchMode === 'request' ? "Write your request..." : "Paste YouTube video or channel URL..."}
                    value={searchMode === 'request' ? query : channelUrl}
                                     onChange={(e) => {
                       if (searchMode === 'request') {
                         const newValue = e.target.value;
                         setQuery(newValue);
                         setChannelError(null); // Очищаем ошибку при изменении запроса
                         
                         // Проверяем, является ли введенное значение YouTube URL
                         const videoId = extractVideoId(newValue);
                         const isChannelUrl = validateChannelUrl(newValue);
                         
                         if (videoId || isChannelUrl) {
                           // Автоматически переключаемся на режим parsing
                           setSearchMode('parsing');
                           setChannelUrl(newValue);
                           setQuery(''); // Очищаем поле запроса
                           console.log(`🔄 [APP] Auto-switched to parsing mode for URL: ${newValue}`);
                         }
                       } else {
                         setChannelUrl(e.target.value);
                         setChannelError(null); // Очищаем ошибку при изменении URL
                       }
                     }}
                    onKeyPress={searchMode === 'request' ? handleKeyPress : handleChannelKeyPress}
                    disabled={isLoading}
                  />
                  <button 
                    className="search-button"
                    onClick={searchMode === 'request' ? handleSearch : handleVideoOrChannelParse}
                    disabled={isLoading}
                  >
                    {isLoading ? (searchMode === 'request' ? 'Searching...' : 'Parsing...') : (searchMode === 'request' ? 'Search' : 'Parse')}
                  </button>
                </div>
                <div className="search-mode-toggle">
                                   <button
                     className={`toggle-button ${searchMode === 'request' ? 'active' : ''}`}
                     onClick={() => {
                       setSearchMode('request');
                       setChannelError(null);
                     }}
                     disabled={isLoading}
                   >
                     Write your request
                   </button>
                   <button
                     className={`toggle-button ${searchMode === 'parsing' ? 'active' : ''}`}
                     onClick={() => {
                       setSearchMode('parsing');
                       setChannelError(null);
                     }}
                     disabled={isLoading}
                   >
                     Summorise video or channel
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* LLM Model Selector */}
          <div className="llm-selector-section">
            <LLMChoose 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>

                     {/* Сообщение об ошибке */}
           {channelError && (
             <div className="error-message">
               <p>{channelError}</p>
             </div>
           )}

                    {/* Основной контент */}
          {searchMode === 'request' ? (
            // Интерфейс для обычного поиска
            <div 
              className="main-content"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Левая колонка - Общий вывод */}
              <div 
                className="left-column"
                style={{ width: `${leftColumnWidth}%` }}
              >
                <div className="summary-section">
                  <div className="summary-header">
                    <h2>📋 Общий вывод</h2>
                    {searchResults && searchResults.length > 0 && (
                      <button 
                        className="summary-button"
                        onClick={() => {
                          // Находим кнопку в TranscriptSummary и кликаем по ней
                          const summaryButton = document.querySelector('.transcript-summary .summary-button');
                          if (summaryButton) {
                            summaryButton.click();
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Создаем резюме...' : 'Создать резюме'}
                      </button>
                    )}
                  </div>
                  
                  {/* Показываем компонент для создания резюме */}
                  {searchResults && searchResults.length > 0 && (
                    <TranscriptSummary 
                      videos={searchResults}
                      userQuery={query}
                      onSummaryComplete={handleSummaryComplete}
                      selectedModel={selectedModel}
                      summaryData={summaryData}
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
                      </div>

                      <div className="summary-content">
                        <h4>📋 Резюме по запросу: "{query}"</h4>
                        <div className="summary-text">
                          {summaryData.summary.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Плейсхолдер когда нет данных */}
                  {!summaryData && !searchResults && (
                    <div className="placeholder">
                      <p>Выполните поиск, чтобы увидеть общий вывод по всем транскриптам</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Разделитель колонок */}
              <div 
                className="column-resizer"
                onMouseDown={handleMouseDown}
              ></div>

              {/* Правая колонка - Отдельные видео */}
              <div className="right-column">
                <div className="videos-section">
                  <h2>📺 Найденные видео</h2>
                  
                  {searchResults ? (
                    <div className="videos-list">
                      {searchResults.map((video, index) => (
                        <VideoItem key={index} video={video} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="placeholder">
                      <p>Результаты поиска появятся здесь</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Интерфейс для парсинга каналов
            <div className="main-content">
              <div className="channel-results">
                                    {parsingResults ? (
                      <div className="results-section">
                        <div className="channel-info">
                          {/* Кнопки управления */}
                          <div className="channel-actions-top">
                            <div className="channel-header-left">
                              <h2>📺 Информация о {channelVideosResults && channelVideosResults.totalCount === 1 ? 'видео' : 'канале'}</h2>
                              {parsingResults && (
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
                              )}
                            </div>
                            {/* Channel Thumbnail */}
                            {parsingResults.channelThumbnail && (
                              <div className="channel-thumbnail-preview-container">
                                <img 
                                  src={parsingResults.channelThumbnail} 
                                  alt={`${parsingResults.channelName} thumbnail`}
                                  className="channel-thumbnail-preview"
                                  onLoad={() => console.log('✅ [CHANNEL] Thumbnail loaded successfully')}
                                  onError={(e) => console.error('❌ [CHANNEL] Failed to load thumbnail:', e.target.src)}
                                />
                              </div>
                            )}
                          </div>
                                              <div className="channel-info-content">
                          <div className="channel-details">
                            <div className="detail-item">
                              <span className="detail-label">{channelVideosResults && channelVideosResults.totalCount === 1 ? 'Автор:' : 'Название канала:'}</span>
                              <span className="detail-value">{parsingResults.channelName || 'Не найдено'}</span>
                            </div>
                            {channelVideosResults && channelVideosResults.totalCount === 1 ? (
                              // Для отдельного видео показываем информацию о видео
                              <>
                                <div className="detail-item">
                                  <span className="detail-label">Название видео:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.title || 'Не найдено'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Просмотры:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.views || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Длительность:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.duration || 'N/A'}</span>
                                </div>
                              </>
                            ) : (
                              // Для канала показываем информацию о канале
                              <>
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
                              </>
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
                                <h2>📋 Общий вывод {channelVideosResults.totalCount === 1 ? 'по видео' : 'по каналу'}</h2>
                            
                            {/* Показываем компонент для создания резюме */}
                            {channelVideosResults.videos && channelVideosResults.videos.length > 0 && (
                              <TranscriptSummary 
                                videos={channelVideosResults.videos}
                                userQuery={`Канал: ${parsingResults.channelName}`}
                                onSummaryComplete={handleChannelSummaryComplete}
                                selectedModel={selectedModel}
                                summaryData={channelSummaryData}
                              />
                            )}

                            {/* Отображение готового резюме */}
                            {channelSummaryData && (
                              <div className="summary-display">
                                <div className="summary-stats">
                                  <div className="stat-item">
                                    <span className="stat-label">Всего результатов:</span>
                                    <span className="stat-value">{channelSummaryData.totalResults}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Transcript найдено:</span>
                                    <span className="stat-value">{channelSummaryData.transcriptCount}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Канал:</span>
                                    <span className="stat-value">{parsingResults.channelName}</span>
                                  </div>
                                </div>

                                <div className="summary-content">
                                  <h4>📋 Резюме канала: "{parsingResults.channelName}"</h4>
                                  <div className="summary-text">
                                    {channelSummaryData.summary.split('\n').map((line, index) => (
                                      <p key={index}>{line}</p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Плейсхолдер когда нет данных */}
                            {!channelSummaryData && (
                              <div className="placeholder">
                                <p>Нажмите "Получить видео" чтобы увидеть общий вывод по всем транскриптам</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Правая колонка - Найденные видео */}
                        <div className="right-column">
                          <div className="videos-section">
                            <h2>📺 {channelVideosResults.totalCount === 1 ? 'Видео' : 'Найденные видео'} ({channelVideosResults.totalCount})</h2>
                            <div className="videos-list">
                              {channelVideosResults.videos.map((video, index) => (
                                <VideoItem key={index} video={video} index={index} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="placeholder">
                    <p>Вставьте ссылку на YouTube видео или канал для начала парсинга</p>
                    <p className="placeholder-examples">
                      Примеры поддерживаемых форматов:<br/>
                      <strong>Видео:</strong><br/>
                      • https://youtube.com/watch?v=VIDEO_ID<br/>
                      • https://youtu.be/VIDEO_ID<br/>
                      <strong>Каналы:</strong><br/>
                      • https://youtube.com/channel/UC...<br/>
                      • https://youtube.com/c/ChannelName<br/>
                      • https://youtube.com/@username<br/>
                      • https://youtube.com/user/username
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
