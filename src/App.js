import React, { useState } from 'react';
import OpenAI from 'openai';
import { fetchVideosByPhrase, searchVideosWithPhrases, addTranscriptsToVideos } from './ytSearchModule';
import { filterVideosWithGPT, getFilteredVideos } from './videoFilter';
import './App.css';

const videoSearchCountPerRequest = 6;

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Only for development - use backend in production
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      console.log('❌ [APP] Empty query provided');
      return;
    }
    
    console.log(`\n🚀 [APP] Starting search process for query: "${query}"`);
    setIsLoading(true);
    
    try {
      // Step 1: Generate GPT response
      console.log(`\n🤖 [GPT] Generating keyword phrases...`);
      const prompt = `Given the user query: "${query}", generate exactly 2 short keyword phrases or alternative phrasings that may appear in YouTube video transcripts. These should include synonyms, paraphrases, and related expressions. Focus on quality over quantity - each phrase should be highly relevant and specific.`;
      
      console.log(`📝 [GPT] Sending prompt to OpenAI:`, prompt);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;
      console.log(`✅ [GPT] Response received:`, response);
      
      // Step 2: Extract and process phrases
      console.log(`\n🔧 [APP] Processing GPT response...`);
      const phrases = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Remove numbering, bullet points, and quotes
          return line
            .replace(/^[\d\-.\s]+/, '') // Remove numbering
            .replace(/^["']|["']$/g, '') // Remove quotes at start/end
            .trim();
        })
        .filter(phrase => phrase.length > 0);
      
      console.log(`📋 [APP] Extracted ${phrases.length} phrases:`, phrases);
      
      if (phrases.length === 0) {
        console.log(`❌ [APP] No valid phrases extracted from GPT response`);
        return;
      }
      
      // Step 3: Search with all phrases
      console.log(`\n✅ [APP] Proceeding with all phrases...`);
      const allVideos = await searchVideosWithPhrases(phrases, videoSearchCountPerRequest);
        
        console.log(`\n🎉 [APP] Final Results:`);
        console.log(`- Total phrases processed: ${phrases.length}`);
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

             // Step 5: Filter videos with GPT
             console.log(`\n🤖 [APP] Starting GPT filtering...`);
             const relevantIds = await filterVideosWithGPT(allVideos, query);
             
             if (relevantIds.length > 0) {
               const filteredVideos = getFilteredVideos(allVideos, relevantIds);
               console.log(`\n🎯 [APP] GPT Filtering Results:`);
               console.log(`- Original videos: ${allVideos.length}`);
               console.log(`- Filtered videos: ${filteredVideos.length}`);
               console.log(`- Filtered video details:`, filteredVideos);
               
               // Step 6: Get transcripts for filtered videos
               console.log(`\n📝 [APP] Getting transcripts for ${filteredVideos.length} filtered videos...`);
               const videosWithTranscripts = await addTranscriptsToVideos(filteredVideos);
               
               console.log(`\n📊 [APP] Final Results with Transcripts:`);
               console.log(`- Videos with transcripts: ${videosWithTranscripts.filter(v => v.transcript).length}`);
               console.log(`- Videos without transcripts: ${videosWithTranscripts.filter(v => !v.transcript).length}`);
               console.log(`\n🎬 [APP] Complete video objects with transcripts:`, videosWithTranscripts);
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

  return (
    <div className="App">
      <div className="search-container">
        <h1 className="main-heading">YouTube Semantic Searcher</h1>
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Search for videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>
        <button 
          className="search-button"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
}

export default App;
