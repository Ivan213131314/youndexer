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
        <section className="project-intro">
          <div className="intro-content">
            <h2>Terms of Use</h2>
            <p>
              Please read these Terms carefully. By using YouTube Semantic Searcher you agree to the terms below.
            </p>
          </div>
        </section>

        <section className="features-section">
          <h2>Service Overview</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Service Description</h3>
              <p>This service provides:</p>
              <ul>
                <li>Semantic search for YouTube videos</li>
                <li>AI filtering of results</li>
                <li>Automatic transcripts and summaries of relevant content</li>
                <li>Channel parsing</li>
                <li>Personal search history</li>
              </ul>
              <p>Plans differ by token allowance:</p>
              <ul>
                <li>Free: 3 tokens per day</li>
                <li>Pro: $10/month, 100 tokens per month</li>
                <li>Premium: $18/month, 300 tokens per month</li>
                <li>Lifetime: $98 one-time, unlimited tokens and lifetime access</li>
              </ul>
              <p>All paid plans include a 3-day free trial.</p>
            </div>

            <div className="feature-card">
              <h3>Account and Usage</h3>
              <ul>
                <li>You must use the service lawfully and in compliance with YouTube Terms of Service and applicable laws.</li>
                <li>Do not attempt to misuse, overload, or reverse engineer the service.</li>
                <li>We may suspend or restrict access in case of abuse, fraud, or security risks.</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>Subscriptions and Billing</h3>
              <ul>
                <li>Paid plans begin with a 3-day free trial. Cancel anytime during the trial to avoid charges.</li>
                <li>Subscriptions automatically renew each billing cycle until canceled.</li>
                <li>Token allowances reset monthly according to the plan. Unused tokens do not roll over.</li>
                <li>Lifetime plan is a one-time purchase with unlimited tokens and lifetime access.</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>Content and Fair Use</h3>
              <ul>
                <li>Transcripts and summaries are provided for research and productivity purposes.</li>
                <li>Users are responsible for respecting creators’ rights and fair use when using retrieved content.</li>
              </ul>
            </div>

            <div id="privacy" className="feature-card">
              <h3>Privacy Policy</h3>
              <ul>
                <li>We use Firebase authentication and store essential information to operate the service: user ID, subscription status, token balance, and optional saved search history.</li>
                <li>Technical logs may be processed for reliability and security.</li>
                <li>We do not sell personal data.</li>
                <li>Cookies and local storage are used for sessions and functionality.</li>
                <li>Users may request deletion of their data by contacting support@youtube-searcher.com.</li>
              </ul>
            </div>

            <div id="refund" className="feature-card">
              <h3>Refund Policy</h3>
              <ul>
                <li>Free Trial: Cancel within the 3-day trial to avoid charges.</li>
                <li>Recurring Plans: Charges after the trial are generally non-refundable for the current billing period. Cancellation stops future renewals.</li>
                <li>Lifetime Plan: Non-refundable once delivered, except where required by law.</li>
                <li>We will review good-faith requests related to billing errors or verified service unavailability.</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>Contact</h3>
              <p>Questions about Terms, Privacy, or Refunds: support@youtube-searcher.com</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TermsAndConditions;


