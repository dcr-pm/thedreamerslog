import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Cloud } from 'lucide-react';

const dreamFacts = [
  "The average person has about 4-6 dreams per night, but most are forgotten upon waking.",
  "Dreams are often a way for your subconscious to process emotions and events from your day.",
  "Recurring dreams may signify an unresolved conflict or a persistent stressor in your life.",
  "Lucid dreaming is the state of being aware you are dreaming, sometimes allowing you to control the dream.",
  "Not everyone dreams in color. Some studies suggest about 12% of people dream exclusively in black and white.",
  "Even people who have been blind from birth experience dreams, though they are based on sound, touch, and emotion rather than sight."
];

interface LoadingSpinnerProps {
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prevIndex) => (prevIndex + 1) % dreamFacts.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowSlowMessage(false);
    const timer = setTimeout(() => setShowSlowMessage(true), 15000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-screen w-full max-w-2xl mx-auto">
        <div className="relative mb-16">
            {/* Ethereal Loading Animation */}
            <motion.div 
                animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                }}
                transition={{ 
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-32 h-32 rounded-full border-2 border-dashed border-dreamy-purple/30 flex items-center justify-center"
            >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-dreamy-indigo/30 flex items-center justify-center">
                    <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-dreamy-purple"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                </div>
            </motion.div>
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -100],
                        x: [0, (i % 2 === 0 ? 30 : -30)],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full"
                />
            ))}
        </div>

        <motion.h2
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-4 font-display tracking-wide"
        >
            {message}
        </motion.h2>
        <AnimatePresence>
            {showSlowMessage && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-medium-text/60 mb-8"
                >
                    Taking a bit longer than usual — hang tight...
                </motion.p>
            )}
        </AnimatePresence>

        <div className="glass-card w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dreamy-purple/30 to-transparent"></div>
            <div className="flex items-center gap-4 mb-4 text-dreamy-purple/60">
                <Moon size={16} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Dream Lore</span>
            </div>
            <AnimatePresence mode="wait">
                <motion.p 
                    key={factIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.8 }}
                    className="text-lg text-medium-text italic leading-relaxed font-light"
                >
                    "{dreamFacts[factIndex]}"
                </motion.p>
            </AnimatePresence>
        </div>
        
        <div className="mt-12 flex items-center gap-3 text-medium-text/40">
            <Cloud size={16} />
            <span className="text-xs font-medium uppercase tracking-widest">Weaving subconscious threads</span>
        </div>
    </div>
  );
};

export default LoadingSpinner;
