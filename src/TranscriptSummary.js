import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import './TranscriptSummary.css';




const TranscriptSummary = ({ videos, userQuery, onSummaryComplete, selectedModel, summaryData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [summaryPrompt, setSummaryPrompt] = useState('');

  // Функции для автоподставки текста
  const setPromptText = (text) => {
    setSummaryPrompt(prevPrompt => {
      // Если текст уже есть в промпте, не добавляем его снова
      if (prevPrompt.includes(text)) {
        return prevPrompt;
      }
      // Если промпт пустой, просто добавляем текст
      if (!prevPrompt.trim()) {
        return text;
      }
      // Иначе добавляем текст через запятую и пробел
      return `${prevPrompt}, ${text}`;
    });
  };

  const createSummary = async () => {
    if (!videos || videos.length === 0 || !userQuery) {
      setError('Необходимы видео и userQuery для создания резюме');
      return;
    }

    // Проверяем что есть видео с transcriptами
    const videosWithTranscripts = videos.filter(video => video.transcript);
    if (videosWithTranscripts.length === 0) {
      setError('Нет видео с transcriptами для создания резюме');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [SUMMARY] Создаем резюме...');
      console.log(`📋 [SUMMARY] Количество видео: ${videos.length}`);
      console.log(`📝 [SUMMARY] Видео с transcriptами: ${videosWithTranscripts.length}`);
      console.log(`🔍 [SUMMARY] Запрос: "${userQuery}"`);
      console.log(`📝 [SUMMARY] Дополнительный промпт: "${summaryPrompt}"`);

      // Формируем финальный запрос с учетом дополнительного промпта
      const finalQuery = summaryPrompt ? `${userQuery}. ${summaryPrompt}` : userQuery;

      // Отправляем полные transcriptы для качественного резюме
      const requestBody = {
        videos: videosWithTranscripts,
        userQuery: finalQuery,
        model: selectedModel
      };

      console.log('📤 [SUMMARY] Отправляем запрос к серверу:');
      console.log('='.repeat(80));
      console.log('URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-videos`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json'
      });
      console.log('Body:', JSON.stringify({
        ...requestBody,
        videos: requestBody.videos.map(v => ({ ...v, transcript: v.transcript ? `${v.transcript.substring(0, 100)}...` : null }))
      }, null, 2));
      console.log('='.repeat(80));

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-videos`, {
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
      console.error('Ошибка при создании DOC:', error);
      setError('Ошибка при создании DOC файла');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsTXT = async () => {
    if (!summaryData) return;
    
    setIsDownloading(true);
    try {
      const content = `Резюме по запросу: "${userQuery}"

Всего результатов: ${summaryData.totalResults}
Transcript найдено: ${summaryData.transcriptCount}

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
      console.error('Ошибка при создании TXT:', error);
      setError('Ошибка при создании TXT файла');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summaryData) return;
    
    const content = `Резюме по запросу: "${userQuery}"

Всего результатов: ${summaryData.totalResults}
Transcript найдено: ${summaryData.transcriptCount}

${summaryData.summary}`;
    
    try {
      await navigator.clipboard.writeText(content);
      
      // Показываем уведомление об успешном копировании
      const button = document.querySelector('.copy-button');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="download-icon">✓</span>Скопировано';
        button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Ошибка при копировании в буфер обмена:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Проверяем есть ли видео с transcriptами
  const videosWithTranscripts = videos ? videos.filter(video => video.transcript) : [];
  const hasTranscripts = videosWithTranscripts.length > 0;
  const hasSummary = summaryData && summaryData.summary;

  return (
    <div className="transcript-summary">
      <div className="summary-header">
        <div className="summary-stats">
          <span>Всего видео: {videos ? videos.length : 0}</span>
          <span>С transcriptами: {videosWithTranscripts.length}</span>
        </div>
        
        {/* Текстовое поле для настройки вывода */}
        <div className="summary-prompt-section">
          <input
            type="text"
            className="summary-prompt-input"
            placeholder="describe what you want to see in summary"
            value={summaryPrompt}
            onChange={(e) => setSummaryPrompt(e.target.value)}
          />
          
          {/* Кнопки для автоподставки */}
          <div className="prompt-buttons">
            <button 
              className="prompt-button"
              onClick={() => setPromptText('add information about main insights based on the videos')}
              title="Добавить информацию об основных инсайтах"
            >
              insights
            </button>
            <button 
              className="prompt-button"
              onClick={() => setPromptText('focus on information about business strategy step by step based on the videos')}
              title="Сфокусироваться на бизнес-стратегии пошагово"
            >
              business strategy
            </button>
            <button 
              className="prompt-button"
              onClick={() => setPromptText('add information about main points of this videos')}
              title="Добавить информацию об основных моментах"
            >
              main points
            </button>
          </div>
        </div>
        
        <button 
          className="summary-button"
          onClick={createSummary}
          disabled={isLoading || !hasTranscripts || !userQuery}
        >
          {isLoading ? 'Создаем резюме...' : 'Создать резюме'}
        </button>
      </div>

      {/* Кнопки скачивания - показываются только если резюме готово */}
      {hasSummary && (
        <div className="download-section">
          <div className="download-buttons">
            <button 
              className="download-button copy-button"
              onClick={copyToClipboard}
              title="Копировать в буфер обмена"
            >
              <span className="download-icon">📋</span>
              Копировать
            </button>
            <button 
              className="download-button pdf-button"
              onClick={downloadAsPDF}
              disabled={isDownloading}
            >
              <span className="download-icon">📄</span>
              {isDownloading ? 'Создаем PDF...' : 'Скачать PDF'}
            </button>
            <button 
              className="download-button doc-button"
              onClick={downloadAsDOC}
              disabled={isDownloading}
            >
              <span className="download-icon">📝</span>
              {isDownloading ? 'Создаем DOC...' : 'Скачать DOC'}
            </button>
            <button 
              className="download-button txt-button"
              onClick={downloadAsTXT}
              disabled={isDownloading}
            >
              <span className="download-icon">📄</span>
              {isDownloading ? 'Создаем TXT...' : 'Скачать TXT'}
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
          <span className="warning-text">Нет видео с transcriptами для создания резюме</span>
        </div>
      )}

      {isLoading && (
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <span>Создаем резюме на основе всех транскриптов...</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptSummary; 