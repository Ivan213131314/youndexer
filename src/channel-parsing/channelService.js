import {
  Supadata,
  YoutubeChannel,
  VideoIds
} from '@supadata/js';
import { getVideoTranscript } from '../supadata-client';

const apiKeySupadata = "sd_cf39c3a6069af680097faf6f996b8c16";
// Initialize the client
const supadata = new Supadata({
  apiKey: apiKeySupadata,
});

export const parseChannel = async (channelUrl) => {
  console.log(`🔍 [CHANNEL SERVICE] Parsing channel URL: ${channelUrl}`);
  
  try {
    console.log(`📺 [CHANNEL SERVICE] Using Supadata to fetch channel data`);
    
    // Use Supadata to get real channel data
    const channel = await supadata.youtube.channel({
      id: channelUrl, // can be url, channel id, handle
    });
    
    console.log(`✅ [CHANNEL SERVICE] Channel data received:`, channel);
    
    // Transform Supadata response to our format
    return transformChannelData(channel);
    
  } catch (error) {
    console.error('❌ [CHANNEL SERVICE] Error parsing channel:', error);
    throw new Error(`Failed to parse channel: ${error.message}`);
  }
};

const transformChannelData = (channel) => {
  console.log(`🔍 [CHANNEL SERVICE] Raw channel data:`, channel);
  console.log(`🔍 [CHANNEL SERVICE] Channel name:`, channel.name);
  console.log(`🔍 [CHANNEL SERVICE] Channel id:`, channel.id);
  
  const transformed = {
    channelId: channel.id,
    channelName: channel.name,
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    description: channel.description,
    videos: channel.videos?.map(video => ({
      id: video.id,
      title: video.title,
      url: `https://youtube.com/watch?v=${video.id}`,
      views: formatViews(video.viewCount),
      publishedAt: video.publishedAt,
      duration: video.duration,
      thumbnail: video.thumbnail
    })) || []
  };
  
  console.log(`🔍 [CHANNEL SERVICE] Transformed data:`, transformed);
  return transformed;
};

const formatViews = (views) => {
  if (!views) return '0';
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

export const getChannelVideos = async (channelUrl, limit) => {
  console.log(`🔍 [CHANNEL SERVICE] Getting videos for channel: ${channelUrl} with limit: ${limit}`);
  
  try {
    console.log(`📺 [CHANNEL SERVICE] Using Supadata to fetch channel videos`);
    
    // Use Supadata to get channel videos with limit
    const channelVideos = await supadata.youtube.channel.videos({
      id: channelUrl, // can be url, channel id, handle
      type: 'all', // 'video', 'short', 'live', 'all'
      limit: limit,
    });
    
    console.log(`✅ [CHANNEL SERVICE] Channel videos received:`, channelVideos);
    
    // Transform Supadata response to our format
    return transformChannelVideosData(channelVideos);
    
  } catch (error) {
    console.error('❌ [CHANNEL SERVICE] Error getting channel videos:', error);
    throw new Error(`Failed to get channel videos: ${error.message}`);
  }
};

const transformChannelVideosData = async (channelVideos) => {
  console.log(`🔍 [CHANNEL SERVICE] Raw channel videos data:`, channelVideos);
  
  // API возвращает videoIds (массив ID), а не videos (массив объектов)
  const videoIds = channelVideos.videoIds || [];
  
  console.log(`📝 [CHANNEL SERVICE] Getting transcripts for ${videoIds.length} videos...`);
  
  // Получаем транскрипции для каждого видео
  const videosWithTranscripts = [];
  
  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    console.log(`📝 [CHANNEL SERVICE] Processing video ${i + 1}/${videoIds.length}: ${videoId}`);
    
    try {
      // Получаем транскрипцию для видео
      const transcript = await getVideoTranscript(videoId);
      
      videosWithTranscripts.push({
        id: videoId,
        title: `Video ${videoId}`, // Временное название, так как у нас нет полных данных
        url: `https://youtube.com/watch?v=${videoId}`,
        views: 'N/A', // Нет данных о просмотрах
        publishedAt: 'N/A', // Нет данных о дате
        duration: 'N/A', // Нет данных о длительности
        thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`, // Дефолтная превью
        description: 'N/A', // Нет описания
        transcript: transcript?.text || null // Добавляем транскрипцию
      });
      
      // Небольшая задержка между запросами
      if (i < videoIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ [CHANNEL SERVICE] Error getting transcript for video ${videoId}:`, error);
      videosWithTranscripts.push({
        id: videoId,
        title: `Video ${videoId}`,
        url: `https://youtube.com/watch?v=${videoId}`,
        views: 'N/A',
        publishedAt: 'N/A',
        duration: 'N/A',
        thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        description: 'N/A',
        transcript: null
      });
    }
  }
  
  const transformed = {
    videos: videosWithTranscripts,
    totalCount: videoIds.length
  };
  
  console.log(`🔍 [CHANNEL SERVICE] Transformed videos data with transcripts:`, transformed);
  return transformed;
};

export const validateChannelUrl = (url) => {
  const validPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9_-]+/
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
};
