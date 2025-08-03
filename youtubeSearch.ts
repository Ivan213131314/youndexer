import axios from 'axios';

// YouTube API configuration
const YOUTUBE_API_KEY = 'AIzaSyCs3QZxVnZBltP2tn2_v8IkbK0_03zoaTU'; // Replace with your actual API key
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

// TypeScript interfaces
interface YouTubeVideo {
  title: string;
  description: string;
  videoId: string;
  url: string;
}

interface YouTubeApiResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
    };
  }>;
}

// Main search function
async function searchYouTubeVideos(query: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
  try {
    console.log(`🔍 Searching YouTube for: "${query}"`);
    
    // Make API request
    const response = await axios.get<YouTubeApiResponse>(YOUTUBE_API_BASE_URL, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults
      }
    });

    console.log(`✅ Found ${response.data.items.length} videos`);

    // Extract and format video data
    const videos: YouTubeVideo[] = response.data.items.map(item => ({
      title: item.snippet.title,
      description: item.snippet.description,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return videos;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ YouTube API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.error?.message || error.message
      });
    } else {
      console.error('❌ Unexpected Error:', error);
    }
    throw error;
  }
}

// Test function
async function testYouTubeSearch(): Promise<void> {
  try {
    console.log('🚀 Starting YouTube search test...\n');
    
    const testQuery = 'how to feed a cat';
    const videos = await searchYouTubeVideos(testQuery, 5);
    
    console.log('\n📺 Search Results:');
    console.log('==================');
    
    videos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.title}`);
      console.log(`   Video ID: ${video.videoId}`);
      console.log(`   URL: ${video.url}`);
      console.log(`   Description: ${video.description.substring(0, 100)}${video.description.length > 100 ? '...' : ''}`);
    });
    
    console.log(`\n✅ Test completed successfully! Found ${videos.length} videos.`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Export functions for use in other modules
export { searchYouTubeVideos, testYouTubeSearch, YouTubeVideo };

// Run test if this file is executed directly
if (require.main === module) {
  testYouTubeSearch();
} 