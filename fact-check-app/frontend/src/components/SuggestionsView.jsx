import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'tech', label: 'Technology', icon: 'memory' },
  { id: 'science', label: 'Science', icon: 'science' },
  { id: 'business', label: 'Business', icon: 'trending_up' },
  { id: 'health', label: 'Health', icon: 'health_and_safety' },
  { id: 'social', label: 'Social', icon: 'public' },
];

const SUGGESTIONS = [
  // Tech
  { id: 1, category: 'tech', text: "Tesla was founded by Elon Musk in 2003", context: "Verification of company origins and founders." },
  { id: 2, category: 'tech', text: "The first iPhone was released in 2005", context: "Checking historical product release dates." },
  { id: 3, category: 'tech', text: "AI will replace 80% of all programming jobs by 2030", context: "Analyzing speculative future predictions." },
  { id: 4, category: 'tech', text: "Bitcoin's maximum supply is 21 million units", context: "Crypto-currency protocol verification." },
  
  // Science
  { id: 5, category: 'science', text: "The Earth is statistically flat based on horizon measurements", context: "Debunking common misinformation." },
  { id: 6, category: 'science', text: "Artemis III will land humans on the Moon in 2026", context: "NASA space mission timeline check." },
  { id: 7, category: 'science', text: "Water becomes most dense at exactly 4 degrees Celsius", context: "Scientific fact verification." },
  { id: 8, category: 'science', text: "The Great Wall of China is visible from the Moon with naked eye", context: "Scientific myth identification." },
  
  // Business
  { id: 9, category: 'business', text: "Apple is the first company to reach a $3 trillion market cap", context: "Financial history and milestones." },
  { id: 10, category: 'business', text: "The global semiconductor market will double by 2030", context: "Market projection analysis." },
  { id: 11, category: 'business', text: "Netflix originally started as a DVD-by-mail service", context: "Company evolution and history." },
  { id: 12, category: 'business', text: "McDonald's is the world's largest owner of real estate", context: "Business model verification." },

  // Health
  { id: 13, category: 'health', text: "Drinking 8 glasses of water a day is a medical requirement", context: "Health myth vs. reality." },
  { id: 14, category: 'health', text: "Human DNA is 99% identical to that of a chimpanzee", context: "Genetics and biology verification." },
  { id: 15, category: 'health', text: "Caffeine significantly reduces the risk of Alzheimer's", context: "Medical research claim checking." },
  { id: 16, category: 'health', text: "The human heart beats about 100,000 times a day", context: "Physiological fact checking." },

  // Social
  { id: 17, category: 'social', text: "The world population reached 8 billion in late 2022", context: "Demographic data verification." },
  { id: 18, category: 'social', text: "Over 50% of the world's population uses social media", context: "Global digital trend analysis." },
  { id: 19, category: 'social', text: "The average person spends 6 months of their life waiting at red lights", context: "Social behavior and statistics." },
  { id: 20, category: 'social', text: "Iceland has no mosquitoes at all", context: "Geographic and biological trivia." },
  { id: 21, category: 'tech', text: "Moore's Law states that the number of transistors on a chip doubles every year", context: "Technology law verification." },
  { id: 22, category: 'science', text: "A light-year is a measurement of time, not distance", context: "Astrophysics concept check." },
];

export default function SuggestionsView({ onSelect }) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredSuggestions = activeTab === 'all' 
    ? SUGGESTIONS 
    : SUGGESTIONS.filter(s => s.category === activeTab);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto py-10 px-4"
    >
      <div className="mb-12">
        <h2 className="text-4xl font-bold font-serif text-white mb-3">Discovery Engine</h2>
        <p className="text-gray-400 text-lg max-w-2xl">
          Explore complex claims across various domains. Click any card to launch a forensic verification session.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-white/5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-xs font-bold uppercase tracking-widest ${
              activeTab === cat.id 
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,229,255,0.3)]' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.map((s) => (
            <motion.button
              layout
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelect(s.text)}
              className="group relative flex flex-col p-6 bg-[#161820] border border-white/5 rounded-2xl text-left transition-all hover:bg-[#1c1f2a] hover:border-cyan-500/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(0,229,255,0.1)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                  <span className="material-symbols-outlined text-cyan-400 text-xl">
                    {CATEGORIES.find(c => c.id === s.category)?.icon || 'lightbulb'}
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-cyan-500 transition-colors">
                  {s.category}
                </span>
              </div>
              
              <h3 className="text-gray-200 font-medium text-base mb-3 leading-relaxed transition-colors group-hover:text-white">
                "{s.text}"
              </h3>
              
              <p className="text-gray-500 text-xs mt-auto group-hover:text-gray-400 transition-colors">
                {s.context}
              </p>

              <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                <span className="material-symbols-outlined text-cyan-400 text-xl">arrow_forward</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 italic">No suggestions found in this category.</p>
        </div>
      )}
    </motion.div>
  );
}
