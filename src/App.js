import React, { useState } from 'react';
import OpenAI from 'openai';
import { fetchFilmotVideos, searchVideosWithPhrases } from './filmotApi';
import './App.css';

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
      const prompt = `Given the user query: "${query}", generate 5–10 short keyword phrases or alternative phrasings that may appear in YouTube video transcripts. These should include synonyms, paraphrases, and related expressions.`;
      
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
      
      // Step 3: Test with single phrase first
      console.log(`\n🧪 [APP] Testing with single phrase for debugging...`);
      const testPhrase = phrases[0];
      console.log(`🎯 [APP] Testing phrase: "${testPhrase}"`);
      
      const testVideos = await fetchFilmotVideos(testPhrase, 3);
      
      console.log(`\n📊 [APP] Test Results:`);
      console.log(`- Phrase tested: "${testPhrase}"`);
      console.log(`- Videos found: ${testVideos.length}`);
      console.log(`- Videos:`, testVideos);
      
      // Step 4: If test successful, proceed with all phrases
      if (testVideos.length > 0) {
        console.log(`\n✅ [APP] Test successful! Proceeding with all phrases...`);
        const allVideos = await searchVideosWithPhrases(phrases, 3);
        
        console.log(`\n🎉 [APP] Final Results:`);
        console.log(`- Total phrases processed: ${phrases.length}`);
        console.log(`- Total unique videos found: ${allVideos.length}`);
        console.log(`- All videos:`, allVideos);
      } else {
        console.log(`\n⚠️ [APP] Test failed - no videos found. Check API connectivity.`);
        console.log(`\n🔍 [APP] This might be due to CORS restrictions. Filmot API may not allow browser requests.`);
        console.log(`\n💡 [APP] Consider using a proxy server or backend API to make the requests.`);
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
