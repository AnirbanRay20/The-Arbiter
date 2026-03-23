import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all',      label: 'All',        icon: 'apps'              },
  { id: 'demo',     label: 'URLs', icon: 'link'             },
  { id: 'tech',     label: 'Technology', icon: 'memory'            },
  { id: 'science',  label: 'Science',    icon: 'science'           },
  { id: 'business', label: 'Business',   icon: 'trending_up'       },
  { id: 'health',   label: 'Health',     icon: 'health_and_safety' },
  { id: 'social',   label: 'Social',     icon: 'public'            },
];

// ── 3 PRELOADED DEMO URLs for presentation ──
const DEMO_URLS = [
  {
    id: 'demo1',
    category: 'demo',
    isUrl: true,
    text: 'https://en.wikipedia.org/wiki/Climate_change',
    label: 'Climate Change — Wikipedia',
    context: 'Mixed facts: True + Partially True + Conflicting sources. Great for showing conflict detection.',
    badge: '🟡 Mixed Results',
    badgeColor: '#FFAB00',
  },
  {
    id: 'demo2',
    category: 'demo',
    isUrl: true,
    text: 'https://en.wikipedia.org/wiki/Moon_landing_conspiracy_theories',
    label: 'Moon Landing Conspiracy — Wikipedia',
    context: 'High false claim density. Demonstrates the pipeline debunking misinformation with citations.',
    badge: '🔴 High False',
    badgeColor: '#FF3D57',
  },
  {
    id: 'demo3',
    category: 'demo',
    isUrl: true,
    text: 'https://en.wikipedia.org/wiki/Apollo_11',
    label: 'Apollo 11 Mission — Wikipedia',
    context: 'Mostly true historical facts. Shows high accuracy report with green Low Risk verdict.',
    badge: '🟢 Low Risk',
    badgeColor: '#00E5FF',
  },
];

const SUGGESTIONS = [
  { id: 1,  category: 'tech',     text: "Tesla was founded by Elon Musk in 2003",                              context: "Verification of company origins and founders."       },
  { id: 2,  category: 'tech',     text: "The first iPhone was released in 2005",                               context: "Checking historical product release dates."          },
  { id: 3,  category: 'tech',     text: "AI will replace 80% of all programming jobs by 2030",                 context: "Analyzing speculative future predictions."           },
  { id: 4,  category: 'tech',     text: "Bitcoin's maximum supply is 21 million units",                        context: "Crypto-currency protocol verification."              },
  { id: 5,  category: 'science',  text: "The Earth is statistically flat based on horizon measurements",       context: "Debunking common misinformation."                    },
  { id: 6,  category: 'science',  text: "Artemis III will land humans on the Moon in 2026",                    context: "NASA space mission timeline check."                  },
  { id: 7,  category: 'science',  text: "Water becomes most dense at exactly 4 degrees Celsius",               context: "Scientific fact verification."                      },
  { id: 8,  category: 'science',  text: "The Great Wall of China is visible from the Moon with naked eye",     context: "Scientific myth identification."                     },
  { id: 9,  category: 'business', text: "Apple is the first company to reach a $3 trillion market cap",        context: "Financial history and milestones."                   },
  { id: 10, category: 'business', text: "The global semiconductor market will double by 2030",                 context: "Market projection analysis."                         },
  { id: 11, category: 'business', text: "Netflix originally started as a DVD-by-mail service",                 context: "Company evolution and history."                      },
  { id: 12, category: 'business', text: "McDonald's is the world's largest owner of real estate",              context: "Business model verification."                        },
  { id: 13, category: 'health',   text: "Drinking 8 glasses of water a day is a medical requirement",          context: "Health myth vs. reality."                            },
  { id: 14, category: 'health',   text: "Human DNA is 99% identical to that of a chimpanzee",                  context: "Genetics and biology verification."                  },
  { id: 15, category: 'health',   text: "Caffeine significantly reduces the risk of Alzheimer's",              context: "Medical research claim checking."                    },
  { id: 16, category: 'health',   text: "The human heart beats about 100,000 times a day",                     context: "Physiological fact checking."                        },
  { id: 17, category: 'social',   text: "The world population reached 8 billion in late 2022",                 context: "Demographic data verification."                      },
  { id: 18, category: 'social',   text: "Over 50% of the world's population uses social media",                context: "Global digital trend analysis."                      },
  { id: 19, category: 'social',   text: "The average person spends 6 months of their life waiting at red lights", context: "Social behavior and statistics."                 },
  { id: 20, category: 'social',   text: "Iceland has no mosquitoes at all",                                    context: "Geographic and biological trivia."                   },
  { id: 21, category: 'tech',     text: "Moore's Law states transistors on a chip double every year",           context: "Technology law verification."                        },
  { id: 22, category: 'science',  text: "A light-year is a measurement of time, not distance",                 context: "Astrophysics concept check."                         },
];

