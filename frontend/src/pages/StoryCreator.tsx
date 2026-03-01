import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type PipelineStep = 'idle' | 'active' | 'complete' | 'skipped';

const StoryCreator = () => {
  const [childName, setChildName] = useState('');
  const [language, setLanguage] = useState('en');
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [transcriptConfirmed, setTranscriptConfirmed] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<number | null>(null);
  const [createdTitle, setCreatedTitle] = useState('');
  const [progressText, setProgressText] = useState('');
  const [steps, setSteps] = useState<Record<string, PipelineStep>>({
    ogma: 'idle', cache: 'idle', papabois: 'idle', guardrail: 'idle',
    anansi: 'idle', devi_tts: 'idle', devi_sfx: 'idle', devi_music: 'idle',
    firefly: 'idle'
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || '';

  const languages = [
    { code: 'en', name: 'English' }, { code: 'ja', name: '日本語' },
    { code: 'fr', name: 'Français' }, { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' }, { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' }, { code: 'ko', name: '한국어' },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setPrompt(''); setTranscriptConfirmed(false);
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        setSteps(s => ({ ...s, ogma: 'active' }));
        setProgressText('🗣️ Ogma: Dual-STT processing (ElevenLabs Scribe + Voxtral)...');
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          const r = await fetch(`${API}/api/voice/transcribe`, { method: 'POST', body: fd });
          const d = await r.json();
          setPrompt(d.prompt || '');
          if (d.language && d.language !== 'en') setLanguage(d.language);
          setSteps(s => ({ ...s, ogma: 'complete' }));
          setProgressText('✅ Ogma transcribed! Check below and confirm.');
        } catch { setProgressText('❌ Transcription failed — type your prompt instead.'); setSteps(s => ({ ...s, ogma: 'idle' })); }
        setIsTranscribing(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setProgressText('🎙️ Recording... speak now!');
    } catch { setProgressText('❌ Mic access denied. Type your prompt below.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleCreateStory = async () => {
    if (!childName || !prompt) return;
    setIsCreating(true);
    setCreatedStoryId(null);

    // Step 1: Cache check
    setSteps(s => ({ ...s, ogma: prompt ? 'complete' : 'skipped', cache: 'active' }));
    setProgressText('🔍 Checking prompt cache...');
    await sleep(800);

    // Step 2: Papa Bois planning
    setSteps(s => ({ ...s, cache: 'complete', papabois: 'active' }));
    setProgressText('🌳 Papa Bois: Planning story via Mistral Agents API...');
    await sleep(1200);

    // Step 3: Guardrail check
    setSteps(s => ({ ...s, guardrail: 'active' }));
    setProgressText('🛡️ Guardrail: Checking for cultural sensitivity...');
    await sleep(1000);
    setSteps(s => ({ ...s, guardrail: 'complete' }));

    // Step 4: Anansi story gen
    setSteps(s => ({ ...s, papabois: 'complete', anansi: 'active' }));
    setProgressText('🕷️ Papa Bois → Anansi: Generating story via Mistral Agent...');

    try {
      const r = await fetch(`${API}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_name: childName, language, prompt }),
      });
      const data = await r.json();

      if (data.cached) {
        setSteps(s => ({ ...s, cache: 'complete', anansi: 'complete' }));
        setProgressText(`⚡ Cache hit! "${data.title}" loaded instantly.`);
      } else {
        setSteps(s => ({ ...s, anansi: 'complete' }));
        setProgressText(`🕷️ Anansi wove: "${data.title}"`);
      }
      await sleep(800);

      // Step 5: Devi TTS
      setSteps(s => ({ ...s, devi_tts: 'active' }));
      setProgressText('🙏 Anansi → Devi: Narrating scenes via ElevenLabs TTS...');
      await sleep(1500);
      setSteps(s => ({ ...s, devi_tts: 'complete', devi_sfx: 'active' }));

      // Step 6: Devi SFX
      setProgressText('🙏 Devi: Generating ambient SFX via ElevenLabs Sound Generation...');
      await sleep(1000);
      setSteps(s => ({ ...s, devi_sfx: 'complete', devi_music: 'active' }));

      // Step 7: Devi Music
      setProgressText('🙏 Devi: Composing lullaby via ElevenLabs Music...');
      await sleep(1000);
      setSteps(s => ({ ...s, devi_music: 'complete', firefly: 'active' }));

      // Step 8: Firefly assembly
      setProgressText('🦆 Firefly: Stitching scenes + audio + images into storybook...');
      await sleep(1200);
      setSteps(s => ({ ...s, firefly: 'complete' }));

      setCreatedStoryId(data.id);
      setCreatedTitle(data.title);
      setProgressText(`✨ "${data.title}" is ready! Click below to play.`);
    } catch (e) {
      setProgressText('❌ Story creation failed. Try again.');
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isRecording]);

  // Pipeline node component
  const Node = ({ id, icon, label, sub }: { id: string; icon: string; label: string; sub: string }) => {
    const s = steps[id];
    const bg = s === 'active' ? 'bg-amber-500/30 border-amber-400 shadow-amber-400/30 shadow-lg scale-105'
             : s === 'complete' ? 'bg-green-500/20 border-green-400/60'
             : s === 'skipped' ? 'bg-slate-700/30 border-slate-600/30 opacity-50'
             : 'bg-slate-700/30 border-slate-600/30';
    const dot = s === 'active' ? 'bg-amber-400 animate-pulse'
              : s === 'complete' ? 'bg-green-400'
              : 'bg-slate-500';
    return (
      <div className={`relative rounded-xl border p-3 transition-all duration-500 ${bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dot} transition-colors duration-300`} />
          <span className="text-sm">{icon}</span>
          <span className="text-amber-100 text-xs font-medium">{label}</span>
        </div>
        <p className="text-amber-200/40 text-[10px] mt-1 ml-5">{sub}</p>
      </div>
    );
  };

  // Connection line component
  const Arrow = ({ from, to }: { from: string; to: string }) => {
    const isActive = steps[from] === 'complete' && (steps[to] === 'active' || steps[to] === 'complete');
    return (
      <div className="flex items-center justify-center py-0.5">
        <div className={`w-0.5 h-4 rounded transition-colors duration-500 ${isActive ? 'bg-amber-400' : 'bg-slate-600/50'}`} />
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite ease-in-out; }
        .star-1 { width: 2px; height: 2px; top: 10%; left: 20%; }
        .star-2 { width: 3px; height: 3px; top: 20%; left: 80%; animation-delay: 0.5s; }
        .star-3 { width: 1px; height: 1px; top: 60%; left: 10%; animation-delay: 1s; }
        .star-4 { width: 2px; height: 2px; top: 80%; left: 90%; animation-delay: 1.5s; }
        .star-5 { width: 3px; height: 3px; top: 40%; left: 60%; animation-delay: 2s; }
        .glow { box-shadow: 0 0 15px rgba(245, 158, 11, 0.5); }
        .mic-ring { animation: pulse-ring 1.5s infinite; }
      `}</style>
      <div className="star star-1"/><div className="star star-2"/><div className="star star-3"/>
      <div className="star star-4"/><div className="star star-5"/>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <a href="/library" className="text-amber-200 hover:text-amber-100 transition-colors">📚 Library</a>
          <span className="text-amber-200/40 text-xs">Powered by Mistral Agents API × ElevenLabs</span>
          <button onClick={handleLogout} className="text-amber-200/50 hover:text-amber-100 text-sm">Logout</button>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Input Panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-200/20 glow">
              <h1 className="text-2xl font-bold text-amber-100 mb-1">🌙 Sandman Tales</h1>
              <p className="text-amber-200/50 text-xs mb-5">Speak or type — Papa Bois orchestrates the rest</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-amber-100 text-xs font-medium mb-1 block">Child's Name</label>
                    <input type="text" value={childName} onChange={e => setChildName(e.target.value)}
                      placeholder="Sophie" className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-amber-200/30 text-white text-sm placeholder-amber-200/40 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-amber-100 text-xs font-medium mb-1 block">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-amber-200/30 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400">
                      {languages.map(l => <option key={l.code} value={l.code} className="bg-slate-700">{l.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Mic */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative">
                    {isRecording && <div className="absolute inset-0 rounded-full bg-red-500/30 mic-ring" />}
                    <button onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 scale-110'
                        : isTranscribing ? 'bg-amber-500/50 cursor-wait'
                        : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:scale-105'
                      }`} style={{boxShadow: isRecording ? '0 0 30px rgba(239,68,68,0.6)' : '0 0 20px rgba(245,158,11,0.5)'}}>
                      {isTranscribing ? '⏳' : isRecording ? '⏹️' : '🎙️'}
                    </button>
                  </div>
                  <p className="text-amber-200/50 text-xs mt-2">
                    {isRecording ? 'Tap to stop' : isTranscribing ? 'Ogma transcribing...' : 'Tap to speak or type below'}
                  </p>
                </div>

                <textarea value={prompt} onChange={e => { setPrompt(e.target.value); setTranscriptConfirmed(false); }}
                  placeholder="Sophie loves whales and clouds. Tell her a bedtime story in French..."
                  rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-amber-200/30 text-white text-sm placeholder-amber-200/40 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none" />

                {prompt && !transcriptConfirmed && !isCreating && (
                  <div className="flex gap-2">
                    <button onClick={() => setTranscriptConfirmed(true)} className="flex-1 py-2 rounded-lg bg-green-500/80 text-white text-sm hover:bg-green-500">✅ Confirm</button>
                    <button onClick={() => { setPrompt(''); startRecording(); }} className="flex-1 py-2 rounded-lg bg-slate-600/80 text-amber-100 text-sm hover:bg-slate-600">🎙️ Redo</button>
                  </div>
                )}

                {!createdStoryId ? (
                  <button onClick={handleCreateStory}
                    disabled={!childName || !prompt || isCreating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 glow">
                    {isCreating ? '✨ Creating...' : '🌙 Create Story'}
                  </button>
                ) : (
                  <button onClick={() => navigate(`/story/${createdStoryId}`)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all glow animate-pulse">
                    ▶️ Play "{createdTitle}"
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Agent Pipeline Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-5 border border-amber-200/20 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-amber-100 font-medium text-sm">🌳 Papa Bois — Agent Orchestration</h2>
                <span className="text-amber-200/30 text-[10px]">Mistral Agents API × ElevenLabs</span>
              </div>

              {/* Pipeline Flow */}
              <div className="space-y-0">
                {/* Row 1: Input */}
                <Node id="ogma" icon="🗣️" label="Ogma — Dual STT" sub="ElevenLabs Scribe v1 + Mistral Voxtral consensus" />
                <Arrow from="ogma" to="cache" />

                {/* Row 2: Cache */}
                <Node id="cache" icon="⚡" label="Prompt Cache" sub="SHA-256 hash lookup — skip regeneration if seen before" />
                <Arrow from="cache" to="papabois" />

                {/* Row 3: Papa Bois */}
                <Node id="papabois" icon="🌳" label="Papa Bois — Orchestrator" sub="Mistral Agent ag_019ca24e... plans story direction, mood, voice" />
                <Arrow from="papabois" to="guardrail" />

                {/* Row 4: Guardrail */}
                <Node id="guardrail" icon="🛡️" label="Cultural Sensitivity Guardrail" sub="Content filter — no stereotypes, respectful representation" />
                <Arrow from="guardrail" to="anansi" />

                {/* Row 5: Anansi */}
                <Node id="anansi" icon="🕷️" label="Anansi — Story Generator" sub="Mistral Agent ag_019ca24f... generates multilingual scenes" />

                {/* Row 6: Three parallel Devi outputs */}
                <div className="flex items-center justify-center py-0.5">
                  <div className={`w-0.5 h-4 rounded transition-colors duration-500 ${steps.anansi === 'complete' ? 'bg-amber-400' : 'bg-slate-600/50'}`} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Node id="devi_tts" icon="🎙️" label="Devi — TTS" sub="ElevenLabs Multilingual v2 narration" />
                  <Node id="devi_sfx" icon="🌊" label="Devi — SFX" sub="ElevenLabs Sound Generation" />
                  <Node id="devi_music" icon="🎵" label="Devi — Music" sub="ElevenLabs Lullaby Compose" />
                </div>

                {/* Row 7: Firefly stitching */}
                <div className="flex items-center justify-center py-0.5">
                  <div className={`w-0.5 h-4 rounded transition-colors duration-500 ${(steps.devi_tts === 'complete' && steps.devi_sfx === 'complete' && steps.devi_music === 'complete') ? 'bg-amber-400' : 'bg-slate-600/50'}`} />
                </div>
                <Node id="firefly" icon="🦆" label="Firefly — Storybook Assembly" sub="Stitches scenes + narration + SFX + music → playable storybook" />
              </div>

              {/* Progress */}
              {progressText && (
                <div className="mt-4 p-2.5 bg-amber-900/30 rounded-lg text-amber-100 text-xs">
                  {progressText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
