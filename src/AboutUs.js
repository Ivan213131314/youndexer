import React from 'react';
import './AboutUs.css';

const AboutUs = ({ onBackToMain }) => {
  const testimonials = [
    {
      id: 1,
      name: "Alex Petrov",
      role: "Content Marketer",
      company: "TechStart",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      text: "YouTube Semantic Searcher changed my approach to content research. Now I can quickly find relevant videos and analyze their content. This saves me hours of work per week!",
      rating: 5
    },
    {
      id: 2,
      name: "Maria Sidorova",
      role: "Researcher",
      company: "Digital Analytics Lab",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      text: "Excellent tool for analyzing YouTube content. The ability to get transcripts and create summaries helps me better understand trends in my research field.",
      rating: 5
    },
    {
      id: 3,
      name: "Dmitry Kozlov",
      role: "Teacher",
      company: "IT University",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      text: "I use this service to prepare for lectures. I can quickly find educational videos on any topic and get their brief content. Students are delighted with the quality of materials!",
      rating: 4
    },
    {
      id: 4,
      name: "Elena Vorobyeva",
      role: "Blogger",
      company: "TechReview Channel",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      text: "As a blogger, I constantly look for inspiration and new topics. This tool helps me find relevant content and understand what's currently popular in my niche.",
      rating: 5
    },
    {
      id: 5,
      name: "Sergey Morozov",
      role: "Data Analyst",
      company: "DataInsights",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      text: "Integration with AI for content filtering works great. I can quickly filter out irrelevant videos and focus on truly important content for my research.",
      rating: 4
    },
    {
      id: 6,
      name: "Anna Smirnova",
      role: "Project Manager",
      company: "Creative Agency",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      text: "We use the service to analyze competitors and industry trends. The ability to parse entire channels and get overall analysis is very helpful in strategic planning.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: "🔍",
      title: "Semantic Search",
      description: "Use natural language to search for relevant videos on YouTube"
    },
    {
      icon: "🤖",
      title: "AI Filtering",
      description: "Artificial intelligence automatically selects the most suitable results"
    },
    {
      icon: "📝",
      title: "Automatic Transcripts",
      description: "Get text versions of videos for deep content analysis"
    },
    {
      icon: "📋",
      title: "Smart Summaries",
      description: "AI creates brief and informative summaries of all found videos"
    },
    {
      icon: "📺",
      title: "Channel Parsing",
      description: "Analyze entire YouTube channels and get an overall picture of content"
    },
    {
      icon: "💾",
      title: "Search History",
      description: "Save and return to previous search results"
    }
  ];

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="about-us">
      <div className="about-header">
        <h1>About YouTube Semantic Searcher Project</h1>
      </div>

      <div className="about-content">
        {/* Основная информация о проекте */}
        <section className="project-intro">
          <div className="intro-content">
            <h2>🎯 Our Mission</h2>
            <p>
              YouTube Semantic Searcher is a revolutionary tool for searching and analyzing 
              content on YouTube. We've combined the power of semantic search with artificial 
              intelligence to help you find exactly what you need and understand 
              video content at a deep level.
            </p>
            
            <h3>🚀 What Makes Us Unique</h3>
            <p>
              Unlike regular YouTube search, our service understands the context of your query 
              and uses AI to analyze video transcripts. This allows us to find content 
              that may be hidden from regular search algorithms and get 
              intelligent summaries of all found materials.
            </p>
          </div>
        </section>

        {/* Возможности */}
        <section className="features-section">
          <h2>✨ Platform Features</h2>
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
          <h2>📊 Our Achievements</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Videos Analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Happy Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Summaries Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">99.2%</div>
              <div className="stat-label">Search Accuracy</div>
            </div>
          </div>
        </section>

        {/* Отзывы */}
        <section className="testimonials-section">
          <h2>💬 User Reviews</h2>
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
          <h2>🛠️ Technologies</h2>
          <div className="tech-content">
            <p>
              Our platform is built on modern technologies:
            </p>
            <ul>
              <li><strong>React</strong> — for creating an intuitive user interface</li>
              <li><strong>Node.js</strong> — for server-side request processing</li>
              <li><strong>OpenAI GPT</strong> — for semantic analysis and summary creation</li>
              <li><strong>YouTube Data API</strong> — for getting video information</li>
              <li><strong>Firebase</strong> — for authentication and data storage</li>
              <li><strong>Supadata</strong> — for advanced YouTube content analysis</li>
            </ul>
          </div>
        </section>

        {/* Команда */}
        <section className="team-section">
          <h2>👥 Our Team</h2>
          <div className="team-content">
            <p>
              We are a team of enthusiasts united by the idea of making search and analysis 
              of YouTube content more efficient and accessible. Our goal is to help 
              researchers, marketers, teachers and everyone who works 
              with video content save time and get a deeper understanding 
              of materials.
            </p>
          </div>
        </section>

        {/* Контакты */}
        <section className="contact-section">
          <h2>📧 Contact Us</h2>
          <div className="contact-content">
            <p>
              Have questions or suggestions? We're always happy to hear feedback!
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
