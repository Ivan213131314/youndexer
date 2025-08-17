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

  // Функция для конвертации ISO 8601 длительности в читаемый формат
  const formatDuration = (isoDuration) => {
    if (!isoDuration) return 'N/A';
    
    // Убираем 'PT' из начала
    const duration = isoDuration.replace('PT', '');
    
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    // Извлекаем часы
    const hoursMatch = duration.match(/(\d+)H/);
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1]);
    }
    
    // Извлекаем минуты
    const minutesMatch = duration.match(/(\d+)M/);
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1]);
    }
    
    // Извлекаем секунды
    const secondsMatch = duration.match(/(\d+)S/);
    if (secondsMatch) {
      seconds = parseInt(secondsMatch[1]);
    }
    
    // Форматируем результат
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Функция для получения информации о видео
  const fetchVideoInfo = async (videoId) => {
    const YOUTUBE_API_KEY = 'AIzaSyCs3QZxVnZBltP2tn2_v8IkbK0_03zoaTU';
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics&id=${videoId}`;
    
    const response = await fetch(url);
         if (!response.ok) {
       throw new Error('Error getting video information');
     }
    
    const data = await response.json();
         if (!data.items || data.items.length === 0) {
       throw new Error('Video not found');
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
      duration: formatDuration(videoData.contentDetails.duration),
             views: videoData.statistics?.viewCount || 'Unknown',
      transcript: null
    };
  };

  // Функция для получения транскрипции одного видео через Supadata
  const getVideoTranscriptDirect = async (videoId) => {
    try {
             console.log(`🎬 [SUPADATA] Getting transcript for video: ${videoId}`);
      
             // Import Supadata dynamically
      const { Supadata } = await import('@supadata/js');
      const supadata = new Supadata({
        apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
      });
      
      // Get transcript for a single video
      const transcriptResult = await supadata.youtube.transcript({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        lang: 'en',
        text: true
      });
      
             console.log(`✅ [SUPADATA] Transcript received for video: ${videoId}`);
      return transcriptResult;
      
    } catch (error) {
             console.error(`❌ [SUPADATA] Error getting transcript for video ${videoId}:`, error);
      return null;
    }
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
           throw new Error('Server unavailable or endpoint not found');
         }
        
        try {
          const errorData = await response.json();
                     throw new Error(errorData.error || 'Error getting transcript');
        } catch (jsonError) {
                     throw new Error(`Server error: ${response.status} ${response.statusText}`);
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
                 throw new Error(data.error || 'Transcript unavailable');
      }
    } catch (error) {
             if (error.name === 'TypeError' && error.message.includes('fetch')) {
         throw new Error('Server unavailable. Make sure the server is running on port 3001');
       }
      throw error;
    }
  };

  // Функция для загрузки дефолтного запроса
  const handleLoadDefaultQuery = useCallback(async (defaultQueryData) => {
    try {
      setIsLoadingDefault(true);
      console.log('🔄 [APP] Loading default query data:', defaultQueryData);

             // Set only results from history, DO NOT set query in search field
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

         // Authentication check
     if (!user) {
       console.log('❌ [APP] User not authenticated');
       showLoginModal();
       return;
     }

     // Token check
    const canUseTokens = await canUseToken(user.uid);
    if (!canUseTokens) {
      console.log('❌ [APP] No tokens available');
      setShowTokenLimit(true);
      return;
    }

         // Use token
     const tokenUsed = await consumeToken(user.uid);
     if (!tokenUsed) {
       console.log('❌ [APP] Failed to use token');
       setShowTokenLimit(true);
       return;
     }

     // Update tokens in context
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
         setProgressDetails('Searching for relevant videos...');
    setSummaryProgress(0);
    
           // Progress animation for search
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
             // Regular search by query
      console.log(`\n🔍 [APP] Regular search for query: "${query}"`);
             setProgressDetails(`Found ${videoSearchCountPerRequest} videos, checking relevance...`);
      let allVideos = await searchVideosWithPhrases([query], videoSearchCountPerRequest);
      
             // Check that we got results
      if (!allVideos || allVideos.length === 0) {
        console.log(`❌ [APP] No videos found for query, retrying...`);
        
                 // Retry the request
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

                           // Step 2: Filter videos with GPT (always use GPT model)
             console.log(`\n🤖 [APP] Starting GPT filtering...`);
             setSearchProgress('filtering');
             setProgressDetails(`Filtering ${allVideos.length} videos with GPT...`);
             setSummaryProgress(25);
             
                           // Progress animation for filtering
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
               setProgressDetails(`Preparing to get transcripts for ${filteredVideos.length} videos...`);
               setSummaryProgress(50);
               
                               // Progress animation for transcripts
               const transcribeProgressInterval = setInterval(() => {
                 setSummaryProgress(prev => {
                   if (prev >= 75) {
                     clearInterval(transcribeProgressInterval);
                     return 75;
                   }
                   return prev + 3;
                 });
               }, 200);
               
                               // First display videos without transcripts
               setSearchResults(filteredVideos.map(video => ({
                 ...video,
                 transcript: null,
                                   // Make sure all required fields are present
                 thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/default.jpg`,
                 url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
                 author: video.author || video.channelTitle || 'Unknown Channel',
                 duration: video.duration || 'N/A',
                 views: video.views || 'N/A',
                 publishedAt: video.publishedAt || 'N/A'
               })));
               
                               // Then get transcripts incrementally
                                const videosWithTranscripts = await addTranscriptsToVideos(filteredVideos, (updatedVideos) => {
                   // Callback to update state when getting each transcript
                   setSearchResults(updatedVideos);
                 }, (stepProgress) => {
                   // Callback to update step progress
                   setProgressDetails(stepProgress.details);
                 });
               
               console.log(`\n📊 [APP] Final Results with Transcripts:`);
               console.log(`- Videos with transcripts: ${videosWithTranscripts.filter(v => v.transcript).length}`);
               console.log(`- Videos without transcripts: ${videosWithTranscripts.filter(v => !v.transcript).length}`);
                               console.log(`\n🎬 [APP] Complete video objects with transcripts:`, videosWithTranscripts);
                
                // Final state update
                setSearchResults(videosWithTranscripts);
               
                               // Step 4: Show summarizing step (summary is created automatically in TranscriptSummary)
               setSearchProgress('summarizing');
               setProgressDetails(`Creating summary based on ${videosWithTranscripts.filter(v => v.transcript).length} transcripts...`);
               setSummaryProgress(75);
               
                               // DON'T do animation here - progress will be updated via callback from TranscriptSummary
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
       
       // Counter was already incremented at the beginning of the function
      
             // Reset progress if it hasn't been reset yet (e.g., on errors or no results)
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
    
         // Save result to appropriate state depending on mode
    if (searchMode === 'request') {
      setSummaryData(summaryResult);
      
             // Save results to history
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
             // Video or channel parsing mode
      setChannelSummaryData(summaryResult);
    }
    
         // Reset progress indicator after completing summary creation
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
    
         // Limit width from 30% to 70% to prevent "floating" elements
    const clampedPercentage = Math.max(30, Math.min(70, percentage));
    
         // Determine which mode we're in and update the corresponding state
    if (searchMode === 'request') {
      setLeftColumnWidth(clampedPercentage);
    } else {
      setParsingLeftColumnWidth(clampedPercentage);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

     // Navigation functions are now handled through the Navigation component

     // Functions for parsing videos or channels
  const handleVideoOrChannelParse = async () => {
    if (!channelUrl.trim()) {
             setChannelError('Please enter a video or channel link');
      return;
    }

         // Authentication check
     if (!user) {
       console.log('❌ [PARSING] User not authenticated');
       showLoginModal();
       return;
     }

     // Token check
    const canUseTokens = await canUseToken(user.uid);
    if (!canUseTokens) {
      console.log('❌ [PARSING] No tokens available');
      setShowTokenLimit(true);
      return;
    }

         // Use token
     const tokenUsed = await consumeToken(user.uid);
     if (!tokenUsed) {
       console.log('❌ [PARSING] Failed to use token');
       setShowTokenLimit(true);
       return;
     }

     // Update tokens in context
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
         setChannelSummaryData(null); // Clear previous summary
     setCurrentParsingHistoryId(null); // Reset previous parsing ID
    setSearchProgress('searching');
           setProgressDetails('Analyzing link...');
    
    let parsingCompleted = false;
    
    try {
             // Check if the request is a YouTube video URL
      const videoId = extractVideoId(channelUrl);
      
      if (videoId) {
                 // This is a YouTube video URL - process as a specific video
        console.log(`\n🎯 [PARSING] YouTube video URL detected, video ID: ${videoId}`);
        
                 // Get video information
                 setProgressDetails('Getting video information...');
        const videoInfo = await fetchVideoInfo(videoId);
        console.log('✅ [PARSING] Video info obtained:', videoInfo);
        
                 // Get transcript
        console.log('📝 [PARSING] Getting transcript...');
        setSearchProgress('transcribing');
                 setProgressDetails('Getting video transcript...');
        let transcript = null;
        
        try {
          console.log(`🔍 [PARSING] Calling getVideoTranscriptDirect(${videoId})...`);
          const transcriptResult = await getVideoTranscriptDirect(videoId);
          console.log(`📋 [PARSING] Transcript result:`, transcriptResult);
          transcript = transcriptResult?.content || transcriptResult?.text || null;
          console.log(`📋 [PARSING] Final transcript:`, transcript ? transcript.substring(0, 100) + '...' : 'null');
          console.log('✅ [PARSING] Transcript obtained');
        } catch (transcriptError) {
          console.error('❌ [PARSING] Transcript error:', transcriptError);
          console.error('❌ [PARSING] Transcript error stack:', transcriptError.stack);
          console.warn('⚠️ [PARSING] Could not get transcript:', transcriptError.message);
                     // Show video without transcript
        }
        
        const videoWithTranscript = {
          ...videoInfo,
          transcript: transcript
        };
        
                 // Set results as for individual video
        setChannelVideosResults({
          videos: [videoWithTranscript],
          totalCount: 1
        });
        
                 // Create fake parsing results for display
        setParsingResults({
          channelName: videoInfo.author,
          videoCount: 1,
          subscriberCount: null,
          description: null
        });
        
                 // Save video parsing results to history
        setSearchProgress('summarizing');
                 setProgressDetails('Creating summary based on transcript...');
        setSummaryProgress(0);
        
                 // Progress animation for summary creation
        const progressInterval = setInterval(() => {
          setSummaryProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
                 // Small delay so user sees the summary creation step
        setTimeout(async () => {
          setSummaryProgress(100);
          setTimeout(async () => {
            parsingCompleted = true;
            await saveParsingToHistory([videoWithTranscript], true);
                         // Remove indicator after saving to history
            setSearchProgress(null);
            setProgressDetails('');
            setSummaryProgress(0);
          }, 500);
        }, 2000);
        
        return;
      }
      
             // Check if this is a channel link
      if (!validateChannelUrl(channelUrl)) {
        setChannelError('Invalid YouTube video or channel link format');
        setSearchProgress(null);
        setProgressDetails('');
        return;
      }
      
             // This is a channel - use existing channel parsing logic
      console.log(`\n📺 [PARSING] Channel URL detected, starting channel parsing`);
      setSearchProgress('filtering');
             setProgressDetails('Parsing channel...');
      const results = await parseChannel(channelUrl);
      setParsingResults(results);
             // Clear video results when parsing channel
      setChannelVideosResults(null);
      setChannelSummaryData(null);
      
             // Show channel parsing result
      setSearchProgress('ready');
             setProgressDetails(`Done! Channel "${results.channelName}" processed`);
      setSummaryProgress(100);
      
             // Remove indicator after 2 seconds
      setTimeout(() => {
        setSearchProgress(null);
        setProgressDetails('');
        setSummaryProgress(0);
      }, 2000);
      
      parsingCompleted = true;
      console.log(`✅ [PARSING] Channel parsed successfully:`, results);
      
    } catch (error) {
      console.error('❌ [PARSING] Error in parsing:', error);
             setChannelError('Error processing link. Please try again.');
      setSearchProgress(null);
      setProgressDetails('');
      parsingCompleted = true;
    } finally {
      console.log(`\n🏁 [PARSING] Parsing completed`);
      setIsLoading(false);
             // DON'T reset progress here - it will be reset in setTimeout above
    }
  };

  const handleGetVideos = async () => {
         if (!channelUrl.trim()) {
       setChannelError('Please enter a channel link');
       return;
     }

     if (!validateChannelUrl(channelUrl)) {
       setChannelError('Invalid YouTube channel link format');
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

         // Request limit check (only for non-pro users)
    if (!proModel && !canMakeRequest()) {
      console.log('❌ [CHANNEL] Request limit exceeded');
      setShowRequestLimit(true);
      return;
    }
    
         // Increment request counter immediately when button is pressed (only for non-pro users)
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
         setCurrentParsingHistoryId(null); // Reset previous parsing ID
    
    try {
             // Get channel videos through Supadata
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
      
             // Convert to format like on main screen
      const videoIds = channelVideos.videoIds || [];
      
             // Get full video information through Supadata incrementally
      console.log(`📝 [CHANNEL] Getting full video info for ${videoIds.length} videos...`);
      
      const videosWithInfo = [];
      
             // Process videos one by one for incremental display
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
           
           // Immediately update state to display video
           setChannelVideosResults(prev => ({
             videos: [...videosWithInfo],
             totalCount: videosWithInfo.length
           }));
          
          console.log(`✅ [CHANNEL] Video ${i + 1}/${videoIds.length} added to display:`, video.title);
          
        } catch (error) {
          console.warn(`⚠️ [CHANNEL] Failed to get info for video ${videoId}:`, error);
                     // Fallback if failed to get information
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
          
                     // Immediately update state to display video
           setChannelVideosResults(prev => ({
             videos: [...videosWithInfo],
             totalCount: videosWithInfo.length
           }));
          
          console.log(`⚠️ [CHANNEL] Fallback video ${i + 1}/${videoIds.length} added to display:`, fallbackVideo.title);
        }
      }
      
      console.log(`✅ [CHANNEL] Full video info received for all ${videosWithInfo.length} videos`);
      
             // Now get transcripts incrementally
      console.log(`📝 [CHANNEL] Getting transcripts for ${videosWithInfo.length} videos...`);
      const videosWithTranscripts = await addTranscriptsToVideos(videosWithInfo, (updatedVideos) => {
                 // Callback to update state when getting each transcript
        setChannelVideosResults(prev => ({
          videos: updatedVideos,
          totalCount: updatedVideos.length
        }));
      });
      
             // Final state update
      setChannelVideosResults({
        videos: videosWithTranscripts,
        totalCount: videosWithTranscripts.length
      });
      
      console.log(`✅ [CHANNEL] Channel videos with transcripts received successfully:`, videosWithTranscripts);
      
             // Save channel parsing results to history
      await saveParsingToHistory(videosWithTranscripts, false);
      
    } catch (error) {
      console.error('❌ [CHANNEL] Error getting channel videos:', error);
             setChannelError('Error getting channel videos. Please try again.');
    } finally {
      console.log(`\n🏁 [CHANNEL] Channel videos request completed`);
      setIsLoadingVideos(false);
      
             // Counter was already incremented at the beginning of the function
    }
  };

     // Function to save parsing results to history (without summary)
  const saveParsingToHistory = async (videos, isVideo = false) => {
    try {
      let queryTitle;
             if (isVideo && videos.length === 1) {
         // This is an individual video
         const videoTitle = videos[0]?.title || 'Unknown Video';
         queryTitle = `Video: ${videoTitle}`;
       } else {
         // This is a channel
         const channelName = parsingResults?.channelName || 'Unknown Channel';
         queryTitle = `Channel: ${channelName}`;
       }
      
      const searchData = {
        query: queryTitle,
        searchResults: videos || [],
                 summaryData: null // No summary yet
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
    
         // Update existing history entry with summary data
    try {
      if (currentParsingHistoryId) {
                 // Update existing entry
        const updateSuccess = await updateHistoryItem(
          currentParsingHistoryId,
          { summaryData: summaryResult },
          user?.uid
        );
        
        if (updateSuccess) {
          console.log('✅ [APP] History item updated with summary, ID:', currentParsingHistoryId);
        } else {
          console.log('⚠️ [APP] Failed to update history item with summary, creating new one...');
                     // Fallback - create new entry if update failed
          await createNewHistoryEntry(summaryResult);
        }
      } else {
                 // If no current ID, create new entry (fallback)
        console.log('ℹ️ [APP] No current history ID, creating new entry...');
        await createNewHistoryEntry(summaryResult);
      }
    } catch (error) {
      console.error('❌ [APP] Error updating history with summary:', error);
    }
  };

     // Fallback function to create new history entry
  const createNewHistoryEntry = async (summaryResult) => {
    try {
      let queryTitle;
             if (channelVideosResults && channelVideosResults.totalCount === 1) {
         // This is an individual video
         const videoTitle = channelVideosResults.videos[0]?.title || 'Unknown Video';
         queryTitle = `Video: ${videoTitle}`;
       } else {
         // This is a channel
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
                        <span className="tooltip-trigger" data-tooltip="Using Gemini 2.0 Flash Lite model (Google). This model provides higher quality results but consumes more tokens and costs more.">
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
                        <span className="tooltip-trigger" data-tooltip="Creating a more detailed summary with detailed explanations, key points analysis and extended conclusions.">
                          ❓
                        </span>
                      </span>
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



                     {/* Error Message */}
           {channelError && (
             <div className="error-message">
               <p>{channelError}</p>
             </div>
           )}

                    {/* Main Content */}
          {searchMode === 'request' ? (
            // Interface for regular search
            <div 
              className="main-content"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Left Column - General Summary */}
              <div 
                className="left-column"
                style={{ width: `${leftColumnWidth}%` }}
              >
                <div className="summary-section">
                  <div className="summary-header">
                    <h2>📋 General Summary</h2>
                  </div>
                  
                  {/* Show component for creating summary */}
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

                  {/* Display ready summary */}
                  {summaryData && (
                    <div className="summary-display">
                      <div className="summary-content">
                        <h4>📋 Summary for query: "{query}"</h4>
                        <div className="summary-text">
                          {summaryData.summary.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Placeholder when no data */}
                  {!summaryData && !searchResults && (
                    <div className="placeholder">
                      <p>Summary will be created automatically after receiving search results</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column Divider */}
              <div 
                className="column-resizer"
                onMouseDown={handleMouseDown}
              ></div>

              {/* Right Column - Individual Videos */}
              <div className="right-column">
                <div className="videos-section">
                  <h2>📺 Found Videos</h2>
                  
                  {searchResults ? (
                    <div className="videos-list">
                      {searchResults.map((video, index) => (
                        <VideoItem key={index} video={video} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="placeholder">
                      <p>Search results will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Interface for channel parsing
            <div className="main-content">
              <div className="channel-results">
                                    {parsingResults ? (
                      <div className="results-section">
                        {/* Show channel-info only for channels, not for individual videos */}
                        {!(channelVideosResults && channelVideosResults.totalCount === 1) && (
                        <div className="channel-info">
                          {/* Control buttons */}
                          <div className="channel-actions-top">
                            <div className="channel-header-left">
                              <h2>📺 Information about {channelVideosResults && channelVideosResults.totalCount === 1 ? 'video' : 'channel'}</h2>
                              {parsingResults && (
                                <div className="channel-actions-right">
                                  <div className="video-count-selector">
                                    <label htmlFor="videoCount">Number of videos:</label>
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
                              <span className="detail-label">{channelVideosResults && channelVideosResults.totalCount === 1 ? 'Author:' : 'Channel name:'}</span>
                              <span className="detail-value">{parsingResults.channelName || 'Not found'}</span>
                            </div>
                            {channelVideosResults && channelVideosResults.totalCount === 1 ? (
                              // Для отдельного видео показываем информацию о видео
                              <>
                                <div className="detail-item">
                                  <span className="detail-label">Video title:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.title || 'Not found'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Views:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.views || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Duration:</span>
                                  <span className="detail-value">{channelVideosResults.videos[0]?.duration || 'N/A'}</span>
                                </div>
                              </>
                            ) : (
                              // Для канала показываем информацию о канале
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
                    </div>
                        )}

                                            {/* Video results in two columns */}
                        {channelVideosResults && (
                          <div 
                            className="videos-results-section"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                          >
                            {/* Left Column - General Summary */}
                            <div 
                              className="left-column"
                              style={{ width: `${parsingLeftColumnWidth}%` }}
                            >
                              <div className="summary-section">
                                <div className="summary-header">
                                  <h2>📋 General Summary {channelVideosResults.totalCount === 1 ? 'for video' : 'for channel'}</h2>
                                </div>
                            
                            {/* Show component for creating summary */}
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

                            {/* Display ready summary */}
                            {channelSummaryData && (
                              <div className="summary-display">
                                 <div className="summary-content">
                                   <h4>📋 Channel Summary: "{parsingResults.channelName}"</h4>
                                  <div className="summary-text">
                                    {channelSummaryData.summary.split('\n').map((line, index) => (
                                      <p key={index}>{line}</p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                                                         {/* Placeholder when no data */}
                             {!channelSummaryData && (
                               <div className="placeholder">
                                 <p>Summary will be created automatically after loading transcripts</p>
                               </div>
                             )}
                          </div>
                        </div>

                                                 {/* Column Divider */}
                        <div 
                          className="column-resizer"
                          onMouseDown={handleParsingMouseDown}
                        ></div>

                                                 {/* Right Column - Found Videos */}
                         <div className="right-column">
                           <div className="videos-section">
                             <h2>📺 {channelVideosResults.totalCount === 1 ? 'Video' : 'Found Videos'} ({channelVideosResults.totalCount})</h2>
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
                     <p>Paste a YouTube video or channel link to start parsing</p>
                     <p className="placeholder-examples">
                       Examples of supported formats:<br/>
                       <strong>Videos:</strong><br/>
                       • https://youtube.com/watch?v=VIDEO_ID<br/>
                       • https://youtu.be/VIDEO_ID<br/>
                       <strong>Channels:</strong><br/>
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
