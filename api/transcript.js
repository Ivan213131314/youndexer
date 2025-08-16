// Supadata API конфигурация
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "sd_cf39c3a6069af680097faf6f996b8c16";
const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

function extractVideoId(urlOrId) {
    if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = urlOrId.match(pattern);
            if (match) {
                return match[1];
            }
        }
    }
    return urlOrId;
}

async function getVideoTranscriptSupadata(videoId) {
    try {
        console.log(`🎬 [SUPADATA] Getting transcript for video: ${videoId}`);
        
        const response = await fetch(`${SUPADATA_BASE_URL}/transcript`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPADATA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_id: videoId,
                language: 'en'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SUPADATA] API error: ${response.status} ${response.statusText}`);
            console.error(`❌ [SUPADATA] Error details: ${errorText}`);
            throw new Error(`Supadata API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ [SUPADATA] Transcript received for ${videoId}`);
        
        return {
            success: true,
            transcript: data.transcript || '',
            language: data.language || 'en',
            videoId: videoId
        };
        
    } catch (error) {
        console.error(`❌ [SUPADATA] Error getting transcript for ${videoId}:`, error);
        return {
            success: false,
            error: error.message,
            videoId: videoId
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
        const { videoId } = req.body;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: 'Missing videoId parameter' 
            });
        }
        
        console.log(`📝 [API] Received transcript request for: ${videoId}`);
        
        const extractedVideoId = extractVideoId(videoId);
        const result = await getVideoTranscriptSupadata(extractedVideoId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error(`❌ [API] Error in transcript:`, error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
