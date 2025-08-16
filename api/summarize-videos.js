// OpenRouter API конфигурация
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;

async function createSummaryWithOpenAI(videos, model = 'gpt-4o-mini') {
  try {
    console.log(`🤖 [OPENROUTER] Creating summary for ${videos.length} videos`);
    
    // Prepare video data for summary
    const videoData = videos.map(video => ({
      title: video.title,
      author: video.author || video.channelTitle,
      videoId: video.videoId,
      transcript: video.transcript || ''
    }));
    
    // Create prompt for summary
    const prompt = `Analyze the following YouTube videos and create a comprehensive summary. Focus on the main topics, key insights, and important points discussed.

Videos to analyze:
${videoData.map((video, index) => `
${index + 1}. "${video.title}" by ${video.author}
${video.transcript ? `Transcript: ${video.transcript.substring(0, 1000)}...` : 'No transcript available'}
`).join('\n')}

Please provide a detailed summary that covers:
- Main topics and themes
- Key insights and takeaways
- Important points discussed
- Overall conclusions

Make the summary informative and well-structured.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://youtube-searcher.vercel.app',
        'X-Title': 'YouTube Searcher'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates comprehensive summaries of YouTube video content. Focus on extracting key insights and important information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [OPENROUTER] API error: ${response.status} ${response.statusText}`);
      console.error(`❌ [OPENROUTER] Error details:`, errorData);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;
    
    console.log(`✅ [OPENROUTER] Summary created successfully`);
    
    return {
      success: true,
      summary: summary,
      model: model,
      totalVideos: videos.length
    };
    
  } catch (error) {
    console.error(`❌ [OPENROUTER] Error creating summary:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videos, model = 'gpt-4o-mini' } = req.body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid videos array' 
      });
    }
    
    if (!OPENROUTER_API_KEY) {
      return res.status(400).json({ 
        error: 'OpenRouter API key not configured' 
      });
    }
    
    console.log(`📝 [API] Received summarize request for ${videos.length} videos`);
    
    const result = await createSummaryWithOpenAI(videos, model);
    
    if (result.success) {
      res.json({
        success: true,
        summary: result.summary,
        totalResults: videos.length,
        model: result.model
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error(`❌ [API] Error in summarize:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
