import React from 'react';
import { motion } from 'motion/react';
import { Heart, Compass, Lightbulb, Sparkles } from 'lucide-react';
import { escapeHtml } from '../utils/sanitize';

interface Section {
  title: string;
  content: string;
  bullets: { symbol: string; explanation: string }[];
}

function parseInterpretation(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n');

  let currentSection: Section | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for section heading: **Core Emotional Theme** etc.
    const headingMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (headingMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: headingMatch[1].replace(/\*/g, ''), content: '', bullets: [] };
      continue;
    }

    if (!currentSection) {
      currentSection = { title: 'Overview', content: '', bullets: [] };
    }

    // Check for bullet: - Symbol: explanation
    const bulletMatch = trimmed.match(/^[-•]\s*(.+?):\s*(.+)$/);
    if (bulletMatch) {
      currentSection.bullets.push({ symbol: bulletMatch[1].replace(/\*/g, ''), explanation: bulletMatch[2].replace(/\*/g, '') });
      continue;
    }

    // Regular paragraph text — strip markdown bold/italic
    const clean = trimmed.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
    currentSection.content += (currentSection.content ? ' ' : '') + clean;
  }

  if (currentSection) sections.push(currentSection);
  return sections;
}

const sectionMeta: Record<string, { icon: React.ReactNode; gradient: string }> = {
  'core emotional theme': {
    icon: <Heart size={20} />,
    gradient: 'from-rose-500/20 to-pink-500/10',
  },
  'key symbols & archetypes': {
    icon: <Compass size={20} />,
    gradient: 'from-dreamy-purple/20 to-dreamy-indigo/10',
  },
  'key symbols and archetypes': {
    icon: <Compass size={20} />,
    gradient: 'from-dreamy-purple/20 to-dreamy-indigo/10',
  },
  'potential interpretation': {
    icon: <Lightbulb size={20} />,
    gradient: 'from-amber-500/15 to-orange-500/10',
  },
};

function getMeta(title: string) {
  const key = title.toLowerCase();
  return sectionMeta[key] || { icon: <Sparkles size={20} />, gradient: 'from-dreamy-purple/20 to-dreamy-indigo/10' };
}

interface InterpretationCardsProps {
  text: string;
}

const InterpretationCards: React.FC<InterpretationCardsProps> = ({ text }) => {
  const sections = parseInterpretation(text);

  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        const meta = getMeta(section.title);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${meta.gradient} backdrop-blur-sm overflow-hidden`}
          >
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-3">
              <div className="p-2 rounded-xl bg-white/5 text-dreamy-purple">
                {meta.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-dreamy-purple">
                {section.title}
              </h3>
            </div>

            {/* Card body */}
            <div className="px-6 pb-6">
              {section.content && (
                <p className="text-medium-text leading-relaxed text-[15px]">
                  {section.content}
                </p>
              )}

              {section.bullets.length > 0 && (
                <div className="space-y-3 mt-2">
                  {section.bullets.map((bullet, j) => (
                    <div key={j} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-1 rounded-full bg-dreamy-purple/50 flex-shrink-0" />
                      <div>
                        <span className="text-dreamy-purple font-semibold text-sm">{escapeHtml(bullet.symbol)}</span>
                        <p className="text-medium-text text-sm leading-relaxed mt-0.5">{bullet.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-dreamy-purple/5 border border-dreamy-purple/10">
        <Sparkles className="text-dreamy-purple flex-shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-medium-text leading-relaxed">
          Woven from Jungian archetypes and psychological symbols. Use as a guide for your own reflection.
        </p>
      </div>
    </div>
  );
};

export default InterpretationCards;
