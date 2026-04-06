import React from 'react';
import { motion } from 'motion/react';
import type { DreamTags } from '../types';

interface TagGroup {
  key: keyof DreamTags;
  label: string;
  options: string[];
  multi: boolean;
}

const TAG_GROUPS: TagGroup[] = [
  {
    key: 'mood',
    label: 'Mood (select all that apply)',
    options: ['Peaceful', 'Anxious', 'Joyful', 'Fearful', 'Confused', 'Melancholic', 'Excited', 'Angry'],
    multi: true,
  },
  {
    key: 'theme',
    label: 'Themes (select all that apply)',
    options: ['Flying', 'Falling', 'Chasing', 'Water', 'Death', 'Animals', 'People', 'Places', 'Lost', 'Love'],
    multi: true,
  },
  {
    key: 'intensity',
    label: 'Intensity',
    options: ['Faint', 'Mild', 'Vivid', 'Hyper-vivid'],
    multi: false,
  },
  {
    key: 'lucidity',
    label: 'Awareness',
    options: ['Not aware', 'Slightly aware', 'Lucid', 'Fully controlled'],
    multi: false,
  },
  {
    key: 'recurrence',
    label: 'Recurrence',
    options: ['First time', 'Recurring', 'Variation of past dream'],
    multi: false,
  },
  {
    key: 'gender',
    label: 'I identify as',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    multi: false,
  },
];

interface DreamTagPickerProps {
  tags: DreamTags;
  onChange: (tags: DreamTags) => void;
  compact?: boolean;
}

const DreamTagPicker: React.FC<DreamTagPickerProps> = ({ tags, onChange, compact }) => {
  const handleSelect = (group: TagGroup, value: string) => {
    if (group.multi) {
      const current = tags[group.key] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      onChange({ ...tags, [group.key]: updated });
    } else {
      const current = tags[group.key] as string | null;
      onChange({ ...tags, [group.key]: current === value ? null : value });
    }
  };

  const isSelected = (group: TagGroup, value: string): boolean => {
    if (group.multi) {
      return (tags[group.key] as string[]).includes(value);
    }
    return tags[group.key] === value;
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <p className="text-xs text-medium-text uppercase tracking-widest font-semibold mb-2">
        Optional context tags
      </p>
      {TAG_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="text-xs text-medium-text/60 mb-1.5 font-medium">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const selected = isSelected(group, option);
              return (
                <motion.button
                  key={option}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(group, option)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selected
                      ? 'bg-dreamy-purple/20 border-dreamy-purple/50 text-dreamy-purple'
                      : 'bg-white/5 border-white/10 text-medium-text hover:bg-white/10 hover:text-light-text'
                  }`}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DreamTagPicker;
