import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import './TranscriptSummary.css';




const TranscriptSummary = ({ videos, userQuery, onSummaryComplete, selectedModel, summaryData, detailedSummary = false, onProgressUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Debug: log the detailedSummary prop
  useEffect(() => {
    console.log(`🔍 [TRANSCRIPT_SUMMARY] Component received detailedSummary = ${detailedSummary}`);
  }, [detailedSummary]);





  // Автоматическое создание резюме при получении ВСЕХ транскрипций
  useEffect(() => {
    const videosWithTranscripts = videos ? videos.filter(video => video.transcript) : [];
    const totalVideos = videos ? videos.length : 0;
    
    // Create summary automatically only if:
    // 1. There are videos with transcripts
    // 2. ALL videos have transcripts (or process is complete)
    // 3. No summary exists yet
    // 4. Not currently loading
    // 5. userQuery exists
    // 6. Number of videos with transcripts equals total number of videos
    if (videosWithTranscripts.length > 0 && 
        videosWithTranscripts.length === totalVideos && 
        !summaryData && 
        !isLoading && 
        userQuery) {
      console.log(`🤖 [AUTO_SUMMARY] Automatically creating summary for ALL videos with transcripts (${videosWithTranscripts.length}/${totalVideos})`);
      
      // Small delay to ensure all transcripts are loaded
      const timer = setTimeout(() => {
        createSummary();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [videos, summaryData, isLoading, userQuery]);



  const createSummary = async () => {
    if (!videos || videos.length === 0 || !userQuery) {
      setError('Videos and userQuery are required to create summary');
      return;
    }

    // Check that there are videos with transcripts
    const videosWithTranscripts = videos.filter(video => video.transcript);
    if (videosWithTranscripts.length === 0) {
      setError('No videos with transcripts to create summary');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [SUMMARY] Creating summary...');
      console.log(`📋 [SUMMARY] Number of videos: ${videos.length}`);
      console.log(`📝 [SUMMARY] Videos with transcripts: ${videosWithTranscripts.length}`);
      console.log(`🔍 [SUMMARY] Original query: "${userQuery}"`);

      console.log(`🎯 [SUMMARY] Detailed summary mode: ${detailedSummary ? 'ENABLED' : 'DISABLED'}`);

      // Form final query with additional prompt and detailed mode
      let finalQuery = userQuery;
      
      // Add text for detailed summary if the corresponding mode is enabled
      if (detailedSummary) {
        const detailedText = ". Create a very detailed and comprehensive summary with deep analysis, detailed explanations, specific examples, and extended conclusions. Include maximum useful information from the transcripts.";
        finalQuery += detailedText;
        console.log(`✨ [SUMMARY] Added text for detailed summary: "${detailedText}"`);
      }
      


      console.log(`📤 [SUMMARY] FINAL LLM REQUEST: "${finalQuery}"`);
      console.log(`📊 [SUMMARY] Final request length: ${finalQuery.length} characters`);
      console.log('='.repeat(100));

      // Update progress to 90% before sending request to LLM
      if (onProgressUpdate) {
        onProgressUpdate(90);
      }

      // Send full transcripts for quality summary
      const requestBody = {
        videos: videosWithTranscripts,
        userQuery: finalQuery,
        model: selectedModel,
        detailedSummary: detailedSummary
      };

      console.log('📤 [SUMMARY] Отправляем запрос к серверу:');
      console.log('='.repeat(80));
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/summarize-videos'
        : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-videos`;
      console.log('URL:', apiUrl);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json'
      });
      
      console.log('🎯 [SUMMARY] ФИНАЛЬНЫЙ ЗАПРОС К LLM:');
      console.log('='.repeat(80));
      console.log(finalQuery);
      console.log('='.repeat(80));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании резюме');
      }

      const result = await response.json();
      
      console.log('✅ [SUMMARY] Резюме создано успешно!');
      console.log('📥 [SUMMARY] Ответ от сервера:');
      console.log('='.repeat(80));
      console.log('Status:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('='.repeat(80));
      console.log('📊 [SUMMARY] Результаты:', result);
      
      // Обновляем прогресс до 100% после успешного создания резюме
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }

      if (onSummaryComplete) {
        onSummaryComplete(result);
      }

    } catch (error) {
      console.error('❌ [SUMMARY] Ошибка при создании резюме:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!summaryData) return;
    
    setIsDownloading(true);
    try {
      // Создаем временный HTML элемент для PDF
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = 'black';
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 28px; margin-bottom: 20px; color: #333;">Резюме по запросу</h1>
          <h2 style="font-size: 20px; color: #666; margin-bottom: 30px;">"${userQuery}"</h2>
        </div>
        
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 5px 0; font-weight: bold;">Всего результатов: ${summaryData.totalResults}</p>
          <p style="margin: 5px 0; font-weight: bold;">Transcript найдено: ${summaryData.transcriptCount}</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #ddd; margin: 30px 0;">
        
        <div style="font-size: 14px; line-height: 1.8; page-break-inside: auto;">
          ${summaryData.summary.split('\n').map((line, index) => {
            // Обрабатываем отступы в начале строки
            const trimmedLine = line.trim();
            const indentLevel = line.length - line.trimStart().length;
            const indent = indentLevel * 20; // 20px на уровень отступа
            
            // Добавляем разрыв страницы перед заголовками (строки с ###)
            const isHeader = trimmedLine.startsWith('###') || trimmedLine.startsWith('**') && trimmedLine.endsWith('**');
            const pageBreak = isHeader ? 'page-break-before: always;' : '';
            
            if (trimmedLine === '') {
              return '<div style="height: 10px; page-break-inside: avoid;"></div>'; // Пустая строка
            } else if (indentLevel > 0) {
              return `<div style="padding-left: ${indent}px; margin-bottom: 8px; page-break-inside: avoid; ${pageBreak}">${trimmedLine}</div>`;
            } else {
              return `<div style="margin-bottom: 8px; page-break-inside: avoid; ${pageBreak}">${trimmedLine}</div>`;
            }
          }).join('')}
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Конвертируем HTML в canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Удаляем временный элемент
      document.body.removeChild(tempDiv);
      
      // Создаем PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Сохраняем файл
      pdf.save(`${userQuery}.pdf`);
      
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      setError('Ошибка при создании PDF файла');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsDOC = async () => {
    if (!summaryData) return;
    
    setIsDownloading(true);
    try {
      const doc = new Document({
        title: `Резюме по запросу: ${userQuery}`,
        creator: "YouTube Semantic Searcher",
        description: "Резюме по результатам поиска YouTube видео",
        sections: [{
          children: [
            new Paragraph({
              text: "Резюме по запросу",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `"${userQuery}"`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Всего результатов: ${summaryData.totalResults}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Transcript найдено: ${summaryData.transcriptCount}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: "",
            }),
            new Paragraph({
              text: summaryData.summary,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${userQuery}.docx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating DOC:', error);
      setError('Error creating DOC file');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsTXT = async () => {
    if (!summaryData) return;
    
    setIsDownloading(true);
    try {
      const content = `Summary for query: "${userQuery}"

Total results: ${summaryData.totalResults}
Transcripts found: ${summaryData.transcriptCount}

${summaryData.summary}`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${userQuery}.txt`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating TXT:', error);
      setError('Error creating TXT file');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summaryData) return;
    
    const content = `Summary for query: "${userQuery}"

Total results: ${summaryData.totalResults}
Transcripts found: ${summaryData.transcriptCount}

${summaryData.summary}`;
    
    try {
      await navigator.clipboard.writeText(content);
      
      // Show success notification for copying
      const button = document.querySelector('.copy-button');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="download-icon">✓</span>Copied';
        button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Check if there are videos with transcripts
  const videosWithTranscripts = videos ? videos.filter(video => video.transcript) : [];
  const hasTranscripts = videosWithTranscripts.length > 0;
  const hasSummary = summaryData && summaryData.summary;

  return (
    <div className="transcript-summary">
      {/* Video statistics */}
      <div className="summary-stats">
        <span>Total videos: {videos ? videos.length : 0}</span>
        <span>With transcripts: {videosWithTranscripts.length}</span>
      </div>
      


      {/* Download buttons - shown only if summary is ready */}
      {hasSummary && (
        <div className="download-section">
          <div className="download-buttons">
            <button 
              className="download-button copy-button"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <span className="download-icon">📋</span>
              Copy
            </button>
            <button 
              className="download-button pdf-button"
              onClick={downloadAsPDF}
              disabled={isDownloading}
            >
              <span className="download-icon">📄</span>
              {isDownloading ? 'Creating PDF...' : 'Download PDF'}
            </button>
            <button 
              className="download-button doc-button"
              onClick={downloadAsDOC}
              disabled={isDownloading}
            >
              <span className="download-icon">📝</span>
              {isDownloading ? 'Creating DOC...' : 'Download DOC'}
            </button>
            <button 
              className="download-button txt-button"
              onClick={downloadAsTXT}
              disabled={isDownloading}
            >
              <span className="download-icon">📄</span>
              {isDownloading ? 'Creating TXT...' : 'Download TXT'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="summary-error">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {!hasTranscripts && videos && videos.length > 0 && (
        <div className="summary-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">No videos with transcripts to create summary</span>
        </div>
      )}

      {isLoading && (
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <span>Creating summary based on all transcripts...</span>
        </div>
      )}


    </div>
  );
};

export default TranscriptSummary; 