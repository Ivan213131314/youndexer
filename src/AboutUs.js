import React from 'react';
import './AboutUs.css';

const AboutUs = ({ onBackToMain }) => {
  const testimonials = [
    {
      id: 1,
      name: "Алексей Петров",
      role: "Контент-маркетолог",
      company: "TechStart",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      text: "YouTube Semantic Searcher изменил мой подход к исследованию контента. Теперь я могу быстро находить релевантные видео и анализировать их содержание. Это экономит мне часы работы в неделю!",
      rating: 5
    },
    {
      id: 2,
      name: "Мария Сидорова",
      role: "Исследователь",
      company: "Digital Analytics Lab",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      text: "Отличный инструмент для анализа YouTube контента. Возможность получать транскрипции и создавать резюме помогает мне глубже понимать тренды в моей области исследований.",
      rating: 5
    },
    {
      id: 3,
      name: "Дмитрий Козлов",
      role: "Преподаватель",
      company: "Университет ИТ",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      text: "Использую этот сервис для подготовки к лекциям. Могу быстро найти образовательные видео по любой теме и получить их краткое содержание. Студенты в восторге от качества материалов!",
      rating: 4
    },
    {
      id: 4,
      name: "Елена Воробьева",
      role: "Блогер",
      company: "TechReview Channel",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      text: "Как блогер, я постоянно ищу вдохновение и новые темы. Этот инструмент помогает мне находить актуальный контент и понимать, что сейчас популярно в моей нише.",
      rating: 5
    },
    {
      id: 5,
      name: "Сергей Морозов",
      role: "Аналитик данных",
      company: "DataInsights",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      text: "Интеграция с AI для фильтрации контента работает отлично. Могу быстро отсеивать нерелевантные видео и фокусироваться на действительно важном контенте для моих исследований.",
      rating: 4
    },
    {
      id: 6,
      name: "Анна Смирнова",
      role: "Менеджер проектов",
      company: "Creative Agency",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      text: "Используем сервис для анализа конкурентов и трендов в индустрии. Возможность парсить целые каналы и получать общий анализ очень помогает в стратегическом планировании.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: "🔍",
      title: "Семантический поиск",
      description: "Используйте естественный язык для поиска релевантных видео на YouTube"
    },
    {
      icon: "🤖",
      title: "AI фильтрация",
      description: "Искусственный интеллект автоматически отбирает наиболее подходящие результаты"
    },
    {
      icon: "📝",
      title: "Автоматические транскрипции",
      description: "Получайте текстовые версии видео для глубокого анализа контента"
    },
    {
      icon: "📋",
      title: "Умные резюме",
      description: "AI создает краткие и информативные резюме по всем найденным видео"
    },
    {
      icon: "📺",
      title: "Парсинг каналов",
      description: "Анализируйте целые YouTube каналы и получайте общую картину контента"
    },
    {
      icon: "💾",
      title: "История поисков",
      description: "Сохраняйте и возвращайтесь к предыдущим результатам поиска"
    }
  ];

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="about-us">
      <div className="about-header">
        <h1>О проекте YouTube Semantic Searcher</h1>
      </div>

      <div className="about-content">
        {/* Основная информация о проекте */}
        <section className="project-intro">
          <div className="intro-content">
            <h2>🎯 Наша миссия</h2>
            <p>
              YouTube Semantic Searcher — это революционный инструмент для поиска и анализа 
              контента на YouTube. Мы объединили мощь семантического поиска с искусственным 
              интеллектом, чтобы помочь вам находить именно то, что нужно, и понимать 
              содержание видео на глубоком уровне.
            </p>
            
            <h3>🚀 Что делает нас уникальными</h3>
            <p>
              В отличие от обычного поиска YouTube, наш сервис понимает контекст вашего запроса 
              и использует AI для анализа транскрипций видео. Это позволяет находить контент, 
              который может быть скрыт от обычных поисковых алгоритмов, и получать 
              интеллектуальные резюме по всем найденным материалам.
            </p>
          </div>
        </section>

        {/* Возможности */}
        <section className="features-section">
          <h2>✨ Возможности платформы</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Статистика */}
        <section className="stats-section">
          <h2>📊 Наши достижения</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Анализированных видео</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Довольных пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Созданных резюме</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">99.2%</div>
              <div className="stat-label">Точность поиска</div>
            </div>
          </div>
        </section>

        {/* Отзывы */}
        <section className="testimonials-section">
          <h2>💬 Отзывы наших пользователей</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="testimonial-avatar"
                  />
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p className="testimonial-role">{testimonial.role}</p>
                    <p className="testimonial-company">{testimonial.company}</p>
                    <div className="testimonial-rating">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <div className="testimonial-text">
                  <p>"{testimonial.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Технологии */}
        <section className="tech-section">
          <h2>🛠️ Технологии</h2>
          <div className="tech-content">
            <p>
              Наша платформа построена на современных технологиях:
            </p>
            <ul>
              <li><strong>React</strong> — для создания интуитивного пользовательского интерфейса</li>
              <li><strong>Node.js</strong> — для серверной обработки запросов</li>
              <li><strong>OpenAI GPT</strong> — для семантического анализа и создания резюме</li>
              <li><strong>YouTube Data API</strong> — для получения информации о видео</li>
              <li><strong>Firebase</strong> — для аутентификации и хранения данных</li>
              <li><strong>Supadata</strong> — для расширенного анализа YouTube контента</li>
            </ul>
          </div>
        </section>

        {/* Команда */}
        <section className="team-section">
          <h2>👥 Наша команда</h2>
          <div className="team-content">
            <p>
              Мы — команда энтузиастов, объединенных идеей сделать поиск и анализ 
              YouTube контента более эффективным и доступным. Наша цель — помочь 
              исследователям, маркетологам, преподавателям и всем, кто работает 
              с видео-контентом, сэкономить время и получить более глубокое понимание 
              материалов.
            </p>
          </div>
        </section>

        {/* Контакты */}
        <section className="contact-section">
          <h2>📧 Свяжитесь с нами</h2>
          <div className="contact-content">
            <p>
              Есть вопросы или предложения? Мы всегда рады обратной связи!
            </p>
            <div className="contact-info">
              <p>📧 Email: support@youtube-searcher.com</p>
              <p>🌐 Website: youtube-searcher.com</p>
              <p>📱 Telegram: @youtube_searcher_support</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
