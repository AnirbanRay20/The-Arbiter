import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all',      label: 'All',        icon: 'apps'              },
  { id: 'tech',     label: 'Technology', icon: 'memory'            },
  { id: 'science',  label: 'Science',    icon: 'science'           },
  { id: 'business', label: 'Business',   icon: 'trending_up'       },
  { id: 'health',   label: 'Health',     icon: 'health_and_safety' },
  { id: 'social',   label: 'Social',     icon: 'public'            },
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

  const filtered = activeTab === 'all'
    ? SUGGESTIONS
    : SUGGESTIONS.filter(s => s.category === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
        padding: '2.5rem 1.5rem 4rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 28, color: '#e3e2e8', marginBottom: 8,
        }}>
          Discovery Engine
        </h2>
        <p style={{
          fontFamily: 'Manrope', fontSize: 14,
          color: '#bac9cc', maxWidth: 540, lineHeight: 1.6,
        }}>
          Explore complex claims across various domains. Click any card to launch
          a forensic verification session.
        </p>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {CATEGORIES.map(cat => {
          const active = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1.1rem',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.2s',
                backgroundColor: active ? '#00E5FF' : 'rgba(255,255,255,0.05)',
                color: active ? '#00363d' : '#bac9cc',
                boxShadow: active ? '0 0 20px rgba(0,229,255,0.25)' : 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e3e2e8'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#bac9cc'; }}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((s) => {
            const isHovered = hoveredId === s.id;
            const catIcon = CATEGORIES.find(c => c.id === s.category)?.icon || 'lightbulb';
            return (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                onClick={() => onSelect(s.text)}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.25rem',
                  backgroundColor: isHovered ? '#1c1f2a' : '#161820',
                  border: `1px solid ${isHovered ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: isHovered
                    ? '0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(0,229,255,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.2)',
                  minHeight: 160,
                }}
              >
                {/* Top row: icon + category label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    padding: 8,
                    backgroundColor: isHovered ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', display: 'block' }}>
                      {catIcon}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'IBM Plex Mono', fontWeight: 700,
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em',
                    color: isHovered ? '#00E5FF' : '#556070',
                    transition: 'color 0.2s',
                  }}>
                    {s.category}
                  </span>
                </div>

                {/* Claim text */}
                <h3 style={{
                  fontFamily: 'Manrope', fontWeight: 500,
                  fontSize: 14, color: isHovered ? '#e3e2e8' : '#bac9cc',
                  lineHeight: 1.55, marginBottom: '0.75rem',
                  flex: 1, transition: 'color 0.2s',
                }}>
                  "{s.text}"
                </h3>

                {/* Context */}
                <p style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 11,
                  color: isHovered ? '#bac9cc' : '#556070',
                  lineHeight: 1.5, transition: 'color 0.2s',
                }}>
                  {s.context}
                </p>

                {/* Arrow on hover */}
                <div style={{
                  position: 'absolute', bottom: 16, right: 16,
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? 'translateX(0)' : 'translateX(6px)',
                  transition: 'all 0.2s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#00E5FF' }}>
                    arrow_forward
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#556070', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          No suggestions found in this category.
        </div>
      )}
    </motion.div>
  );
}