export default function SuggestionsView({ onSelect }) {
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);

  // Demo URLs shown separately at top when 'demo' or 'all' tab
  const showDemoUrls = activeTab === 'demo' || activeTab === 'all';
  const filtered = activeTab === 'all' || activeTab === 'demo'
    ? (activeTab === 'demo' ? [] : SUGGESTIONS)
    : SUGGESTIONS.filter(s => s.category === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8', marginBottom: 6 }}>
          Discovery Engine
        </h2>
        <p style={{ fontFamily: 'Manrope', fontSize: 14, color: '#bac9cc', lineHeight: 1.6 }}>
          Explore claims or load a demo URL. Click any card to launch a forensic verification session.
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {CATEGORIES.map(cat => {
          const active = activeTab === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 1.1rem', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.2s',
              backgroundColor: active ? (cat.id === 'demo' ? 'rgba(255,171,0,0.15)' : '#00E5FF') : 'rgba(255,255,255,0.05)',
              color: active ? (cat.id === 'demo' ? '#FFAB00' : '#00363d') : '#bac9cc',
              boxShadow: active ? (cat.id === 'demo' ? '0 0 16px rgba(255,171,0,0.3)' : '0 0 16px rgba(0,229,255,0.25)') : 'none',
              border: active && cat.id === 'demo' ? '1px solid rgba(255,171,0,0.4)' : '1px solid transparent',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e3e2e8'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#bac9cc'; }}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── DEMO URLs SECTION ── */}
      {showDemoUrls && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#FFAB00' }}>star</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#FFAB00' }}>
              URLs
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', border: '1px solid rgba(255,171,0,0.2)', padding: '1px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
              3 URLs
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {DEMO_URLS.map((demo, i) => {
              const isHov = hoveredId === demo.id;
              return (
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onSelect(demo.text, 'url')}
                  onMouseEnter={() => setHoveredId(demo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'relative',
                    backgroundColor: isHov ? '#1c1f2a' : '#161820',
                    border: `1px solid ${isHov ? 'rgba(255,171,0,0.35)' : 'rgba(255,171,0,0.15)'}`,
                    borderTop: `2px solid ${demo.badgeColor}`,
                    borderRadius: 10, padding: '1.25rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isHov ? `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${demo.badgeColor}15` : 'none',
                  }}
                >
                  {/* Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
                      color: demo.badgeColor, backgroundColor: `${demo.badgeColor}12`,
                      border: `1px solid ${demo.badgeColor}30`,
                    }}>
                      {demo.badge}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#556070' }}>link</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#e3e2e8', marginBottom: 6, lineHeight: 1.3 }}>
                    {demo.label}
                  </h3>

                  {/* URL */}
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {demo.text}
                  </p>

                  {/* Context */}
                  <p style={{ fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc', lineHeight: 1.5, margin: 0 }}>
                    {demo.context}
                  </p>

                  {/* Arrow on hover */}
                  <div style={{
                    position: 'absolute', bottom: 14, right: 14,
                    opacity: isHov ? 1 : 0, transform: isHov ? 'translateX(0)' : 'translateX(6px)',
                    transition: 'all 0.2s',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#FFAB00' }}>arrow_forward</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CLAIM CARDS GRID ── */}
      {filtered.length > 0 && (
        <>
          {showDemoUrls && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF' }}>fact_check</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
                Text Claims
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((s) => {
                const isHovered = hoveredId === s.id;
                const catIcon = CATEGORIES.find(c => c.id === s.category)?.icon || 'lightbulb';
                return (
                  <motion.div
                    layout key={s.id}
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
                    onClick={() => onSelect(s.text)}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      position: 'relative', display: 'flex', flexDirection: 'column',
                      padding: '1.25rem',
                      backgroundColor: isHovered ? '#1c1f2a' : '#161820',
                      border: `1px solid ${isHovered ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                      transition: 'all 0.2s', minHeight: 140,
                      boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(0,229,255,0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ padding: 8, backgroundColor: isHovered ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 8, transition: 'background 0.2s' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', display: 'block' }}>{catIcon}</span>
                      </div>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: isHovered ? '#00E5FF' : '#556070', transition: 'color 0.2s' }}>
                        {s.category}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 13, color: isHovered ? '#e3e2e8' : '#bac9cc', lineHeight: 1.55, marginBottom: '0.75rem', flex: 1, transition: 'color 0.2s' }}>
                      "{s.text}"
                    </h3>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: isHovered ? '#bac9cc' : '#556070', lineHeight: 1.5, transition: 'color 0.2s' }}>
                      {s.context}
                    </p>
                    <div style={{ position: 'absolute', bottom: 14, right: 14, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateX(0)' : 'translateX(6px)', transition: 'all 0.2s' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF' }}>arrow_forward</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {filtered.length === 0 && !showDemoUrls && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#556070', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          No suggestions in this category.
        </div>
      )}
    </motion.div>
  );
}
