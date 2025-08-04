import React, { useState } from 'react';
import OpenAI from 'openai';
import { fetchVideosByPhrase, searchVideosWithPhrases, addTranscriptsToVideos } from './ytSearchModule';
import { filterVideosWithGPT, getFilteredVideos } from './videoFilter';
import TranscriptSummary from './TranscriptSummary';
import './App.css';

const videoSearchCountPerRequest = 3;

function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [batchJobId, setBatchJobId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

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
    setSearchResults(null);
    setBatchJobId(null);
    setSummaryData(null);
    
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
      
      // Проверяем, что получили результаты
      if (!allVideos || allVideos.length === 0) {
        console.log(`❌ [APP] No videos found for any phrase`);
        return;
      }
        
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
               
               // Сохраняем результаты для отображения
               setSearchResults(videosWithTranscripts);
               
               // Если есть batch job ID, сохраняем его для создания резюме
               if (videosWithTranscripts.length > 0 && videosWithTranscripts[0].batchJobId) {
                 setBatchJobId(videosWithTranscripts[0].batchJobId);
               }
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

  const handleSummaryComplete = (summaryResult) => {
    console.log('🎉 [APP] Summary completed:', summaryResult);
    setSummaryData(summaryResult);
  };

  return (
    <div className="App">
      <div className="header">
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
          <button 
            className="search-button"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Основной контент с двумя колонками */}
      <div className="main-content">
        {/* Левая колонка - Общий вывод */}
        <div className="left-column">
          <div className="summary-section">
            <h2>📋 Общий вывод</h2>
            
            {/* Показываем компонент для создания резюме */}
            {batchJobId && (
              <TranscriptSummary 
                jobId={batchJobId}
                userQuery={query}
                onSummaryComplete={handleSummaryComplete}
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
            {!batchJobId && !summaryData && (
              <div className="placeholder">
                <p>Выполните поиск, чтобы увидеть общий вывод по всем транскриптам</p>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - Отдельные видео */}
        <div className="right-column">
          <div className="videos-section">
            <h2>📺 Найденные видео</h2>
            
            {searchResults ? (
              <div className="videos-list">
                {searchResults.map((video, index) => (
                  <div key={index} className="video-item">
                    <h4>{video.title}</h4>
                    <p>Канал: {video.author}</p>
                    <p>Длительность: {video.duration}</p>
                    {video.transcript && (
                      <details>
                        <summary>► Показать transcript</summary>
                        <div className="transcript-content">
                          {video.transcript}
                        </div>
                      </details>
                    )}
                  </div>
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
    </div>
  );
}

export default App;
