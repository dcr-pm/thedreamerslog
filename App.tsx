import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, DreamAnalysisData, DreamContext, DreamTags, EMPTY_DREAM_TAGS } from './types';
import * as geminiService from './services/geminiService';
import Recorder from './components/Recorder';
import DreamAnalysis from './components/DreamAnalysis';
import ContextForm from './components/ContextForm';
import LoadingSpinner from './components/LoadingSpinner';
import DreamTagPicker from './components/DreamTagPicker';
import DreamyBackground from './components/DreamyBackground';
import Typewriter from './components/Typewriter';
import { Moon, Sparkles, PenLine, Mic, ArrowLeft, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [transcription, setTranscription] = useState('');
    const [typedDream, setTypedDream] = useState('');
    const [finalDreamText, setFinalDreamText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<DreamAnalysisData | null>(null);
    const [interpretation, setInterpretation] = useState<string | null>(null);
    const [dreamContext, setDreamContext] = useState<DreamContext | null>(null);
    const [dreamTags, setDreamTags] = useState<DreamTags>(EMPTY_DREAM_TAGS);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [audioLevel, setAudioLevel] = useState(0);

    const transcriptionRef = useRef(transcription);
    useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);

    // Warn before leaving if work is in progress
    useEffect(() => {
        const hasWork = appState !== AppState.IDLE && appState !== AppState.COMPLETE;
        if (!hasWork) return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [appState]);

    const recognitionRef = useRef<any>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const levelIntervalRef = useRef<number | null>(null);

    const cleanupAudio = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
            recognitionRef.current = null;
        }
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        if (levelIntervalRef.current) {
            clearInterval(levelIntervalRef.current);
            levelIntervalRef.current = null;
        }
        analyserRef.current = null;
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close();
        }
        audioContextRef.current = null;
        setAudioLevel(0);
    }, []);

    const startAudioLevelMonitor = (stream: MediaStream) => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            levelIntervalRef.current = window.setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
                setAudioLevel(avg / 128); // normalize to 0-2 range
            }, 50);
        } catch {
            // Audio level monitoring is optional
        }
    };

    const handleStartRecording = async () => {
        setError(null);
        setTranscription('');

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            audioStreamRef.current = stream;

            setAppState(AppState.RECORDING);

            // Start audio level monitoring for the visualizer
            startAudioLevelMonitor(stream);

            // Use Web Speech API for transcription
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            let finalTranscript = '';

            recognition.onresult = (event: any) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript + ' ';
                    } else {
                        interim += result[0].transcript;
                    }
                }
                setTranscription(finalTranscript + interim);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone permissions and try again.');
                    handleStopRecording(true);
                } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    // no-speech and aborted are normal when stopping; ignore them
                    setError(`Speech recognition error: ${event.error}. Try again.`);
                }
            };

            recognition.onend = () => {
                // Auto-restart if still in recording state (speech API can time out)
                if (recognitionRef.current && appState === AppState.RECORDING) {
                    try { recognition.start(); } catch {}
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone. Please check permissions and try again.');
            setAppState(AppState.IDLE);
        }
    };

    const handleStopRecording = async (isError = false) => {
        cleanupAudio();
        
        if (isError) {
            setAppState(AppState.IDLE);
            return;
        }

        const currentTranscription = transcriptionRef.current;
        if (currentTranscription.trim().length < 10) {
            setError("Dream recording is too short. Please try again and describe your dream in more detail.");
            setAppState(AppState.IDLE);
            return;
        }

        startAnalysis(currentTranscription);
    };

    const handleTypedSubmit = () => {
        if (typedDream.trim().length < 20) {
            setError("Please provide a bit more detail about your dream (at least 20 characters).");
            return;
        }
        startAnalysis(typedDream);
    };

    const startAnalysis = async (dreamText: string) => {
        setFinalDreamText(dreamText);
        setAppState(AppState.ANALYZING_INTERPRETATION);
        setError(null);

        try {
            setLoadingMessage('Weaving the threads of your subconscious...');
            const interpretationResult = await geminiService.analyzeDream(dreamText, dreamTags);
            setInterpretation(interpretationResult);
            setAppState(AppState.AWAITING_CONTEXT);
        } catch (err) {
            console.error('Interpretation error:', err);
            setError('There was an issue interpreting your dream. Please try again.');
            setAppState(AppState.IDLE);
        } finally {
            setLoadingMessage('');
        }
    };
    
    const handleContextSubmit = async (context: DreamContext) => {
        setDreamContext(context);
        setAppState(AppState.ANALYZING_VISUAL);

        try {
            setLoadingMessage("Crafting your dream's tapestry...");
            const imageUrl = await geminiService.generateDreamImage(finalDreamText, context, dreamTags);

            setAnalysisResult({ imageUrl, interpretation: interpretation! });
            setAppState(AppState.COMPLETE);
        } catch (err) {
            console.error('Image generation error:', err);
            setError('Image generation failed. Your interpretation is saved — try generating the vision again.');
            setAppState(AppState.AWAITING_CONTEXT);
        } finally {
            setLoadingMessage('');
        }
    };

    const handleReset = () => {
        setAppState(AppState.IDLE);
        setTranscription('');
        setTypedDream('');
        setFinalDreamText('');
        setAnalysisResult(null);
        setInterpretation(null);
        setDreamContext(null);
        setDreamTags(EMPTY_DREAM_TAGS);
        setError(null);
    };

    const renderContent = () => {
        switch (appState) {
            case AppState.RECORDING:
                return (
                    <motion.div 
                        key="recording"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="w-full"
                    >
                        <Recorder isRecording={true} transcription={transcription} audioLevel={audioLevel} dreamTags={dreamTags} onTagsChange={setDreamTags} onStopRecording={() => handleStopRecording(false)} />
                    </motion.div>
                );
            case AppState.TYPING:
                return (
                    <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center p-4 md:p-8 py-8 md:py-12 w-full max-w-3xl mx-auto min-h-screen"
                    >
                        <div className="glass-card w-full">
                            <h2 className="text-2xl md:text-4xl font-bold text-light-text mb-4 md:mb-6 font-display flex items-center gap-3">
                                <PenLine className="text-dreamy-purple" />
                                Write Your Dream
                            </h2>
                            <textarea
                                value={typedDream}
                                onChange={(e) => setTypedDream(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleTypedSubmit(); }}
                                placeholder="I was floating above a city made of bioluminescent coral..."
                                className="w-full h-36 md:h-48 bg-white/5 text-light-text p-4 md:p-6 rounded-2xl border border-white/10 focus:border-dreamy-purple focus:ring-2 focus:ring-dreamy-purple/20 outline-none transition-all text-base md:text-lg leading-relaxed"
                            />
                            <div className="flex justify-between mt-2 px-1">
                                <span className={`text-xs ${typedDream.trim().length >= 20 ? 'text-green-400/60' : 'text-medium-text/40'}`}>
                                    {typedDream.trim().length}/20 min
                                </span>
                                <span className="text-xs text-medium-text/40 hidden md:block">Ctrl+Enter to submit</span>
                            </div>
                            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
                                <DreamTagPicker tags={dreamTags} onChange={setDreamTags} compact />
                            </div>
                            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                        </div>
                        {/* Sticky bottom buttons */}
                        <div className="flex gap-3 md:gap-4 mt-6 w-full sticky bottom-4">
                            <button
                                onClick={() => setAppState(AppState.IDLE)}
                                className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-light-text font-bold py-4 px-4 md:px-8 rounded-full transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <button
                                onClick={handleTypedSubmit}
                                className="flex-[2] bg-gradient-to-r from-dreamy-purple to-dreamy-indigo hover:opacity-90 text-white font-bold py-4 px-4 md:px-10 rounded-full transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/20 text-base md:text-lg flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} />
                                Analyze Dream
                            </button>
                        </div>
                    </motion.div>
                );
            case AppState.AWAITING_CONTEXT:
                return (
                    <motion.div 
                        key="context"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full"
                    >
                        <ContextForm onSubmit={handleContextSubmit} interpretation={interpretation || ''} onBack={() => setAppState(AppState.IDLE)} />
                    </motion.div>
                );
            case AppState.COMPLETE:
                return (
                    <motion.div 
                        key="complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full"
                    >
                        <DreamAnalysis 
                            analysis={analysisResult!} 
                            dreamText={finalDreamText} 
                            context={dreamContext} 
                            onReset={handleReset} 
                        />
                    </motion.div>
                );
            case AppState.ANALYZING_INTERPRETATION:
            case AppState.ANALYZING_VISUAL:
                return (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <LoadingSpinner message={loadingMessage} />
                    </motion.div>
                );
            default:
                return (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center text-center p-8 h-screen w-full max-w-4xl mx-auto"
                    >
                        <div className="mb-8 relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 10,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="relative z-10"
                            >
                                <img src="/assets/logo.svg" alt="The Dreamer's Log Logo" className="w-24 h-24 md:w-36 md:h-36 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]" />
                            </motion.div>
                            <div className="absolute inset-0 bg-dreamy-purple/20 blur-[100px] -z-10 rounded-full"></div>
                        </div>

                        <h1 className="text-[clamp(2rem,6.5vw,4.5rem)] font-bold text-white mb-4 font-display tracking-tight leading-none whitespace-nowrap">
                            The Dreamer's <span className="text-transparent bg-clip-text bg-gradient-to-r from-dreamy-purple to-dreamy-indigo">Log</span>
                        </h1>
                        <p className="text-base md:text-lg text-medium-text mb-6 md:mb-10 max-w-xl leading-relaxed font-light min-h-[4em] md:min-h-[3em]">
                            <Typewriter text="Step into the loom of your subconscious. Record your dreams and watch them materialize into art and insight." speed={60} delay={800} />
                        </p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl mb-6 max-w-sm text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                onClick={handleStartRecording}
                                className="flex-1 group relative bg-white text-dark-bg font-bold py-4 px-6 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-2xl shadow-white/10 text-sm"
                            >
                                <Mic size={18} className="group-hover:animate-pulse" />
                                Speak Dream
                            </button>
                            <button
                                onClick={() => setAppState(AppState.TYPING)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm text-sm"
                            >
                                <PenLine size={18} />
                                Write Dream
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-6 text-medium-text/50">
                            <div className="flex items-center gap-1.5">
                                <Moon size={14} />
                                <span className="text-[10px] uppercase tracking-widest font-semibold">Subconscious</span>
                            </div>
                            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <Sparkles size={14} />
                                <span className="text-[10px] uppercase tracking-widest font-semibold">AI Vision</span>
                            </div>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
            
            <DreamyBackground />
        </div>
    );
};

export default App;
