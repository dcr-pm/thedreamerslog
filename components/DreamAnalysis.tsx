import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Chat } from '@google/genai';
import { createDreamChat } from '../services/geminiService';
import type { ChatMessage, DreamAnalysisData, DreamContext } from '../types';
import { markdownToSafeHtml, escapeHtml } from '../utils/sanitize';
import {
  Download,
  Copy,
  Check,
  Send,
  Share2,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Info,
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Left Column: Vision */}
            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-7 space-y-8"
            >
                <div className="glass-card overflow-hidden !p-0 group">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                            <Sparkles className="text-dreamy-purple" size={24} />
                            Vision
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
                    <div className="relative aspect-square overflow-hidden">
                        <img 
                            src={analysis.imageUrl} 
                            alt="AI generated representation of the dream" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="p-8 bg-white/5">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-medium-text uppercase tracking-widest font-semibold flex items-center gap-2">
                                    <Share2 size={14} />
                                    Share Vision
                                </span>
                                <div className="flex gap-4">
                                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my dream analysis on The Dreamer\'s Log!')}&url=${encodeURIComponent('https://www.thedreamerslog.com')}`} target="_blank" rel="noopener noreferrer" className="text-medium-text hover:text-white transition-colors"><Share2 size={20} /></a>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.thedreamerslog.com')}`} target="_blank" rel="noopener noreferrer" className="text-medium-text hover:text-white transition-colors"><Share2 size={20} /></a>
                                </div>
                            </div>
                            <div className="h-px flex-grow bg-white/10 hidden md:block mx-8"></div>
                            <p className="text-xs text-medium-text font-mono italic">#TheDreamersLog</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Column: Interpretation */}
            <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-5 space-y-8"
            >
                <div className="glass-card h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                            <Info className="text-dreamy-indigo" size={24} />
                            Interpretation
                        </h2>
                        <button 
                            onClick={handleCopyAnalysis}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-light-text transition-colors"
                            title="Copy Interpretation"
                        >
                            {copiedAnalysis ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
                        <div
                            className="prose prose-invert prose-p:text-medium-text prose-p:leading-relaxed prose-strong:text-dreamy-purple prose-strong:font-bold prose-headings:text-white"
                            dangerouslySetInnerHTML={{
                                __html: markdownToSafeHtml(analysis.interpretation, 'text-dreamy-purple block mt-6 mb-2 uppercase tracking-widest text-xs')
                            }}
                        />
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-dreamy-purple/5 border border-dreamy-purple/10">
                            <Sparkles className="text-dreamy-purple flex-shrink-0 mt-1" size={18} />
                            <p className="text-sm text-medium-text leading-relaxed">
                                This interpretation is woven from Jungian archetypes and psychological symbols. Use it as a guide for your own reflection.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

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
