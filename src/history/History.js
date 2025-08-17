import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { useSearchHistory, useHistoryItem, useDeleteHistoryItem, useDeleteAllHistory, clearHistoryCache } from './historyHooks';
import { formatHistoryDate, truncateQuery, hasSummary, hasSearchResults, getHistoryStats } from './historyUtils';
import TranscriptSummary from '../TranscriptSummary';
import VideoItem from '../components/VideoItem';
import './History.css';



const History = ({ onBackToMain, selectedHistoryId, setSelectedHistoryId }) => {
  const { history, loading, error, refreshHistory } = useSearchHistory();
  const { historyItem, loading: itemLoading } = useHistoryItem(selectedHistoryId);
  const { deleteItem, deleting } = useDeleteHistoryItem();
  const { deleteAll, deletingAll } = useDeleteAllHistory();
  const [isResizing, setIsResizing] = useState(false);
  const [leftColumnWidth, setLeftColumnWidth] = useState(70);

  const handleHistoryItemClick = (historyId) => {
    setSelectedHistoryId(historyId);
  };

  const handleBackClick = () => {
    setSelectedHistoryId(null);
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    
    const clampedPercentage = Math.max(30, Math.min(70, percentage));
    setLeftColumnWidth(clampedPercentage);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleDeleteItem = async (historyId, event) => {
    event.stopPropagation(); // Предотвращаем открытие детального вида
    
    if (window.confirm('Are you sure you want to delete this record from history?')) {
      const success = await deleteItem(historyId);
      if (success) {
        // Если удаляемый элемент был выбран, закрываем детальный вид
        if (selectedHistoryId === historyId) {
          setSelectedHistoryId(null);
        }
        // Обновляем список истории
        refreshHistory();
      }
    }
  };

  const handleDeleteAllHistory = async () => {
    if (window.confirm('Are you sure you want to delete ALL search history? This action cannot be undone!')) {
      const deletedCount = await deleteAll();
      if (deletedCount > 0) {
        // Закрываем детальный вид если он открыт
        setSelectedHistoryId(null);
        // Обновляем список истории
        refreshHistory();
      }
    }
  };

  const handleSummaryComplete = (summaryResult) => {
    console.log('🎉 [HISTORY] Summary completed:', summaryResult);
    // Очищаем кэш при создании нового summary, чтобы убрать устаревшие данные
    clearHistoryCache();
    // Обновляем историю после создания нового summary
    refreshHistory();
  };

  const downloadSummaryAsPDF = async (historyItem) => {
    if (!historyItem || !historyItem.summaryData) return;
    
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
          <h1 style="font-size: 28px; margin-bottom: 20px; color: #333;">Summary for query</h1>
          <h2 style="font-size: 20px; color: #666; margin-bottom: 30px;">"${historyItem.query}"</h2>
        </div>
        
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 5px 0; font-weight: bold;">Total results: ${historyItem.summaryData.totalResults}</p>
          <p style="margin: 5px 0; font-weight: bold;">Transcripts found: ${historyItem.summaryData.transcriptCount}</p>
          <p style="margin: 5px 0; font-weight: bold;">Search date: ${formatHistoryDate(historyItem.timestamp)}</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #ddd; margin: 30px 0;">
        
        <div style="font-size: 14px; line-height: 1.8; page-break-inside: auto;">
          ${historyItem.summaryData.summary.split('\n').map((line, index) => {
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
      pdf.save(`${historyItem.query}.pdf`);
      
    } catch (error) {
      console.error('Error creating PDF:', error);
    }
  };

  const downloadSummaryAsDOC = async (historyItem) => {
    if (!historyItem || !historyItem.summaryData) return;
    
    try {
      const doc = new Document({
        title: `Summary for query: ${historyItem.query}`,
        creator: "YouTube Semantic Searcher",
        description: "Summary of YouTube video search results",
        sections: [{
          children: [
            new Paragraph({
              text: "Summary for query",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `"${historyItem.query}"`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Total results: ${historyItem.summaryData.totalResults}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Transcripts found: ${historyItem.summaryData.transcriptCount}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Search date: ${formatHistoryDate(historyItem.timestamp)}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: "",
            }),
            new Paragraph({
              text: historyItem.summaryData.summary,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${historyItem.query}.docx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating DOC:', error);
    }
  };

  const downloadSummaryAsTXT = async (historyItem) => {
    if (!historyItem || !historyItem.summaryData) return;
    
    try {
      const content = `Summary for query: "${historyItem.query}"

Total results: ${historyItem.summaryData.totalResults}
Transcripts found: ${historyItem.summaryData.transcriptCount}
Search date: ${formatHistoryDate(historyItem.timestamp)}

${historyItem.summaryData.summary}`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${historyItem.query}.txt`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating TXT:', error);
    }
  };

  const copySummaryToClipboard = async (historyItem) => {
    if (!historyItem || !historyItem.summaryData) return;
    
    const content = `Summary for query: "${historyItem.query}"

Total results: ${historyItem.summaryData.totalResults}
Transcripts found: ${historyItem.summaryData.transcriptCount}
Search date: ${formatHistoryDate(historyItem.timestamp)}

${historyItem.summaryData.summary}`;
    
    try {
      await navigator.clipboard.writeText(content);
      
      // Показываем уведомление об успешном копировании
      const button = document.querySelector('.copy-button');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="download-icon">✓</span>Copied';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="back-button" onClick={onBackToMain}>
            ← Back to Search
          </button>
          <h1>Search History</h1>
        </div>
        <div className="loading-message">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="back-button" onClick={onBackToMain}>
            ← Back to Search
          </button>
          <h1>Search History</h1>
        </div>
        <div className="error-message">Error loading history: {error}</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      {!selectedHistoryId && (
        <div className="history-header">
          <h1>Search History</h1>
          {history.length > 0 && (
            <button 
              className="delete-all-button"
              onClick={handleDeleteAllHistory}
              disabled={deletingAll}
              title="Delete all history"
            >
              {deletingAll ? '🗑️ Deleting...' : '🗑️ Delete all history'}
            </button>
          )}
        </div>
      )}

      {selectedHistoryId ? (
        // Детальный вид выбранной записи
        <div 
          className="main-content"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Левая колонка - Общий вывод */}
                     <div 
             className="left-column"
             style={{ width: `${leftColumnWidth}%` }}
           >
             <div className="detail-header">
               <button className="back-button" onClick={handleBackClick}>
                 ← Back
               </button>
               <h1>Search History</h1>
             </div>
             
             <div className="summary-section">
                <div className="history-item-header">
                  <h2>📋 General Summary</h2>
                 <div className="header-actions">
                   {/* Кнопки скачивания для истории */}
                   {hasSummary(historyItem) && (
                     <div className="download-buttons">
                       <button 
                         className="download-button copy-button"
                         onClick={() => copySummaryToClipboard(historyItem)}
                         title="Copy to clipboard"
                       >
                         <span className="download-icon">📋</span>
                         Copy
                       </button>
                       <button 
                         className="download-button pdf-button"
                         onClick={() => downloadSummaryAsPDF(historyItem)}
                       >
                         <span className="download-icon">📄</span>
                         PDF
                       </button>
                       <button 
                         className="download-button doc-button"
                         onClick={() => downloadSummaryAsDOC(historyItem)}
                       >
                         <span className="download-icon">📝</span>
                         DOC
                       </button>
                                               <button 
                          className="download-button txt-button"
                          onClick={() => downloadSummaryAsTXT(historyItem)}
                        >
                          <span className="download-icon">📄</span>
                          TXT
                        </button>
                      </div>
                    )}
                  </div>
               </div>
              
              {itemLoading ? (
                <div className="loading-message">Loading data...</div>
              ) : historyItem ? (
                <>
                  {/* Показываем компонент для создания резюме если его нет */}
                  {hasSearchResults(historyItem) && !hasSummary(historyItem) && (
                    <TranscriptSummary 
                      videos={historyItem.searchResults}
                      userQuery={historyItem.query}
                      onSummaryComplete={handleSummaryComplete}
                      summaryData={null}
                    />
                  )}

                  {/* Отображение готового резюме */}
                  {hasSummary(historyItem) && (
                    <div className="summary-display">
                      <div className="summary-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total results:</span>
                          <span className="stat-value">{historyItem.summaryData.totalResults}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Transcripts found:</span>
                          <span className="stat-value">{historyItem.summaryData.transcriptCount}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Search date:</span>
                          <span className="stat-value">{formatHistoryDate(historyItem.timestamp)}</span>
                        </div>
                      </div>

                      <div className="summary-content">
                        <h4>📋 Summary for query: "{historyItem.query}"</h4>
                        <div className="summary-text">
                          {historyItem.summaryData.summary.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                                             </div>
                     </div>
                  )}

                  {/* Если нет ни summary, ни результатов */}
                  {!hasSearchResults(historyItem) && !hasSummary(historyItem) && (
                    <div className="placeholder">
                      <p>No data available for this query</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="error-message">Record not found</div>
              )}
            </div>
          </div>

          {/* Разделитель колонок */}
          <div 
            className="column-resizer"
            onMouseDown={handleMouseDown}
          ></div>

          {/* Правая колонка - Отдельные видео */}
          <div className="right-column">
            <div className="videos-section">
              <h2>📺 Found Videos</h2>
              
              {itemLoading ? (
                <div className="loading-message">Loading videos...</div>
                             ) : historyItem && hasSearchResults(historyItem) ? (
                 <div className="videos-list">
                   {historyItem.searchResults.map((video, index) => (
                     <VideoItem key={index} video={video} index={index} />
                   ))}
                 </div>
              ) : (
                <div className="placeholder">
                  <p>Videos not found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Список истории
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <p>Search history is empty</p>
              <p>Perform a search to see history</p>
            </div>
          ) : (
            history.map((item) => {
              const stats = getHistoryStats(item);
              return (
                <div 
                  key={item.id} 
                  className="history-item"
                  onClick={() => handleHistoryItemClick(item.id)}
                >
                  <div className="history-item-content">
                    <div className="history-item-main">
                      <h3 className="history-query">{truncateQuery(item.query)}</h3>
                      <div className="history-meta">
                        <span className="history-date">{formatHistoryDate(item.timestamp)}</span>
                        {stats && (
                          <span className="history-stats">
                            {stats.totalResults} videos
                            {stats.hasSummary && ' • Has summary'}
                          </span>
                        )}
                      </div>
                    </div>
                                         <div className="history-item-actions">
                       <button 
                         className="delete-button"
                         onClick={(e) => handleDeleteItem(item.id, e)}
                         disabled={deleting}
                         title="Delete record"
                       >
                         {deleting ? '🗑️' : '🗑️'}
                       </button>
                       <span className="checkmark">✓</span>
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default History;