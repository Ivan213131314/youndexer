// Channel parsing service
// TODO: Implement actual YouTube API integration for channel parsing

export const parseChannel = async (channelUrl) => {
  console.log(`🔍 [CHANNEL SERVICE] Parsing channel URL: ${channelUrl}`);
  
  try {
    // Extract channel ID from URL
    const channelId = extractChannelId(channelUrl);
    if (!channelId) {
      throw new Error('Invalid channel URL format');
    }
    
    console.log(`📺 [CHANNEL SERVICE] Extracted channel ID: ${channelId}`);
    
    // TODO: Implement actual YouTube API calls
    // For now, return mock data
    return await getMockChannelData(channelId);
    
  } catch (error) {
    console.error('❌ [CHANNEL SERVICE] Error parsing channel:', error);
    throw error;
  }
};

const extractChannelId = (url) => {
  // Handle different YouTube channel URL formats
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

const getMockChannelData = async (channelId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    channelId: channelId,
    channelName: `Channel ${channelId}`,
    subscriberCount: Math.floor(Math.random() * 1000000) + 1000,
    videoCount: Math.floor(Math.random() * 500) + 50,
    description: 'This is a sample channel description for demonstration purposes.',
    videos: generateMockVideos(20)
  };
};

const generateMockVideos = (count) => {
  const videos = [];
  const titles = [
    'How to Build a React App',
    'JavaScript Tips and Tricks',
    'CSS Grid Layout Tutorial',
    'Node.js Backend Development',
    'Python Data Analysis',
    'Machine Learning Basics',
    'Web Development Best Practices',
    'Mobile App Development',
    'Database Design Principles',
    'API Development Guide'
  ];
  
  for (let i = 0; i < count; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)];
    const views = Math.floor(Math.random() * 100000) + 100;
    const daysAgo = Math.floor(Math.random() * 365) + 1;
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    videos.push({
      id: `video_${i}`,
      title: `${title} - Part ${i + 1}`,
      url: `https://youtube.com/watch?v=video_${i}`,
      views: formatViews(views),
      publishedAt: publishedAt,
      duration: `${Math.floor(Math.random() * 60) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      thumbnail: `https://via.placeholder.com/320x180/4285f4/ffffff?text=Video+${i + 1}`
    });
  }
  
  return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};

const formatViews = (views) => {
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
