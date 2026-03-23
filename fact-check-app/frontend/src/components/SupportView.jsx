import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEAM = [
  {
    name: 'Anirban Ray',
    role: 'Lead Developer & Architect',
    email: 'anirbanmark1429@gmail.com',
    avatar: 'AR',
    avatarColor: '#00E5FF',
    // Place your photo at: frontend/public/images/anirban.jpg
    photo: '/images/anirban.png',
    github: 'https://github.com/AnirbanRay20',
    githubHandle: '@AnirbanRay20',
    bio: 'Built the multi-agent pipeline, backend infrastructure, and full-stack integration.',
  },
  {
    name: 'Anusmita Ray Chaudhuri',
    role: 'UI/UX Designer & Frontend Developer',
    email: 'titirray05@gmail.com',
    avatar: 'ARC',
    avatarColor: '#FFAB00',
    // Place your photo at: frontend/public/images/anusmita.jpg
    photo: '/images/anusmita.jpeg',
    github: 'https://github.com/anus05',
    githubHandle: '@anus05',
    bio: 'Designed the Forensic Intelligence dashboard, component system, and user experience.',
  },
];

const API_GUIDES = [
  {
    id: 'groq',
    icon: 'bolt',
    color: '#00E5FF',
    title: 'Groq API',
    subtitle: 'LLM — Claim Extraction, Verification, AI Detection',
    limitInfo: 'Free tier: 30 requests/min · 14,400 requests/day',
    errorSign: 'Error 429 "rate_limit_exceeded" in backend console',
    steps: [
      { text: 'Go to ', link: { label: 'console.groq.com', url: 'https://console.groq.com' } },
      { text: 'Sign in → click "API Keys" in left sidebar' },
      { text: 'Click "Create API Key" → copy the key (starts with gsk_)' },
      { text: 'Open ', code: 'backend/.env', text2: ' file' },
      { text: 'Replace: ', code: 'GROQ_API_KEY=gsk_your_new_key_here' },
      { text: 'Restart backend: ', code: 'node server.js' },
    ],
    tip: 'If hitting limits during demo, increase the sleep delay between claims in verificationEngine.js'
  },
  {
    id: 'tavily',
    icon: 'travel_explore',
    color: '#FFAB00',
    title: 'Tavily Search API',
    subtitle: 'Evidence Retrieval — Web Search per Claim',
    limitInfo: 'Free tier: 1,000 searches/month',
    errorSign: 'Error 429 or "sources: []" with no evidence in claim cards',
    steps: [
      { text: 'Go to ', link: { label: 'app.tavily.com', url: 'https://app.tavily.com' } },
      { text: 'Sign in → click "API Keys" in dashboard' },
      { text: 'Copy your API key (starts with tvly-)' },
      { text: 'Open ', code: 'backend/.env', text2: ' file' },
      { text: 'Replace: ', code: 'TAVILY_API_KEY=tvly_your_new_key_here' },
      { text: 'Restart backend: ', code: 'node server.js' },
    ],
    tip: 'Switch search_depth from "advanced" to "basic" in evidenceRetriever.js to use fewer credits'
  },
];

const FAQ = [
  {
    q: 'Why are some claims showing "Search timed out"?',
    a: 'The Tavily search API took longer than 15 seconds. This usually happens when the Tavily free tier is under load. Try running the check again — it typically resolves on retry.'
  },
  {
    q: 'Why is AI Detection not showing for short inputs?',
    a: 'AI Detection is intentionally disabled for inputs under 100 characters. Short sentences don\'t have enough linguistic signals to make a meaningful determination. Use longer paragraphs (200+ words) for best results.'
  },
  {
    q: 'The pipeline is extracting the whole paragraph as one claim — how do I fix it?',
    a: 'Update the EXTRACTOR_SYSTEM_PROMPT in backend/utils/prompts.js. The prompt should explicitly say "Extract ONE fact per claim — never combine multiple facts into a single claim."'
  },
  {
    q: 'How do I switch from Groq to a different LLM?',
    a: 'Replace the groq-sdk import with your preferred provider (OpenAI, Anthropic, Google Gemini) in all agent files: claimExtractor.js, evidenceRetriever.js, verificationEngine.js, and aiTextDetector.js.'
  },
  {
    q: 'Where is the history data stored?',
    a: 'All session history is stored in your browser\'s localStorage under the key "arbiter_history". It persists between sessions but is local to your browser — it won\'t sync across devices.'
  },
];

