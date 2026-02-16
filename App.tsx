
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CameraFeed } from './components/CameraFeed';
import { TranslationBox } from './components/TranslationBox';
import { AppState, TranslationResult } from './types';
import { geminiService } from './services/gemini';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [state, setState] = useState<AppState & { isGeneratingSentence: boolean }>({
    isCapturing: false,
    isCameraOn: true,
    history: [],
    lastError: null,
    currentTranslation: '',
    currentSentence: '',
    isProcessing: false,
    isGeneratingSentence: false,
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleCapture = useCallback(async (base64Image: string) => {
    setState(prev => ({ ...prev, isProcessing: true, lastError: null }));

    try {
      const translation = await geminiService.translateSign(base64Image);
      
      const isRealSign = translation && translation !== 'NO_SIGN_DETECTED';

      setState(prev => {
        if (!isRealSign) {
          return {
            ...prev,
            isProcessing: false,
            currentTranslation: 'NO_SIGN_DETECTED'
          };
        }

        const words = prev.currentSentence.split(' ').filter(w => w.length > 0);
        const lastWordInSentence = words[words.length - 1];
        
        let nextSentence = prev.currentSentence;
        if (lastWordInSentence?.toLowerCase() !== translation.toLowerCase()) {
          nextSentence = prev.currentSentence 
            ? `${prev.currentSentence} ${translation}` 
            : translation;
        }

        const newResult: TranslationResult = {
          id: crypto.randomUUID(),
          text: translation,
          timestamp: Date.now(),
          confidence: 0.95,
        };

        const lastHistoryItem = prev.history[prev.history.length - 1];
        const newHistory = lastHistoryItem?.text === translation 
          ? prev.history 
          : [...prev.history, newResult].slice(-15);

        return {
          ...prev,
          currentTranslation: translation,
          currentSentence: nextSentence,
          history: newHistory,
          isProcessing: false,
        };
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastError: error.message || "Translation failed",
      }));
    }
  }, []);

  const handleGenerateSentence = async () => {
    if (!state.currentSentence) return;
    
    setState(prev => ({ ...prev, isGeneratingSentence: true }));
    try {
      const polished = await geminiService.polishSentence(state.currentSentence);
      setState(prev => ({ 
        ...prev, 
        currentSentence: polished, 
        isGeneratingSentence: false 
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isGeneratingSentence: false }));
    }
  };

  const toggleCapturing = () => {
    if (!state.isCameraOn) return;
    setState(prev => ({ ...prev, isCapturing: !prev.isCapturing }));
  };

  const toggleCamera = () => {
    setState(prev => {
      const nextCameraState = !prev.isCameraOn;
      return {
        ...prev,
        isCameraOn: nextCameraState,
        isCapturing: nextCameraState ? prev.isCapturing : false,
        currentTranslation: nextCameraState ? prev.currentTranslation : ''
      };
    });
  };

  const clearHistory = () => {
    setState(prev => ({ ...prev, history: [] }));
  };

  const clearSentence = () => {
    setState(prev => ({ ...prev, currentSentence: '', currentTranslation: '' }));
  };

  const headerActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
        title="Toggle Dark Mode"
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      <button
        onClick={toggleCamera}
        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
          state.isCameraOn
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700'
        }`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${state.isCameraOn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
        <span className="hidden sm:inline">{state.isCameraOn ? 'Camera ON' : 'Camera OFF'}</span>
      </button>
    </div>
  );

  return (
    <Layout headerActions={headerActions}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Interpreter</h2>
                <p className="text-base text-slate-400 dark:text-slate-500 font-medium">Capture signs in real-time to generate sentences</p>
              </div>
              <button
                onClick={toggleCapturing}
                disabled={!state.isCameraOn}
                className={`flex items-center justify-center space-x-3 px-10 py-5 rounded-2xl font-extrabold transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  state.isCapturing
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 ring-2 ring-rose-200 dark:ring-rose-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-50 dark:ring-indigo-900/20'
                }`}
              >
                {state.isCapturing ? (
                  <>
                    <div className="w-3.5 h-3.5 bg-rose-600 dark:bg-rose-500 rounded-full animate-pulse" />
                    <span>Stop Interpretation</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Start Session</span>
                  </>
                )}
              </button>
            </div>

            <CameraFeed 
              onCapture={handleCapture}
              isProcessing={state.isProcessing}
              isCapturing={state.isCapturing}
              isCameraOn={state.isCameraOn}
            />

            {state.lastError && (
              <div className="mt-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl flex items-center space-x-4 text-rose-700 dark:text-rose-400 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wider">Analysis Error</p>
                  <p className="text-sm font-medium opacity-80">{state.lastError}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-400/30">
                  <span className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em]">Guidance</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">Mastering Translation</h3>
                <p className="text-slate-400 dark:text-slate-500 text-base leading-relaxed font-medium">
                  Construct complex thoughts by performing signs in sequence. Use the <strong>AI Fix</strong> button to turn raw keywords into natural sentences.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-[1.25rem] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">01</div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200">Capture Keywords</span>
                    <span className="text-xs text-slate-500 font-medium italic">Detected signs will appear below</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-[1.25rem] border border-white/10 hover:bg-white/10 transition-all cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">02</div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200">Polish with AI</span>
                    <span className="text-xs text-slate-500 font-medium italic">Click 'AI Fix' to refine grammar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 h-full sticky top-28">
          <div className="h-[calc(100vh-14rem)] min-h-[650px]">
            <TranslationBox 
              current={state.currentTranslation}
              currentSentence={state.currentSentence}
              history={state.history}
              isGeneratingSentence={state.isGeneratingSentence}
              onClearHistory={clearHistory}
              onClearSentence={clearSentence}
              onGenerateAISentence={handleGenerateSentence}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
