import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecorderProps {
  isRecording: boolean;
  transcription: string;
  onStopRecording: () => void;
}

const Recorder: React.FC<RecorderProps> = ({ isRecording, transcription, onStopRecording }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 w-full max-w-3xl mx-auto h-screen">
      <div className="relative mb-12">
        {/* Animated Rings */}
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

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-white mb-6 font-display tracking-wide"
      >
        {isRecording ? "Listening to your dream..." : "Ready to record"}
      </motion.h2>

      <div className="glass-card w-full mb-12 min-h-[160px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dreamy-purple/50 to-transparent animate-shimmer"></div>
        <p className="text-xl text-light-text italic leading-relaxed px-4">
          {transcription || (
            <span className="text-medium-text/50 flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Begin speaking...
            </span>
          )}
        </p>
      </div>

      <button
        onClick={onStopRecording}
        className="group flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-5 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-red-500/20"
      >
        <Square size={20} fill="currentColor" />
        <span className="text-lg">End Recording</span>
      </button>
      
      <p className="mt-8 text-medium-text/60 text-sm font-medium uppercase tracking-[0.2em]">
        Speak clearly for best analysis
      </p>
    </div>
  );
};

export default Recorder;
