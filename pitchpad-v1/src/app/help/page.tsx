// src/app/help/page.tsx
'use client'
import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    {
      q: 'How do I submit a new idea?',
      a: 'Click "Submit Idea" in the navigation or go to Ideas > New Idea. Fill out the form with your idea details and click Submit.',
    },
    {
      q: 'What is the AI Assistant?',
      a: 'The AI Assistant helps you refine your pitch, provides feedback, and can generate pitch deck content based on your idea.',
    },
    {
      q: 'How does the scoring system work?',
      a: 'Ideas are scored from 0-100 based on innovation, feasibility, market potential, and alignment with strategic goals.',
    },
    {
      q: 'Can I edit my idea after submitting?',
      a: 'Yes, you can edit ideas that are in "Draft" or "Submitted" status. Once in review, changes may be limited.',
    },
    {
      q: 'How do I export my pitch deck?',
      a: 'Go to Export in the navigation, select your idea, customize the template, and download as PDF or PowerPoint.',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#E2001A', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', marginBottom: 8 }}>Help & Support</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 32 }}>
          Find answers to common questions or contact our support team
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
          {[
            { icon: '📘', title: 'Getting Started', desc: 'Learn the basics' },
            { icon: '💡', title: 'Submit Ideas', desc: 'How to pitch' },
            { icon: '📊', title: 'Analytics', desc: 'Track progress' },
          ].map(item => (
            <div key={item.title} className="lv-card" style={{ padding: 20, textAlign: 'center' }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: '8px 0 4px' }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="lv-card" style={{ padding: 0, marginBottom: 32 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E6E6E6' }}>
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: i < faqs.length - 1 ? '1px solid #F2F2F2' : 'none' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: '0 0 8px' }}>{faq.q}</p>
              <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="lv-card" style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 8 }}>Still need help?</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Our support team is here to assist you
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="mailto:support@pitchpad.io" className="lv-btn lv-btn-primary" style={{ textDecoration: 'none' }}>
              Contact Support
            </a>
            <Link href="/dashboard" className="lv-btn" style={{ background: '#F8F8F8', color: '#666', textDecoration: 'none' }}>
              Back to App
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
