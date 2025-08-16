import React, { useState, useEffect, useCallback } from 'react';
import { fetchVideosByPhrase, searchVideosWithPhrases, addTranscriptsToVideos } from './ytSearchModule';
import { filterVideosWithGPT, getFilteredVideos } from './videoFilter';
import TranscriptSummary from './TranscriptSummary';
import History from './history/History';
import AboutUs from './AboutUs';
import Navigation from './components/Navigation';
import SearchProgress from './components/SearchProgress';
import Paywall from './components/Paywall';
import RequestLimitModal from './components/RequestLimitModal';
import AuthModal from './auth/AuthModal';
import { canMakeRequest, incrementRequestCount, getRemainingRequests, getUsedRequestsToday, resetRequestCount } from './utils/requestLimiter';
import { consumeToken, canUseToken } from './utils/tokenService';

import VideoItem from './components/VideoItem';
import DefaultQuery from './components/DefaultQuery';
import ThumbnailImage from './components/ThumbnailImage';

import TokenLimitModal from './components/TokenLimitModal';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { saveSearchToHistory, updateHistoryItem } from './history/historyService';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { parseChannel, validateChannelUrl } from './channel-parsing/channelService';
import './App.css';

const videoSearchCountPerRequest = 20;

function AppContent() {
  const { user, userTokens, setUserTokens } = useAuth(); // Добавляем авторизацию и токены
  const [currentPage, setCurrentPage] = useState('main');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [searchMode, setSearchMode] = useState('request');
  const [channelUrl, setChannelUrl] = useState('');
  const [channelError, setChannelError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('tngtech/deepseek-r1t2-chimera:free');
  const [leftColumnWidth, setLeftColumnWidth] = useState(70);
  const [parsingLeftColumnWidth, setParsingLeftColumnWidth] = useState(70); // 70% для левой колонки, 30% для правой
  const [isResizing, setIsResizing] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideoCount, setSelectedVideoCount] = useState(10);
  const [channelSummaryData, setChannelSummaryData] = useState(null);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [parsingResults, setParsingResults] = useState(null);
  const [channelVideosResults, setChannelVideosResults] = useState(null);
  const [currentParsingHistoryId, setCurrentParsingHistoryId] = useState(null);
  const [proModel, setProModel] = useState(false);
  const [detailedSummary, setDetailedSummary] = useState(false);
  const [searchProgress, setSearchProgress] = useState(null);
  const [progressDetails, setProgressDetails] = useState('');
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRequestLimit, setShowRequestLimit] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [showTokenLimit, setShowTokenLimit] = useState(false);
  const [requestCount, setRequestCount] = useState(getUsedRequestsToday());

  // Обработчики для Paywall
  const handleSubscribe = async (planId) => {
    console.log('Подписка на план:', planId);
    // Здесь будет логика обработки подписки
    setShowPaywall(false);
  };

  const handleClosePaywall = () => {
    setShowPaywall(false);
  };

  // Обработчики для RequestLimitModal
  const handleCloseRequestLimit = () => {
    setShowRequestLimit(false);
  };

  const handleUpgradeFromLimit = () => {
    setShowRequestLimit(false);
    setShowPaywall(true);
  };

  // Обработчики для TokenLimitModal
  const handleCloseTokenLimit = () => {
    setShowTokenLimit(false);
  };

  const handleUpgradeFromTokenLimit = () => {
    setShowTokenLimit(false);
    setShowPaywall(true);
  };

  // Обработчики для AuthModal
  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const showLoginModal = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  // Эффект для автоматического переключения модели при изменении proModel
  useEffect(() => {
    if (proModel) {
      setSelectedModel('google/gemini-2.0-flash-lite-001');
    } else {
      setSelectedModel('tngtech/deepseek-r1t2-chimera:free');
    }
  }, [proModel]);

  // Эффект для обновления счетчика запросов при изменении даты
  useEffect(() => {
    const updateRequestCount = () => {
      setRequestCount(getUsedRequestsToday());
    };

    // Обновляем счетчик при загрузке компонента
    updateRequestCount();

    // Проверяем обновление каждый час (на случай смены даты)
    const interval = setInterval(updateRequestCount, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);





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
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/transcript'
        : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/transcript`;
      const response = await fetch(apiUrl, {
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

    // Проверка авторизации
    if (!user) {
      console.log('❌ [APP] User not authenticated');
      showLoginModal();
      return;
    }

    // Проверка токенов
    const canUseTokens = await canUseToken(user.uid);
    if (!canUseTokens) {
      console.log('❌ [APP] No tokens available');
      setShowTokenLimit(true);
      return;
    }

    // Используем токен
    const tokenUsed = await consumeToken(user.uid);
    if (!tokenUsed) {
      console.log('❌ [APP] Failed to use token');
      setShowTokenLimit(true);
      return;
    }

    // Обновляем токены в контексте
    if (userTokens) {
      setUserTokens({
        ...userTokens,
        tokens: userTokens.subscription === 'lifetime' ? userTokens.tokens : userTokens.tokens - 1,
        totalTokensUsed: userTokens.totalTokensUsed + 1
      });
    }
    
    console.log(`\n🚀 [APP] Starting search process for query: "${query}"`);
    setIsLoading(true);
    setSearchResults(null);
    setSummaryData(null);
    setSearchProgress('searching');
    setProgressDetails('Поиск релевантных видео...');
    setSummaryProgress(0);
    
    // Анимация прогресса для поиска
    const searchProgressInterval = setInterval(() => {
      setSummaryProgress(prev => {
        if (prev >= 25) {
          clearInterval(searchProgressInterval);
          return 25;
        }
        return prev + 5;
      });
    }, 100);
    
    let searchCompleted = false;
    
    try {
      // Обычный поиск по запросу
      console.log(`\n🔍 [APP] Regular search for query: "${query}"`);
      setProgressDetails(`Найдено ${videoSearchCountPerRequest} видео, проверяем релевантность...`);
      let allVideos = await searchVideosWithPhrases([query], videoSearchCountPerRequest);
      
      // Проверяем, что получили результаты
      if (!allVideos || allVideos.length === 0) {
        console.log(`❌ [APP] No videos found for query, retrying...`);
        
        // Повторяем запрос еще раз
        const retryVideos = await searchVideosWithPhrases([query], videoSearchCountPerRequest);
        
        if (!retryVideos || retryVideos.length === 0) {
          console.log(`❌ [APP] Still no videos found after retry`);
          setSearchProgress(null);
          setProgressDetails('');
          setSummaryProgress(0);
          return;
        }
        
        console.log(`✅ [APP] Found ${retryVideos.length} videos on retry`);
        allVideos = retryVideos;
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
             setSearchProgress('filtering');
             setProgressDetails(`Фильтрация ${allVideos.length} видео с помощью GPT...`);
             setSummaryProgress(25);
             
             // Анимация прогресса для фильтрации
             const filterProgressInterval = setInterval(() => {
               setSummaryProgress(prev => {
                 if (prev >= 50) {
                   clearInterval(filterProgressInterval);
                   return 50;
                 }
                 return prev + 5;
               });
             }, 150);
             const relevantIds = await filterVideosWithGPT(allVideos, query, 'openai/gpt-4o');
             
             if (relevantIds.length > 0) {
               const filteredVideos = getFilteredVideos(allVideos, relevantIds);
               console.log(`\n🎯 [APP] GPT Filtering Results:`);
               console.log(`- Original videos: ${allVideos.length}`);
               console.log(`- Filtered videos: ${filteredVideos.length}`);
               console.log(`- Filtered video details:`, filteredVideos);
               
               // Step 3: Get transcripts for filtered videos
               console.log(`\n📝 [APP] Getting transcripts for ${filteredVideos.length} filtered videos...`);
               setSearchProgress('transcribing');
               setProgressDetails(`Подготовка к получению транскрипций для ${filteredVideos.length} видео...`);
               setSummaryProgress(50);
               
               // Анимация прогресса для транскрипций
               const transcribeProgressInterval = setInterval(() => {
                 setSummaryProgress(prev => {
                   if (prev >= 75) {
                     clearInterval(transcribeProgressInterval);
                     return 75;
                   }
                   return prev + 3;
                 });
               }, 200);
               
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
               }, (stepProgress) => {
                 // Callback для обновления прогресса шага
                 setProgressDetails(stepProgress.details);
               });
               
               console.log(`\n📊 [APP] Final Results with Transcripts:`);
               console.log(`- Videos with transcripts: ${videosWithTranscripts.filter(v => v.transcript).length}`);
               console.log(`- Videos without transcripts: ${videosWithTranscripts.filter(v => !v.transcript).length}`);
               console.log(`\n🎬 [APP] Complete video objects with transcripts:`, videosWithTranscripts);
               
               // Финальное обновление состояния
               setSearchResults(videosWithTranscripts);
               
               // Step 4: Show summarizing step (резюме создается автоматически в TranscriptSummary)
               setSearchProgress('summarizing');
               setProgressDetails(`Создание резюме на основе ${videosWithTranscripts.filter(v => v.transcript).length} транскрипций...`);
               setSummaryProgress(75);
               
               // НЕ делаем анимацию здесь - прогресс будет обновляться через callback из TranscriptSummary
             } else {
               console.log(`\n⚠️ [APP] GPT filtering failed or returned no results`);
               setSearchProgress(null);
               setProgressDetails('');
               setSummaryProgress(0);
               searchCompleted = true;
             }
      
    } catch (error) {
      console.error('❌ [APP] Error in search process:', error);
      console.error('🔍 [APP] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setSearchProgress(null);
      setProgressDetails('');
    } finally {
      console.log(`\n🏁 [APP] Search process completed`);
      setIsLoading(false);
      
      // Счетчик уже был увеличен в начале функции
      
      // Сбрасываем прогресс если он еще не был сброшен (например, при ошибках или отсутствии результатов)
      if (searchProgress !== null) {
        setSearchProgress(null);
        setProgressDetails('');
        setSummaryProgress(0);
        console.log('🔄 [APP] Progress reset in finally block');
      }
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
        
        const historyId = await saveSearchToHistory(searchData, user?.uid);
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
    
    // Сбрасываем прогресс-индикатор после завершения создания резюме
    setSearchProgress(null);
    setProgressDetails('');
    setSummaryProgress(0);
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleParsingMouseDown = (e) => {
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
    
    // Определяем в каком режиме мы находимся и обновляем соответствующее состояние
    if (searchMode === 'request') {
      setLeftColumnWidth(clampedPercentage);
    } else {
      setParsingLeftColumnWidth(clampedPercentage);
    }
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

    // Проверка авторизации
    if (!user) {
      console.log('❌ [PARSING] User not authenticated');
      showLoginModal();
      return;
    }

    // Проверка токенов
    const canUseTokens = await canUseToken(user.uid);
    if (!canUseTokens) {
      console.log('❌ [PARSING] No tokens available');
      setShowTokenLimit(true);
      return;
    }

    // Используем токен
    const tokenUsed = await consumeToken(user.uid);
    if (!tokenUsed) {
      console.log('❌ [PARSING] Failed to use token');
      setShowTokenLimit(true);
      return;
    }

    // Обновляем токены в контексте
    if (userTokens) {
      setUserTokens({
        ...userTokens,
        tokens: userTokens.subscription === 'lifetime' ? userTokens.tokens : userTokens.tokens - 1,
        totalTokensUsed: userTokens.totalTokensUsed + 1
      });
    }
    
    console.log(`\n🚀 [PARSING] Starting parsing for URL: "${channelUrl}"`);
    setIsLoading(true);
    setParsingResults(null);
    setChannelError(null);
    setChannelSummaryData(null); // Очищаем предыдущее резюме
    setCurrentParsingHistoryId(null); // Сбрасываем ID предыдущего парсинга
    setSearchProgress('searching');
    setProgressDetails('Анализ ссылки...');
    
    let parsingCompleted = false;
    
    try {
      // Проверяем, является ли запрос YouTube URL видео
      const videoId = extractVideoId(channelUrl);
      
      if (videoId) {
        // Это YouTube URL видео - обрабатываем как конкретное видео
        console.log(`\n🎯 [PARSING] YouTube video URL detected, video ID: ${videoId}`);
        
        // Получаем информацию о видео
        setProgressDetails('Получение информации о видео...');
        const videoInfo = await fetchVideoInfo(videoId);
        console.log('✅ [PARSING] Video info obtained:', videoInfo);
        
        // Получаем транскрипцию
        console.log('📝 [PARSING] Getting transcript...');
        setSearchProgress('transcribing');
        setProgressDetails('Получение транскрипции видео...');
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
        
        // Сохраняем результаты парсинга видео в историю
        setSearchProgress('summarizing');
        setProgressDetails('Создание резюме на основе транскрипции...');
        setSummaryProgress(0);
        
        // Анимация прогресса создания резюме
        const progressInterval = setInterval(() => {
          setSummaryProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
        // Небольшая задержка чтобы пользователь увидел шаг создания резюме
        setTimeout(async () => {
          setSummaryProgress(100);
          setTimeout(async () => {
            parsingCompleted = true;
            await saveParsingToHistory([videoWithTranscript], true);
            // Убираем индикатор после сохранения в историю
            setSearchProgress(null);
            setProgressDetails('');
            setSummaryProgress(0);
          }, 500);
        }, 2000);
        
        return;
      }
      
      // Проверяем, является ли это ссылкой на канал
      if (!validateChannelUrl(channelUrl)) {
        setChannelError('Неверный формат ссылки на YouTube видео или канал');
        setSearchProgress(null);
        setProgressDetails('');
        return;
      }
      
      // Это канал - используем существующую логику парсинга каналов
      console.log(`\n📺 [PARSING] Channel URL detected, starting channel parsing`);
      setSearchProgress('filtering');
      setProgressDetails('Парсинг канала...');
      const results = await parseChannel(channelUrl);
      setParsingResults(results);
      // Очищаем результаты видео при парсинге канала
      setChannelVideosResults(null);
      setChannelSummaryData(null);
      
      // Показываем результат парсинга канала
      setSearchProgress('ready');
      setProgressDetails(`Готово! Канал "${results.channelName}" обработан`);
      setSummaryProgress(100);
      
      // Убираем индикатор через 2 секунды
      setTimeout(() => {
        setSearchProgress(null);
        setProgressDetails('');
        setSummaryProgress(0);
      }, 2000);
      
      parsingCompleted = true;
      console.log(`✅ [PARSING] Channel parsed successfully:`, results);
      
    } catch (error) {
      console.error('❌ [PARSING] Error in parsing:', error);
      setChannelError('Ошибка при обработке ссылки. Попробуйте еще раз.');
      setSearchProgress(null);
      setProgressDetails('');
      parsingCompleted = true;
    } finally {
      console.log(`\n🏁 [PARSING] Parsing completed`);
      setIsLoading(false);
      // НЕ сбрасываем прогресс здесь - он будет сброшен в setTimeout выше
    }
  };

  const handleGetVideos = async () => {
    if (!channelUrl.trim()) {
      setChannelError('Пожалуйста, введите ссылку на канал');
      return;
    }

    if (!validateChannelUrl(channelUrl)) {
      setChannelError('Неверный формат ссылки на YouTube канал');
      setSearchProgress(null);
      setProgressDetails('');
      return;
    }

    // Проверка авторизации
    if (!user) {
      console.log('❌ [CHANNEL] User not authenticated');
      showLoginModal();
      return;
    }

    // Проверка лимита запросов (только для не-pro пользователей)
    if (!proModel && !canMakeRequest()) {
      console.log('❌ [CHANNEL] Request limit exceeded');
      setShowRequestLimit(true);
      return;
    }
    
    // Увеличиваем счетчик запросов сразу при нажатии кнопки (только для не-pro пользователей)
    if (!proModel) {
      incrementRequestCount();
      setRequestCount(getUsedRequestsToday());
      console.log(`📊 [CHANNEL] Request count incremented immediately. Used today: ${getUsedRequestsToday()}, Remaining: ${getRemainingRequests()}`);
    }
    
    console.log(`\n🚀 [CHANNEL] Getting videos for channel: "${channelUrl}" with limit: ${selectedVideoCount}`);
    setIsLoadingVideos(true);
    setChannelVideosResults(null);
    setChannelSummaryData(null);
    setChannelError(null);
    setCurrentParsingHistoryId(null); // Сбрасываем ID предыдущего парсинга
    
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
      
      // Сохраняем результаты парсинга канала в историю
      await saveParsingToHistory(videosWithTranscripts, false);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error getting channel videos:', error);
      setChannelError('Ошибка при получении видео канала. Попробуйте еще раз.');
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel videos request completed`);
      setIsLoadingVideos(false);
      
      // Счетчик уже был увеличен в начале функции
    }
  };

  // Функция для сохранения результатов парсинга в историю (без summary)
  const saveParsingToHistory = async (videos, isVideo = false) => {
    try {
      let queryTitle;
      if (isVideo && videos.length === 1) {
        // Это отдельное видео
        const videoTitle = videos[0]?.title || 'Unknown Video';
        queryTitle = `Video: ${videoTitle}`;
      } else {
        // Это канал
        const channelName = parsingResults?.channelName || 'Unknown Channel';
        queryTitle = `Channel: ${channelName}`;
      }
      
      const searchData = {
        query: queryTitle,
        searchResults: videos || [],
        summaryData: null // Пока без summary
      };
      
      const historyId = await saveSearchToHistory(searchData, user?.uid);
      if (historyId) {
        console.log('✅ [APP] Parsing results saved to history with ID:', historyId);
        setCurrentParsingHistoryId(historyId);
        return historyId;
      } else {
        console.log('⚠️ [APP] Failed to save parsing results to history');
        return null;
      }
    } catch (error) {
      console.error('❌ [APP] Error saving parsing results to history:', error);
      return null;
    }
  };

  const handleChannelSummaryComplete = async (summaryResult) => {
    console.log(`📋 [CHANNEL] Summary completed:`, summaryResult);
    setChannelSummaryData(summaryResult);
    
    // Обновляем существующую запись истории с summary данными
    try {
      if (currentParsingHistoryId) {
        // Обновляем существующую запись
        const updateSuccess = await updateHistoryItem(
          currentParsingHistoryId,
          { summaryData: summaryResult },
          user?.uid
        );
        
        if (updateSuccess) {
          console.log('✅ [APP] History item updated with summary, ID:', currentParsingHistoryId);
        } else {
          console.log('⚠️ [APP] Failed to update history item with summary, creating new one...');
          // Fallback - создаем новую запись если обновление не удалось
          await createNewHistoryEntry(summaryResult);
        }
      } else {
        // Если нет текущего ID, создаем новую запись (fallback)
        console.log('ℹ️ [APP] No current history ID, creating new entry...');
        await createNewHistoryEntry(summaryResult);
      }
    } catch (error) {
      console.error('❌ [APP] Error updating history with summary:', error);
    }
  };

  // Fallback функция для создания новой записи истории
  const createNewHistoryEntry = async (summaryResult) => {
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
      
      const historyId = await saveSearchToHistory(searchData, user?.uid);
      if (historyId) {
        console.log('✅ [APP] New history entry created with summary, ID:', historyId);
        setCurrentParsingHistoryId(historyId);
      }
    } catch (error) {
      console.error('❌ [APP] Error creating new history entry:', error);
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
        selectedHistoryId={selectedHistoryId}
        onResetHistory={() => setSelectedHistoryId(null)}
        onShowPaywall={() => setShowPaywall(true)}
        isLoading={isLoading}
      />
      
      {currentPage === 'history' ? (
        <History 
          onBackToMain={() => setCurrentPage('main')}
          selectedHistoryId={selectedHistoryId}
          setSelectedHistoryId={setSelectedHistoryId}
        />
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
                <div className="toggles-container">
                  <div className="search-mode-toggle">
                    <button
                      className={`toggle-button ${searchMode === 'request' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchMode('request');
                        setChannelError(null);
                      }}
                      disabled={isLoading}
                    >
                      Search
                    </button>
                    <button
                      className={`toggle-button ${searchMode === 'parsing' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchMode('parsing');
                        setChannelError(null);
                      }}
                      disabled={isLoading}
                    >
                      Link to video or channel
                    </button>
                  </div>
                  
                  <div className="additional-toggles">
                    <div className="toggle-item">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={proModel}
                          onChange={(e) => setProModel(e.target.checked)}
                          disabled={isLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        Pro Model
                        <span className="tooltip-trigger" data-tooltip="Использование модели Gemini 2.0 Flash Lite (Google). Эта модель обеспечивает более высокое качество результатов, но потребляет больше токенов и стоит дороже.">
                          ❓
                        </span>
                      </span>
                    </div>
                    
                    <div className="toggle-item">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={detailedSummary}
                          onChange={(e) => {
                            console.log(`🔄 [APP] Detailed Summary переключен: ${e.target.checked ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
                            setDetailedSummary(e.target.checked);
                          }}
                          disabled={isLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        Detailed Summary
                        <span className="tooltip-trigger" data-tooltip="Создание более подробного резюме с детальными пояснениями, анализом ключевых моментов и расширенными выводами.">
                          ❓
                        </span>
                      </span>
                    </div>
                    
                    <div className="requests-info">
                      <span className="requests-text">
                        📊 {requestCount}/3 запросов сегодня
                      </span>
                      <button 
                        className="test-reset-button"
                        onClick={() => {
                          resetRequestCount();
                          setRequestCount(0);
                        }}
                        title="Сбросить счетчик (для тестирования)"
                      >
                        🔄
                      </button>
                      <button 
                        className="test-increment-button"
                        onClick={() => {
                          incrementRequestCount();
                          setRequestCount(getUsedRequestsToday());
                        }}
                        title="Увеличить счетчик (для тестирования)"
                      >
                        ➕
                      </button>
                      <button 
                        className="test-limit-button"
                        onClick={() => {
                          // Симулируем проверку лимита для авторизованного пользователя
                          if (!canMakeRequest()) {
                            setShowRequestLimit(true);
                          } else {
                            alert('Можно сделать запрос!');
                          }
                        }}
                        title="Проверить лимит (для тестирования)"
                      >
                        🔍
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Индикатор прогресса поиска */}
                {searchProgress && (
                  <SearchProgress 
                    currentStep={searchProgress}
                    stepDetails={progressDetails}
                    progressPercentage={summaryProgress}
                  />
                )}
              </div>
            </div>
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
                  </div>
                  
                  {/* Показываем компонент для создания резюме */}
                  {searchResults && searchResults.length > 0 && (
                    <TranscriptSummary 
                      videos={searchResults}
                      userQuery={query}
                      onSummaryComplete={handleSummaryComplete}
                      selectedModel={selectedModel}
                      summaryData={summaryData}
                      detailedSummary={detailedSummary}
                      onProgressUpdate={setSummaryProgress}
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
                      <p>Резюме будет создано автоматически после получения результатов поиска</p>
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
                        {/* Показываем channel-info только для каналов, не для отдельных видео */}
                        {!(channelVideosResults && channelVideosResults.totalCount === 1) && (
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
                                <ThumbnailImage
                                  src={parsingResults.channelThumbnail} 
                                  alt={`${parsingResults.channelName} thumbnail`}
                                  className="channel-thumbnail-preview"
                                  fallbackIcon="📺"
                                  maxRetries={3}
                                  retryDelay={1500}
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
                        )}

                                            {/* Результаты получения видео в двух колонках */}
                        {channelVideosResults && (
                          <div 
                            className="videos-results-section"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                          >
                            {/* Левая колонка - Общий вывод */}
                            <div 
                              className="left-column"
                              style={{ width: `${parsingLeftColumnWidth}%` }}
                            >
                              <div className="summary-section">
                                <div className="summary-header">
                                  <h2>📋 Общий вывод {channelVideosResults.totalCount === 1 ? 'по видео' : 'по каналу'}</h2>
                                </div>
                            
                            {/* Показываем компонент для создания резюме */}
                            {channelVideosResults.videos && channelVideosResults.videos.length > 0 && (
                              <>
                                <TranscriptSummary 
                                  videos={channelVideosResults.videos}
                                  userQuery={`Канал: ${parsingResults.channelName}`}
                                  onSummaryComplete={handleChannelSummaryComplete}
                                  selectedModel={selectedModel}
                                  summaryData={channelSummaryData}
                                  detailedSummary={detailedSummary}
                                  onProgressUpdate={setSummaryProgress}
                                />
                              </>
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
                                <p>Резюме будет создано автоматически после загрузки транскрипций</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Разделитель колонок */}
                        <div 
                          className="column-resizer"
                          onMouseDown={handleParsingMouseDown}
                        ></div>

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

      {/* Paywall Modal */}
      {showPaywall && (
        <Paywall 
          onClose={handleClosePaywall}
          onSubscribe={handleSubscribe}
        />
      )}

      {/* Request Limit Modal */}
      {showRequestLimit && (
        <RequestLimitModal 
          onClose={handleCloseRequestLimit}
          onUpgrade={handleUpgradeFromLimit}
          remainingRequests={getRemainingRequests()}
          usedRequests={requestCount}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={handleCloseAuthModal}
          mode={authModalMode}
        />
      )}

      {/* Token Limit Modal */}
      {showTokenLimit && userTokens && (
        <TokenLimitModal 
          onClose={handleCloseTokenLimit}
          onUpgrade={handleUpgradeFromTokenLimit}
          currentTokens={userTokens.tokens}
          subscriptionType={userTokens.subscription}
        />
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
