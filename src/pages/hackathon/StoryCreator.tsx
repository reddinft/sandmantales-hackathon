import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateStory, transcribeVoice } from '../../lib/api';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
  { code: 'fr', label: 'FR', name: 'French' },
  { code: 'hi', label: 'HI', name: 'Hindi' },
];

const LOADING_STEPS = [
  'Generating your story with Mistral Large 3...',
  'Crafting scene illustrations...',
  'Recording narration with ElevenLabs...',
  'Almost ready...',
];

export default function StoryCreator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleRecord = async () => {
    if (recording) {
      mediaRecorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        try {
          const text = await transcribeVoice(blob);
          setPrompt(prev => prev ? `${prev} ${text}` : text);
        } catch { setError('Voice transcription failed. Try typing instead.'); }
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch { setError('Microphone access denied.'); }
  };

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setLoadingStep(0);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 4000);
    try {
      const story = await generateStory(prompt, language);
      clearInterval(stepInterval);
      navigate(`/play/${story.id}`);
    } catch {
      clearInterval(stepInterval);
      setError('Story generation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      <nav className="h-14 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center px-6">
        <span className="text-indigo-400 font-bold text-lg">Sandman Tales</span>
        <span className="ml-auto text-zinc-500 text-sm">ClawCutters</span>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-zinc-800 rounded-2xl p-8 shadow-2xl border border-zinc-700/50">
            <h1 className="text-2xl font-bold text-white text-center">Create a Bedtime Story</h1>
            <p className="text-zinc-400 text-center mt-1 mb-6">Tell us what your child dreams about</p>

            <div className="relative">
              <textarea
                value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="A brave little fox who discovers a magical forest where the trees sing lullabies..."
                className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-xl p-4 pr-14 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
              <button onClick={handleRecord} disabled={loading}
                className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-red-500 animate-pulse' : 'bg-indigo-500 hover:bg-indigo-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
              <span className="absolute right-3 bottom-3 text-amber-500 text-xs font-medium">
                {recording ? 'Recording...' : 'Voxtral'}
              </span>
            </div>

            <div className="mt-5">
              <label className="text-zinc-400 text-sm mb-2 block">Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => setLanguage(lang.code)} disabled={loading}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${language === lang.code ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
              <p className="text-zinc-500 text-xs mt-1.5">{LANGUAGES.find(l => l.code === language)?.name}</p>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            {loading ? (
              <div className="mt-6 space-y-3">
                {LOADING_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${i <= loadingStep ? 'opacity-100' : 'opacity-20'}`}>
                    {i < loadingStep ? (
                      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : i === loadingStep ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-zinc-600 shrink-0" />
                    )}
                    <span className={`text-sm ${i <= loadingStep ? 'text-white' : 'text-zinc-500'}`}>{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={handleCreate} disabled={!prompt.trim()}
                className="mt-6 w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xl font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none">
                ✨ Create Story
              </button>
            )}
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-zinc-600 text-xs">
        Powered by Mistral Large 3 &nbsp;|&nbsp; Voices by ElevenLabs &nbsp;|&nbsp; Built by ClawCutters
      </footer>
    </div>
  );
}
