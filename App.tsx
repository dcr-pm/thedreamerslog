import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, DreamAnalysisData, DreamContext } from './types';
import * as geminiService from './services/geminiService';
import { createBlob } from './utils/audio';
import Recorder from './components/Recorder';
import DreamAnalysis from './components/DreamAnalysis';
import ContextForm from './components/ContextForm';
import LoadingSpinner from './components/LoadingSpinner';
import { Moon, Sparkles, PenLine, Mic, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [transcription, setTranscription] = useState('');
    const [typedDream, setTypedDream] = useState('');
    const [finalDreamText, setFinalDreamText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<DreamAnalysisData | null>(null);
    const [interpretation, setInterpretation] = useState<string | null>(null);
    const [dreamContext, setDreamContext] = useState<DreamContext | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const transcriptionRef = useRef(transcription);
    useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const processorNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const cleanupAudio = useCallback(() => {
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        processorNodeRef.current?.disconnect();
        sourceNodeRef.current?.disconnect();
        if (audioContextRef.current?.state !== 'closed') {
            audioContextRef.current?.close();
        }

        audioStreamRef.current = null;
        processorNodeRef.current = null;
        sourceNodeRef.current = null;
        audioContextRef.current = null;
    }, []);

    const handleStartRecording = async () => {
        setError(null);
        setTranscription('');

        // Check if API key is selected (required for some models)
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
                // After opening, we assume they selected it or will try again
                return;
            }
        }

        setAppState(AppState.RECORDING);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                },
            });
            audioStreamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

            const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                setError('No API key found. Please select a key or check your environment.');
                setAppState(AppState.IDLE);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-3.1-flash-live-preview',
                callbacks: {
                    onopen: async () => {
                        const ctx = audioContextRef.current!;
                        sourceNodeRef.current = ctx.createMediaStreamSource(stream);

                        const sendAudioChunk = (float32Data: Float32Array) => {
                            const pcmBlob = createBlob(float32Data);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ audio: pcmBlob });
                            });
                        };

                        // Try AudioWorklet first, fall back to ScriptProcessorNode
                        try {
                            await ctx.audioWorklet.addModule('/utils/audioWorkletProcessor.js');
                            const workletNode = new AudioWorkletNode(ctx, 'pcm-processor');
                            workletNode.port.onmessage = (event) => {
                                sendAudioChunk(event.data);
                            };
                            sourceNodeRef.current.connect(workletNode);
                            workletNode.connect(ctx.destination);
                            processorNodeRef.current = workletNode;
                        } catch {
                            // Fallback for browsers without AudioWorklet support
                            const scriptNode = ctx.createScriptProcessor(2048, 1, 1);
                            scriptNode.onaudioprocess = (e) => {
                                sendAudioChunk(e.inputBuffer.getChannelData(0));
                            };
                            sourceNodeRef.current.connect(scriptNode);
                            scriptNode.connect(ctx.destination);
                            processorNodeRef.current = scriptNode;
                        }
                    },
                    onmessage: (message: LiveServerMessage) => {
                        // Handle transcription from both possible field names to be robust
                        const content = message.serverContent as any;
                        const transcriptionPart = content?.inputAudioTranscription || content?.inputTranscription;
                        if (transcriptionPart) {
                            const text = transcriptionPart.text;
                            setTranscription(prev => prev + (text || ''));
                        }
                    },
                    onerror: (e: any) => {
                        console.error('Live API Error (Detailed):', {
                            message: e?.message,
                            name: e?.name,
                            stack: e?.stack,
                            code: e?.code,
                            reason: e?.reason,
                            raw: e
                        });
                        const errorMsg = e?.message || e?.reason || '';
                        if (errorMsg.includes('Requested entity was not found') || errorMsg.includes('API key not valid')) {
                            setError('API Key error. Please select a valid key.');
                            if (typeof window !== 'undefined' && (window as any).aistudio) {
                                (window as any).aistudio.openSelectKey();
                            }
                        } else {
                            setError(`Connection error: ${errorMsg || 'Please check your internet and try again.'}`);
                        }
                        handleStopRecording(true);
                    },
                    onclose: () => {
                        cleanupAudio();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
            });
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone. Please check permissions and try again.');
            setAppState(AppState.IDLE);
        }
    };

    const handleStopRecording = async (isError = false) => {
        try {
            const session = await sessionPromiseRef.current;
            session?.close();
        } catch {
            // Session may already be closed or failed to connect
        }
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
            const interpretationResult = await geminiService.analyzeDream(dreamText);
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
            const imageUrl = await geminiService.generateDreamImage(finalDreamText, context);

            setAnalysisResult({ imageUrl, interpretation: interpretation! });
            setAppState(AppState.COMPLETE);
        } catch (err) {
            console.error('Image generation error:', err);
            setError('There was an issue generating the dream image. Please try again.');
            setAppState(AppState.IDLE);
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
                        <Recorder isRecording={true} transcription={transcription} onStopRecording={() => handleStopRecording(false)} />
                    </motion.div>
                );
            case AppState.TYPING:
                return (
                    <motion.div 
                        key="typing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center p-8 h-full min-h-screen w-full max-w-3xl mx-auto"
                    >
                        <div className="glass-card w-full">
                            <h2 className="text-4xl font-bold text-light-text mb-6 font-display flex items-center gap-3">
                                <PenLine className="text-dreamy-purple" />
                                Write Your Dream
                            </h2>
                            <textarea
                                value={typedDream}
                                onChange={(e) => setTypedDream(e.target.value)}
                                placeholder="I was floating above a city made of bioluminescent coral..."
                                className="w-full h-64 bg-white/5 text-light-text p-6 rounded-2xl border border-white/10 focus:border-dreamy-purple focus:ring-2 focus:ring-dreamy-purple/20 outline-none transition-all text-lg leading-relaxed"
                            />
                            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setAppState(AppState.IDLE)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-light-text font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleTypedSubmit}
                                    className="flex-[2] bg-gradient-to-r from-dreamy-purple to-dreamy-indigo hover:opacity-90 text-white font-bold py-4 px-10 rounded-full transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/20 text-lg flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={20} />
                                    Analyze Dream
                                </button>
                            </div>
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
                        <ContextForm onSubmit={handleContextSubmit} interpretation={interpretation || ''} />
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
                        <div className="mb-12 relative">
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
                                <img src="/assets/logo.svg" alt="The Dreamer's Log Logo" className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]" />
                            </motion.div>
                            <div className="absolute inset-0 bg-dreamy-purple/20 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                            The Dreamer's <span className="text-transparent bg-clip-text bg-gradient-to-r from-dreamy-purple to-dreamy-indigo">Log</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-medium-text mb-12 max-w-2xl leading-relaxed font-light">
                            Step into the loom of your subconscious. Record your dreams and watch them materialize into art and insight.
                        </p>
                        
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 max-w-md"
                            >
                                {error}
                            </motion.div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                            <button
                                onClick={handleStartRecording}
                                className="flex-1 group relative bg-white text-dark-bg font-bold py-5 px-8 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
                            >
                                <Mic className="group-hover:animate-pulse" />
                                Speak Dream
                            </button>
                            <button
                                onClick={() => setAppState(AppState.TYPING)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 px-8 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 backdrop-blur-sm"
                            >
                                <PenLine />
                                Write Dream
                            </button>
                        </div>
                        
                        <div className="mt-16 flex items-center gap-8 text-medium-text/50">
                            <div className="flex items-center gap-2">
                                <Moon size={16} />
                                <span className="text-xs uppercase tracking-widest font-semibold">Subconscious</span>
                            </div>
                            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} />
                                <span className="text-xs uppercase tracking-widest font-semibold">AI Vision</span>
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
            
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dreamy-purple/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dreamy-indigo/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
        </div>
    );
};

export default App;
