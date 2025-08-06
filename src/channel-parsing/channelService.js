import {
  Supadata,
  YoutubeChannel
} from '@supadata/js';
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

export const validateChannelUrl = (url) => {
  const validPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9_-]+/
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
};
