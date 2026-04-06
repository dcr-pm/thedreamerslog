import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { DreamTags } from '../types';
import DreamTagPicker from './DreamTagPicker';

interface RecorderProps {
  isRecording: boolean;
  transcription: string;
  audioLevel: number;
  dreamTags: DreamTags;
  onTagsChange: (tags: DreamTags) => void;
  onStopRecording: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const Recorder: React.FC<RecorderProps> = ({ isRecording, transcription, audioLevel, dreamTags, onTagsChange, onStopRecording }) => {
  const [elapsed, setElapsed] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRecording) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  // Generate bar heights from audio level
  const barCount = 24;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const center = barCount / 2;
    const dist = Math.abs(i - center) / center;
    const height = Math.max(4, audioLevel * (1 - dist * 0.6) * 48 + Math.random() * 4);
    return height;
  });

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-3xl mx-auto h-screen">
      {/* Mic icon with animated rings */}
      <div className="relative mb-8">
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-dreamy-purple/30 rounded-full -z-10"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-dreamy-indigo/30 rounded-full -z-10"
              />
            </>
          )}
        </AnimatePresence>
        <div className="relative glass-card !p-8 rounded-full dreamy-glow">
          <Mic size={48} className={isRecording ? "text-dreamy-purple animate-pulse" : "text-medium-text"} />
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        <span className="text-2xl font-mono text-white font-semibold tracking-wider">{formatTime(elapsed)}</span>
      </div>

      {/* Audio level visualizer */}
      <div className="flex items-end justify-center gap-[3px] h-12 mb-8">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: isRecording ? h : 4 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="w-1 rounded-full bg-gradient-to-t from-dreamy-purple to-dreamy-indigo"
            style={{ minHeight: 4 }}
          />
        ))}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-6 font-display tracking-wide"
      >
        Listening to your dream...
      </motion.h2>

      {/* Transcription area */}
      <div className="glass-card w-full mb-10 min-h-[160px] max-h-[280px] overflow-y-auto relative custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dreamy-purple/50 to-transparent shimmer" />
        <p className="text-lg text-light-text italic leading-relaxed px-2 text-left">
          {transcription || (
            <span className="text-medium-text/50 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Begin speaking...
            </span>
          )}
          <span ref={transcriptEndRef} />
        </p>
      </div>

      {/* Collapsible tags */}
      <div className="w-full mb-8">
        <button
          onClick={() => setShowTags(!showTags)}
          className="flex items-center gap-2 text-sm text-medium-text hover:text-light-text transition-colors mx-auto"
        >
          {showTags ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showTags ? 'Hide context tags' : 'Add context tags (optional)'}
        </button>
        <AnimatePresence>
          {showTags && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card mt-4 !p-5">
                <DreamTagPicker tags={dreamTags} onChange={onTagsChange} compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onStopRecording}
        className="group flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-5 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-red-500/20"
      >
        <Square size={20} fill="currentColor" />
        <span className="text-lg">End Recording</span>
      </button>

      <p className="mt-6 text-medium-text/60 text-sm font-medium uppercase tracking-[0.2em]">
        Speak clearly for best analysis
      </p>
    </div>
  );
};

export default Recorder;
