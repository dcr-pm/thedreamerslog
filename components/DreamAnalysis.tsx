import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Chat } from '@google/genai';
import { createDreamChat } from '../services/geminiService';
import type { ChatMessage, DreamAnalysisData, DreamContext } from '../types';
import { escapeHtml } from '../utils/sanitize';
import InterpretationCards from './InterpretationCards';
import {
  Download,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Info,
  Home,
} from 'lucide-react';

interface DreamAnalysisProps {
  analysis: DreamAnalysisData;
  dreamText: string;
  context: DreamContext | null;
  onReset: () => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end ${isModel ? 'justify-start' : 'justify-end'} mb-6`}
    >
      <div className={`max-w-[85%] p-5 rounded-2xl ${isModel ? 'bg-white/5 border border-white/10 text-light-text' : 'bg-gradient-to-br from-dreamy-purple to-dreamy-indigo text-white shadow-lg shadow-purple-500/20'}`}>
        <p className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: escapeHtml(message.text).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}/>
      </div>
    </motion.div>
  );
};

const SHARE_TEXT = "Check out my dream analysis on The Dreamer's Log! ✨🌙";
const SHARE_URL = 'https://www.thedreamerslog.com';

const SocialIcon: React.FC<{ d: string; viewBox?: string }> = ({ d, viewBox = '0 0 24 24' }) => (
  <svg viewBox={viewBox} fill="currentColor" className="w-5 h-5"><path d={d} /></svg>
);

/** Convert a base64 data URL to a File object for sharing */
async function imageUrlToFile(dataUrl: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], 'dream-vision.png', { type: 'image/png' });
  } catch {
    return null;
  }
}

/** Try native share with the image file. Returns true if successful. */
async function nativeShareWithImage(imageUrl: string): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) return false;
  const file = await imageUrlToFile(imageUrl);
  if (!file) return false;
  const shareData = {
    title: "The Dreamer's Log",
    text: SHARE_TEXT,
    url: SHARE_URL,
    files: [file],
  };
  if (!navigator.canShare(shareData)) return false;
  try {
    await navigator.share(shareData);
    return true;
  } catch {
    return false; // user cancelled
  }
}

interface SocialPlatform {
  name: string;
  icon: string;
  fallbackUrl: string;
}

const platforms: SocialPlatform[] = [
  {
    name: 'Instagram',
    icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    fallbackUrl: '',
  },
  {
    name: 'TikTok',
    icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    fallbackUrl: '',
  },
  {
    name: 'X',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    fallbackUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: 'Facebook',
    icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    fallbackUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: 'WhatsApp',
    icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    fallbackUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(SHARE_TEXT + ' ' + SHARE_URL)}`,
  },
];

