
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
  const [settings, setSettings] = useState<TTSSettings>({
    voiceURI: '',
    rate: 0.9,
    pitch: 1.0
  });

  // Load voices and set default
  const updateVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Set a default voice if none selected
    if (!settings.voiceURI && availableVoices.length > 0) {
      const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
      setSettings(prev => ({ ...prev, voiceURI: defaultVoice.voiceURI }));
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
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 tracking-tight">Speech Settings</h4>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Select Voice</label>
                <select 
                  value={settings.voiceURI}
                  onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {voices.map(voice => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Speaking Rate</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{settings.rate.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={settings.rate}
                  onChange={(e) => setSettings({ ...settings, rate: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Pitch</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{settings.pitch.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={settings.pitch}
                  onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button 
                onClick={() => {
                  speakText("This is how I will sound.");
                }}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
              >
                Test Voice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800">Sentence Builder</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Speech Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={onClearSentence}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors py-1 px-2 rounded-md hover:bg-red-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
        {/* Main Sentence Output */}
        <div className="relative group/box">
          <div className={`min-h-[140px] p-6 rounded-2xl border-2 transition-all duration-300 relative ${
            currentSentence 
              ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100' 
              : 'bg-slate-50 border-dashed border-slate-200'
          }`}>
            {isGeneratingSentence && (
              <div className="absolute inset-0 bg-indigo-600/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Constructing...</span>
                </div>
              </div>
            )}
            
            <p className={`text-2xl font-semibold leading-relaxed ${
              currentSentence ? 'text-white' : 'text-slate-400 text-center flex flex-col items-center justify-center h-full'
            } ${isAnimating ? 'scale-[1.02]' : 'scale-100'} transition-transform`}>
              {currentSentence || (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start signing to build a sentence
                </>
              )}
            </p>
          </div>
          
          <div className="absolute -bottom-5 left-4 right-4 flex justify-between items-center px-2">
             <button 
              onClick={onGenerateAISentence}
              disabled={!currentSentence || isGeneratingSentence}
              className="bg-white text-indigo-600 px-4 py-2.5 rounded-xl shadow-lg border border-indigo-100 hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-0 disabled:pointer-events-none flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-wider">AI Fix</span>
            </button>

            {currentSentence && (
              <button 
                onClick={() => speakText(currentSentence)}
                className="bg-white text-indigo-600 p-2.5 rounded-xl shadow-lg border border-indigo-100 hover:scale-110 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Current detection buffer */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Active Word</label>
            {isNoSign && <span className="text-[10px] text-slate-300 italic">Listening...</span>}
          </div>
          <div className={`p-4 rounded-xl border transition-colors ${!isNoSign && current ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {!isNoSign && current ? current : '---'}
              </span>
              {!isNoSign && current && (
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Confirmed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Recent Vocabulary</label>
            <button onClick={onClearHistory} className="text-[10px] text-slate-400 hover:text-indigo-600">Clear Log</button>
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 italic">No signs recorded yet.</p>
              </div>
            ) : (
              history.slice().reverse().map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                  <span className="font-semibold text-slate-700">{item.text}</span>
                  <span className="text-[10px] text-slate-300 font-mono">
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