export default function SupportView() {
  const [openFaq, setOpenFaq]         = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [activeGuide, setActiveGuide] = useState('groq');

  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8', marginBottom: 6 }}>
          Support & Information
        </h2>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          The Arbiter · Forensic Intelligence System · v3.0.0
        </p>
      </div>

      {/* ── SECTION 1: Team ── */}
      <Section icon="group" label="Project Authors" color="#00E5FF">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
          {TEAM.map((member) => (
            <AuthorCard
              key={member.name}
              member={member}
              copiedEmail={copiedEmail}
              onCopy={copyEmail}
            />
          ))}
        </div>
      </Section>

      {/* ── SECTION 2: API Key Guides ── */}
      <Section icon="key" label="API Keys — How to Replace When Limit Reached" color="#FFAB00">
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
          {API_GUIDES.map(g => (
            <button key={g.id} onClick={() => setActiveGuide(g.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s',
              backgroundColor: activeGuide === g.id ? `${g.color}15` : 'rgba(255,255,255,0.04)',
              color: activeGuide === g.id ? g.color : '#556070',
              boxShadow: activeGuide === g.id ? `0 0 12px ${g.color}20` : 'none',
              border: activeGuide === g.id ? `1px solid ${g.color}30` : '1px solid transparent',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{g.icon}</span>
              {g.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {API_GUIDES.filter(g => g.id === activeGuide).map(guide => (
            <motion.div key={guide.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ backgroundColor: '#161820', border: `1px solid ${guide.color}20`, borderLeft: `3px solid ${guide.color}`, borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#e3e2e8', margin: '0 0 4px' }}>{guide.title}</p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{guide.subtitle}</p>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: `${guide.color}10`, border: `1px solid ${guide.color}30`, fontFamily: 'IBM Plex Mono', fontSize: 10, color: guide.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {guide.limitInfo}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.9rem', borderRadius: 6, backgroundColor: 'rgba(255,61,87,0.06)', border: '1px solid rgba(255,61,87,0.2)', marginBottom: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#FF3D57', flexShrink: 0 }}>warning</span>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span style={{ color: '#FF3D57', fontWeight: 700 }}>Limit reached sign: </span>{guide.errorSign}
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>Steps to replace key:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {guide.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, backgroundColor: `${guide.color}15`, border: `1px solid ${guide.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, color: guide.color }}>{i + 1}</span>
                      <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', margin: 0, lineHeight: 1.5, paddingTop: 2 }}>
                        {step.text}
                        {step.link && (
                          <a href={step.link.url} target="_blank" rel="noreferrer" style={{
                            color: guide.color, textDecoration: 'none', fontWeight: 600,
                            borderBottom: `1px solid ${guide.color}50`, paddingBottom: 1,
                            transition: 'border-color 0.15s',
                          }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = guide.color}
                            onMouseLeave={e => e.currentTarget.style.borderColor = `${guide.color}50`}
                          >
                            {step.link.label} ↗
                          </a>
                        )}
                        {step.code && (
                          <code style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: guide.color, backgroundColor: `${guide.color}10`, padding: '1px 6px', borderRadius: 3 }}>
                            {step.code}
                          </code>
                        )}
                        {step.text2}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0.6rem 0.9rem', borderRadius: 6, backgroundColor: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00E5FF', flexShrink: 0, marginTop: 1 }}>tips_and_updates</span>
                <p style={{ fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc', margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: '#00E5FF', fontWeight: 600 }}>Pro tip: </span>{guide.tip}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', backgroundColor: '#0d0e12', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
            📁 backend/.env — full file reference:
          </p>
          <pre style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#bac9cc', margin: 0, lineHeight: 1.8 }}>
{`GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxx
PORT=8000`}
          </pre>
        </div>
      </Section>

      {/* ── SECTION 3: FAQ ── */}
      <Section icon="help" label="Frequently Asked Questions" color="#556070">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ backgroundColor: '#161820', border: `1px solid ${openFaq === i ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 14, color: openFaq === i ? '#00E5FF' : '#e3e2e8', transition: 'color 0.2s' }}>{item.q}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#556070', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.65, margin: '0.75rem 0 0' }}>{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: '#161820', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF' }}>shield</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#e3e2e8' }}>The Arbiter</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070' }}>v3.0.0 · Forensic Intelligence</span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Built by Anirban Ray & Anusmita Ray Chaudhuri
        </span>
      </div>
    </motion.div>
  );
}

/* ── Author Card with photo support ── */
function AuthorCard({ member, copiedEmail, onCopy }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Photo or fallback initials */}
        {!imgError ? (
          <img
            src={member.photo}
            alt={member.name}
            onError={() => setImgError(true)}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0,
              border: `2px solid ${member.avatarColor}50`,
              boxShadow: `0 0 12px ${member.avatarColor}30`,
            }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            backgroundColor: `${member.avatarColor}15`,
            border: `2px solid ${member.avatarColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${member.avatarColor}20`,
          }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: member.avatarColor }}>
              {member.avatar}
            </span>
          </div>
        )}

        <div>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#e3e2e8', margin: 0 }}>
            {member.name}
          </p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: member.avatarColor, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '3px 0 0' }}>
            {member.role}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.6, margin: 0 }}>
        {member.bio}
      </p>

      {/* Email row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 0.9rem', backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070' }}>mail</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#bac9cc' }}>{member.email}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onCopy(member.email)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            backgroundColor: copiedEmail === member.email ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)',
            color: copiedEmail === member.email ? '#00E5FF' : '#bac9cc',
            fontFamily: 'IBM Plex Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.2s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              {copiedEmail === member.email ? 'check' : 'content_copy'}
            </span>
            {copiedEmail === member.email ? 'Copied!' : 'Copy'}
          </button>
          <a href={`mailto:${member.email}`} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 4,
            backgroundColor: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: '#00E5FF', textDecoration: 'none',
            fontFamily: 'IBM Plex Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.08)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
            Email
          </a>
        </div>
      </div>

      {/* GitHub row */}
      <a
        href={member.github}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.6rem 0.9rem', backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)',
          textDecoration: 'none', transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${member.avatarColor}30`}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* GitHub SVG icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill={member.avatarColor}>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#bac9cc' }}>{member.githubHandle}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: member.avatarColor }}>open_in_new</span>
      </a>
    </motion.div>
  );
}

/* ── Reusable section wrapper ── */
function Section({ icon, label, color, children }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.6)' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
