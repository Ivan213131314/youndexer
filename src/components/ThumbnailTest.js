import React from 'react';
import ThumbnailImage from './ThumbnailImage';

// Компонент для тестирования различных сценариев загрузки thumbnail'ов
const ThumbnailTest = () => {
  const testCases = [
    {
      title: "YouTube Channel Thumbnail (высокое разрешение)",
      src: "https://yt3.googleusercontent.com/Z48PV_OXLs0gLGaqB3jkDQk57nEegeV7hfls73fgSDB3KfSC4WLLbANNOmyrTeINFt7802cJ=s900-c-k-c0x00ffffff-no-rj",
      className: "channel-thumbnail-preview"
    },
    {
      title: "YouTube Video Thumbnail (рабочий)",
      src: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      className: "video-thumbnail"
    },
    {
      title: "Сломанный URL (покажет fallback после всех попыток)",
      src: "https://invalid-url-that-will-fail.com/image.jpg",
      className: "channel-thumbnail-preview"
    }
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>Thumbnail Loading Test</h2>
      {testCases.map((test, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>{test.title}</h3>
          <p>URL: {test.src}</p>
          <ThumbnailImage
            src={test.src}
            alt={test.title}
            className={test.className}
            fallbackIcon="🎭"
            maxRetries={2}
            retryDelay={1000}
          />
        </div>
      ))}
    </div>
  );
};

export default ThumbnailTest;
