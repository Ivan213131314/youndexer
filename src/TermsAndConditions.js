import React, { useEffect } from 'react';
import './TranscriptSummary.css';

function TermsAndConditions() {
  useEffect(() => {
    document.title = 'Terms of Use • YouTube Semantic Searcher';
    const descriptionText = 'Terms of Use, Privacy Policy, and Refund Policy for YouTube Semantic Searcher.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descriptionText);
  }, []);

  return (
    <div className="about-us" style={{ padding: '24px 0' }}>
      <div className="about-header">
        <h1>Terms of Use</h1>
      </div>

      <div className="about-content" style={{ maxWidth: 960, margin: '0 auto' }}>
        <section className="project-intro" style={{ marginBottom: 0 }}>
          <div className="intro-content">
            <h2 style={{ marginBottom: 12 }}>Quick navigation</h2>
            <p style={{ marginBottom: 16 }}>Use the links below to jump to a section:</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                background: 'rgba(255,255,255,0.15)',
                padding: '12px 14px',
                borderRadius: 10
              }}
            >
              <a href="#terms" style={{
                textDecoration: 'none',
                background: '#fff',
                color: '#202124',
                border: '1px solid #e8eaed',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>Terms of Use</a>
              <a href="#privacy" style={{
                textDecoration: 'none',
                background: '#fff',
                color: '#202124',
                border: '1px solid #e8eaed',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>Privacy Policy</a>
              <a href="#refund" style={{
                textDecoration: 'none',
                background: '#fff',
                color: '#202124',
                border: '1px solid #e8eaed',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>Refund Policy</a>
            </div>
          </div>
        </section>

        <section id="terms" style={{
          marginTop: 24,
          background: 'white',
          border: '1px solid #e8eaed',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 0
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #eef2f7',
            background: 'linear-gradient(135deg, #eef4ff 0%, #f6f9ff 100%)',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12
          }}>
            <h2 style={{ margin: 0, color: '#1a237e' }}>Terms of Use</h2>
            <p style={{ margin: '8px 0 0 0', color: '#556080' }}>YouTube Semantic Searcher is operated by <strong>Youndexer</strong>.</p>
          </div>

          <div style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>Service Description</h3>
            <p style={{ marginBottom: 12 }}>This service provides:</p>
            <ul style={{ paddingLeft: 20, marginTop: 0 }}>
              <li>✅ Semantic search for YouTube videos</li>
              <li>✅ AI filtering of results</li>
              <li>✅ Automatic transcripts and summaries of relevant content</li>
              <li>✅ Channel parsing</li>
              <li>✅ Personal search history</li>
            </ul>

            <div style={{ height: 1, background: '#eef2f7', margin: '20px 0' }}></div>

            <p style={{ marginBottom: 12 }}>Plans differ by token allowance:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <span style={{
                background: '#e3f2fd', color: '#0d47a1', border: '1px solid #bbdefb',
                padding: '6px 10px', borderRadius: 999
              }}>Free: 3 tokens per day</span>
              <span style={{
                background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9',
                padding: '6px 10px', borderRadius: 999
              }}>Pro: $10/month, 100 tokens per month</span>
              <span style={{
                background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2',
                padding: '6px 10px', borderRadius: 999
              }}>Premium: $18/month, 300 tokens per month</span>
              <span style={{
                background: '#f3e5f5', color: '#4a148c', border: '1px solid #e1bee7',
                padding: '6px 10px', borderRadius: 999
              }}>Lifetime: $98 one-time, unlimited tokens and lifetime access</span>
            </div>
            <p style={{ marginTop: 12, color: '#5f6368' }}>All paid plans include a 3-day free trial.</p>

            <div style={{ height: 1, background: '#eef2f7', margin: '20px 0' }}></div>

            <h3>Account and Usage</h3>
            <ul style={{ paddingLeft: 20 }}>
              <li>✔ You must use the service lawfully and in compliance with YouTube Terms of Service and applicable laws.</li>
              <li>✔ Do not attempt to misuse, overload, or reverse engineer the service.</li>
              <li>✔ We may suspend or restrict access in case of abuse, fraud, or security risks.</li>
            </ul>

            <div style={{ height: 1, background: '#eef2f7', margin: '20px 0' }}></div>

            <h3>Subscriptions and Billing</h3>
            <ul style={{ paddingLeft: 20 }}>
              <li>• Paid plans begin with a 3-day free trial. Cancel anytime during the trial to avoid charges.</li>
              <li>• Subscriptions automatically renew each billing cycle until canceled.</li>
              <li>• Token allowances reset monthly according to the plan. Unused tokens do not roll over.</li>
              <li>• Lifetime plan is a one-time purchase with unlimited tokens and lifetime access.</li>
            </ul>

            <div style={{ height: 1, background: '#eef2f7', margin: '20px 0' }}></div>

            <h3>Content and Fair Use</h3>
            <ul style={{ paddingLeft: 20 }}>
              <li>• Transcripts and summaries are provided for research and productivity purposes.</li>
              <li>• Users are responsible for respecting creators’ rights and fair use when using retrieved content.</li>
            </ul>
          </div>
        </section>

        <section id="privacy" style={{
          marginTop: 24,
          background: 'white',
          border: '1px solid #e8eaed',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 24
        }}>
          <h2 style={{ marginTop: 0 }}>Privacy Policy</h2>
          <p><strong>Data Controller: Youndexer</strong></p>
          <ul>
            <li>We use Firebase authentication and store essential information to operate the service: user ID, subscription status, token balance, and optional saved search history.</li>
            <li>Technical logs may be processed for reliability and security.</li>
            <li>We do not sell personal data.</li>
            <li>Cookies and local storage are used for sessions and functionality.</li>
            <li>Users may request deletion of their data by contacting support@youtube-searcher.com.</li>
          </ul>
        </section>

        <section id="refund" style={{
          marginTop: 24,
          background: 'white',
          border: '1px solid #e8eaed',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 24
        }}>
          <h2 style={{ marginTop: 0 }}>Refund Policy</h2>
          <ul>
            <li>Free Trial: Cancel within the 3-day trial to avoid charges.</li>
            <li>Recurring Plans: Charges after the trial are generally non-refundable for the current billing period. Cancellation stops future renewals.</li>
            <li>Lifetime Plan: Non-refundable once delivered, except where required by law.</li>
            <li>We will review good-faith requests related to billing errors or verified service unavailability.</li>
          </ul>
        </section>

        <section style={{
          marginTop: 24,
          background: 'white',
          border: '1px solid #e8eaed',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: 24
        }}>
          <h2 style={{ marginTop: 0 }}>Contact</h2>
          <p>Questions about Terms, Privacy, or Refunds: support@youtube-searcher.com</p>
        </section>
      </div>
    </div>
  );
}

export default TermsAndConditions;