const DreamAnalysis: React.FC<DreamAnalysisProps> = ({ analysis, dreamText, context, onReset }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatting]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isChatting) return;

    setIsChatting(true);
    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');

    if (!chatRef.current) {
      chatRef.current = createDreamChat(dreamText, context);
    }

    try {
      const response = await chatRef.current.sendMessage(userInput);
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "The dream weave is tangled. Please try asking again." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };
  
  const handleDownload = () => {
      const link = document.createElement('a');
      link.href = analysis.imageUrl;
      link.download = 'dream-vision.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleCopyImage = async () => {
    try {
      const response = await fetch(analysis.imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  const handleCopyAnalysis = async () => {
    const plainTextInterpretation = analysis.interpretation.replace(/\*\*/g, '');
    try {
        await navigator.clipboard.writeText(plainTextInterpretation);
        setCopiedAnalysis(true);
        setTimeout(() => setCopiedAnalysis(false), 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-12 text-light-text">
        {/* Home button */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
        >
            <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-medium-text hover:text-white transition-all text-sm font-medium"
            >
                <Home size={16} />
                Home
            </button>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
        >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-dreamy-purple text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <Sparkles size={14} />
                Analysis Complete
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 font-display tracking-tight">Your Dream, <span className="text-transparent bg-clip-text bg-gradient-to-r from-dreamy-purple to-dreamy-indigo">Unveiled</span></h1>
            <p className="text-xl text-medium-text font-light">A journey through the symbols of your subconscious.</p>
        </motion.div>
        
        {/* Vision Sketch */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
        >
            <div className="glass-card overflow-hidden !p-0 group max-w-4xl mx-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                        <Sparkles className="text-dreamy-purple" size={24} />
                        Vision Sketch
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-light-text transition-colors"
                            title="Download Image"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={handleCopyImage}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-light-text transition-colors"
                            title="Copy Image"
                        >
                            {copiedImage ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
                <div className="relative overflow-hidden">
                    <img
                        src={analysis.imageUrl}
                        alt="AI generated representation of the dream"
                        className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="p-6 bg-white/5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <span className="text-xs text-medium-text uppercase tracking-widest font-semibold">Share</span>
                            <div className="flex gap-3">
                                {platforms.map((platform) => (
                                    <button
                                        key={platform.name}
                                        onClick={async () => {
                                            const shared = await nativeShareWithImage(analysis.imageUrl);
                                            if (!shared && platform.fallbackUrl) {
                                                window.open(platform.fallbackUrl, '_blank', 'noopener,noreferrer');
                                            } else if (!shared && !platform.fallbackUrl) {
                                                // Instagram/TikTok with no fallback - try plain native share
                                                try {
                                                    await navigator.share({ title: "The Dreamer's Log", text: SHARE_TEXT, url: SHARE_URL });
                                                } catch { /* user cancelled */ }
                                            }
                                        }}
                                        title={`Share on ${platform.name}`}
                                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-medium-text hover:text-white transition-colors"
                                    >
                                        <SocialIcon d={platform.icon} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-medium-text font-mono italic">#TheDreamersLog</p>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Interpretation Cards */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12 max-w-4xl mx-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                    <Info className="text-dreamy-indigo" size={24} />
                    Dream Interpretation
                </h2>
                <button
                    onClick={handleCopyAnalysis}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-light-text transition-colors"
                    title="Copy Interpretation"
                >
                    {copiedAnalysis ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
            </div>
            <InterpretationCards text={analysis.interpretation} />
        </motion.div>

        {/* Chat Section */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card mb-12"
        >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                        <MessageCircle className="text-dreamy-purple" size={24} />
                        Explore Further
                    </h2>
                    <p className="text-sm text-medium-text mt-1">Ask the AI guide about specific symbols or feelings.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-medium-text font-mono">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    AI EXPERT ONLINE
                </div>
            </div>

            <div 
                ref={chatContainerRef} 
                className="h-[400px] overflow-y-auto mb-8 pr-4 custom-scrollbar flex flex-col"
            >
                {chatHistory.length === 0 && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <MessageCircle className="text-medium-text/30" size={32} />
                        </div>
                        <p className="text-medium-text italic max-w-xs">
                            "What does the recurring ocean signify?" or "Why was the shadow following me?"
                        </p>
                    </div>
                )}
                {chatHistory.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isChatting && (
                    <div className="flex justify-start mb-6">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-light-text flex items-center gap-2">
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }} 
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-1.5 h-1.5 bg-dreamy-purple rounded-full"
                            />
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }} 
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                className="w-1.5 h-1.5 bg-dreamy-purple rounded-full"
                            />
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }} 
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                className="w-1.5 h-1.5 bg-dreamy-purple rounded-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about a symbol, feeling, or theme..."
                    className="w-full bg-white/5 text-light-text placeholder-medium-text/50 p-5 pr-16 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple transition-all text-lg"
                    disabled={isChatting}
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={isChatting || !userInput.trim()} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-dreamy-purple text-white rounded-xl hover:bg-dreamy-indigo disabled:bg-white/5 disabled:text-medium-text transition-all transform hover:scale-105"
                >
                    <Send size={20} />
                </button>
            </div>
        </motion.div>

        {/* Reset Button */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
        >
            <button
                onClick={onReset}
                className="group inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 text-light-text font-bold py-5 px-10 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                Record Another Dream
            </button>
        </motion.div>
    </div>
  );
};

export default DreamAnalysis;
