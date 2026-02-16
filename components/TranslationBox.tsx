
import React, { useEffect, useState, useCallback } from 'react';
import { TranslationResult } from '../types';

interface TranslationBoxProps {
  current: string;
  currentSentence: string;
  history: TranslationResult[];
  isGeneratingSentence?: boolean;
  onClearHistory: () => void;
  onClearSentence: () => void;
  onGenerateAISentence: () => void;
}

interface TTSSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
}

export const TranslationBox: React.FC<TranslationBoxProps> = ({ 
  current, 
  currentSentence, 
  history, 
  isGeneratingSentence = false,
  onClearHistory,
  onClearSentence,
  onGenerateAISentence
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>(() => {
    const saved = localStorage.getItem('tts-settings');
    return saved ? JSON.parse(saved) : {
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0
    };
  });

  // Load voices and set default
  const updateVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Set a default voice if none selected or the selected one isn't available
    if (availableVoices.length > 0) {
      const exists = availableVoices.some(v => v.voiceURI === settings.voiceURI);
      if (!settings.voiceURI || !exists) {
        const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
        setSettings(prev => ({ ...prev, voiceURI: defaultVoice.voiceURI }));
      }
    }
  }, [settings.voiceURI]);

  useEffect(() => {
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [updateVoices]);

  useEffect(() => {
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentSentence) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentSentence]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isNoSign = current === 'No clear sign found' || current === 'NO_SIGN_DETECTED';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 border border-transparent dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Speech Engine</h4>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Voice Profile</label>
                <select 
                  value={settings.voiceURI}
                  onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  {voices.map(voice => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Tempo</label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md">{settings.rate.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={settings.rate}
                  onChange={(e) => setSettings({ ...settings, rate: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Pitch</label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md">{settings.pitch.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={settings.pitch}
                  onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
              </div>

              <button 
                onClick={() => speakText("This is how I will sound.")}
                className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Test Voice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Live Sentence</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
            title="Speech Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={onClearSentence}
            className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 px-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
        {/* Main Sentence Output */}
        <div className="relative group/box">
          <div className={`min-h-[160px] p-8 rounded-2xl border-2 transition-all duration-300 relative ${
            currentSentence 
              ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-none' 
              : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-200 dark:border-slate-700'
          }`}>
            {isGeneratingSentence && (
              <div className="absolute inset-0 bg-indigo-600/50 dark:bg-indigo-500/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Constructing...</span>
                </div>
              </div>
            )}
            
            <p className={`text-2xl font-semibold leading-relaxed ${
              currentSentence ? 'text-white' : 'text-slate-400 dark:text-slate-600 text-center flex flex-col items-center justify-center h-full'
            } ${isAnimating ? 'scale-[1.02]' : 'scale-100'} transition-transform`}>
              {currentSentence || (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Sign to start translating
                </>
              )}
            </p>
          </div>
          
          <div className="absolute -bottom-6 left-4 right-4 flex justify-center items-center gap-3">
             <button 
              onClick={onGenerateAISentence}
              disabled={!currentSentence || isGeneratingSentence}
              className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 h-12 px-5 rounded-2xl shadow-xl dark:shadow-none border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-0 disabled:pointer-events-none flex items-center space-x-2.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest">AI Fix</span>
            </button>

            <button 
              onClick={() => speakText(currentSentence)}
              disabled={!currentSentence}
              className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 h-12 px-6 rounded-2xl shadow-xl dark:shadow-none border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-0 disabled:pointer-events-none flex items-center space-x-2.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest">Speak</span>
            </button>
          </div>
        </div>

        {/* Current detection buffer */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Visual Recognition</label>
            {isNoSign && <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold uppercase tracking-tighter">Waiting...</span>}
          </div>
          <div className={`p-5 rounded-2xl border-2 transition-all ${!isNoSign && current ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold tracking-tight">
                {!isNoSign && current ? current : '---'}
              </span>
              {!isNoSign && current && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Captured</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Log */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Vocabulary Log</label>
            <button 
              onClick={onClearHistory} 
              className="flex items-center space-x-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors uppercase tracking-widest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Purge History</span>
            </button>
          </div>
          <div className="space-y-2.5">
            {history.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400 dark:text-slate-600 font-medium italic">Your session history is empty.</p>
              </div>
            ) : (
              history.slice().reverse().map((item) => (
                <div key={item.id} className="group/item flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover/item:bg-indigo-400 transition-colors" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight">{item.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600 font-black font-mono tracking-tighter">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
