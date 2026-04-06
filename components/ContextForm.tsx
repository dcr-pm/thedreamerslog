import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { DreamContext } from '../types';
import InterpretationCards from './InterpretationCards';
import { Sparkles, Heart, Sun, User, PlusCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface ContextFormProps {
  interpretation: string;
  onSubmit: (context: DreamContext) => void;
  onBack?: () => void;
}

const ContextForm: React.FC<ContextFormProps> = ({ interpretation, onSubmit, onBack }) => {
    const [context, setContext] = useState<DreamContext>({
        emotion: '',
        wakingFeeling: '',
        conclusion: '',
        personDescription: '',
        additionalInfo: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setContext({ ...context, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(context);
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-12 text-light-text min-h-screen flex flex-col justify-center">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-display tracking-tight">Refine the <span className="text-transparent bg-clip-text bg-gradient-to-r from-dreamy-purple to-dreamy-indigo">Vision</span></h1>
                <p className="text-xl text-medium-text font-light">Add a few more threads to the tapestry before we materialize it.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Interpretation Summary */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 font-display flex items-center gap-3">
                        <Sparkles className="text-dreamy-purple" size={24} />
                        Initial Insight
                    </h2>
                    <InterpretationCards text={interpretation} />
                </motion.div>
                
                {/* Right: Form */}
                <motion.form 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    onSubmit={handleSubmit} 
                    className="lg:col-span-7 glass-card space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="emotion" className="text-xs font-bold uppercase tracking-widest text-medium-text flex items-center gap-2">
                                <Heart size={14} className="text-dreamy-purple" />
                                Primary Emotion
                            </label>
                            <input 
                                type="text" 
                                name="emotion" 
                                id="emotion" 
                                value={context.emotion} 
                                onChange={handleChange} 
                                placeholder="Fear, Joy, Confusion..." 
                                className="w-full bg-white/5 text-light-text p-4 rounded-xl border border-white/10 focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="wakingFeeling" className="text-xs font-bold uppercase tracking-widest text-medium-text flex items-center gap-2">
                                <Sun size={14} className="text-dreamy-indigo" />
                                Waking Feeling
                            </label>
                            <input 
                                type="text" 
                                name="wakingFeeling" 
                                id="wakingFeeling" 
                                value={context.wakingFeeling} 
                                onChange={handleChange} 
                                placeholder="Relieved, Anxious, Happy..." 
                                className="w-full bg-white/5 text-light-text p-4 rounded-xl border border-white/10 focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="conclusion" className="text-xs font-bold uppercase tracking-widest text-medium-text flex items-center gap-2">
                            <Sparkles size={14} className="text-dreamy-purple" />
                            Dream Conclusion
                        </label>
                        <select 
                            name="conclusion" 
                            id="conclusion" 
                            value={context.conclusion} 
                            onChange={handleChange} 
                            className="w-full bg-white/5 text-light-text p-4 rounded-xl border border-white/10 focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple outline-none transition-all appearance-none"
                        >
                            <option value="" className="bg-dark-bg">Select an option</option>
                            <option value="reached a natural conclusion" className="bg-dark-bg">Yes, it had a natural ending.</option>
                            <option value="was cut short abruptly" className="bg-dark-bg">No, it was cut short abruptly.</option>
                            <option value="was a continuous loop" className="bg-dark-bg">It felt like a continuous loop.</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="personDescription" className="text-xs font-bold uppercase tracking-widest text-medium-text flex items-center gap-2">
                            <User size={14} className="text-dreamy-indigo" />
                            Significant Person
                        </label>
                        <textarea 
                            name="personDescription" 
                            id="personDescription" 
                            value={context.personDescription} 
                            onChange={handleChange} 
                            rows={2} 
                            placeholder="Describe a key figure... (e.g., A tall figure in a dark coat)" 
                            className="w-full bg-white/5 text-light-text p-4 rounded-xl border border-white/10 focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="additionalInfo" className="text-xs font-bold uppercase tracking-widest text-medium-text flex items-center gap-2">
                            <PlusCircle size={14} className="text-dreamy-purple" />
                            Standout Details
                        </label>
                        <textarea 
                            name="additionalInfo" 
                            id="additionalInfo" 
                            value={context.additionalInfo} 
                            onChange={handleChange} 
                            rows={2} 
                            placeholder="Strange objects, recurring numbers, or specific places..." 
                            className="w-full bg-white/5 text-light-text p-4 rounded-xl border border-white/10 focus:ring-2 focus:ring-dreamy-purple/50 focus:border-dreamy-purple outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="bg-white/5 hover:bg-white/10 text-light-text font-bold py-5 px-6 rounded-2xl transition-all border border-white/10 flex items-center gap-2"
                            >
                                <ArrowLeft size={20} />
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-dreamy-purple to-dreamy-indigo hover:opacity-90 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-purple-500/20 text-lg flex items-center justify-center gap-3"
                        >
                            Generate Dream Vision
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
};

export default ContextForm;
