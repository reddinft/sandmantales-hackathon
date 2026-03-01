import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const StoryPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<any>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sfxPlaying, setSfxPlaying] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [activeSentence, setActiveSentence] = useState(-1);
  const [showCaptions, setShowCaptions] = useState(true);
  const sentenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sfxRef = useRef<HTMLAudioElement>(null);
  const lullabyRef = useRef<HTMLAudioElement>(null);
  const stopRef = useRef(false);
  const API = import.meta.env.VITE_API_URL || '';

  const splitSentences = (text: string): string[] => {
    return text.match(/[^.!?]+[.!?'\u201D\u00BB\u300D\uFF09]+|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [text];
  };

  const startCaptionSync = (text: string, audioDuration: number) => {
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    const sentences = splitSentences(text);
    if (sentences.length === 0) return;
    const timePerSentence = (audioDuration * 1000) / sentences.length;
    let idx = 0;
    setActiveSentence(0);
    sentenceTimerRef.current = setInterval(() => {
      idx++;
      if (idx >= sentences.length) {
        if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
        setActiveSentence(-1);
        return;
      }
      setActiveSentence(idx);
    }, timePerSentence);
  };

  const stopCaptionSync = () => {
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    setActiveSentence(-1);
  };

  useEffect(() => {
    fetch(`${API}/api/stories/${id}`)
      .then(r => r.json())
      .then(setStory)
      .catch(console.error);
  }, [id]);

  const fetchAudio = async (sceneKey: string): Promise<string | null> => {
    if (story?.has_audio?.[sceneKey]) {
      try {
        const res = await fetch(`${API}/api/stories/${id}/audio/${sceneKey}`);
        if (res.ok) {
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }
      } catch {}
    }
    if (story?.scenes?.[parseInt(sceneKey)]) {
      const res = await fetch(`${API}/api/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: story.scenes[parseInt(sceneKey)],
          voice_id: story.voice_id || 'pNInz6obpgDQGcFmaJgB',
          language: story.language || 'en'
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    }
    return null;
  };

  const handleListen = async () => {
    if (isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    setIsLoading(true);
    const url = await fetchAudio(String(currentSceneIndex));
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current && showCaptions) {
          startCaptionSync(story.scenes[currentSceneIndex], audioRef.current.duration);
        }
      };
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
    setIsLoading(false);
  };

  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    setAutoPlaying(false);
    stopCaptionSync();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (sfxRef.current) { sfxRef.current.pause(); sfxRef.current.currentTime = 0; }
    if (lullabyRef.current) { lullabyRef.current.pause(); lullabyRef.current.currentTime = 0; }
    setIsPlaying(false);
    setIsPaused(false);
    setSfxPlaying(false);
  };

  const handleRestart = async () => {
    handleStop();
    setCurrentSceneIndex(0);
    await new Promise(r => setTimeout(r, 100));
    stopRef.current = false;
    setAutoPlaying(true);
    startAutoPlay(0);
  };

  const toggleAmbient = async () => {
    if (sfxPlaying) {
      sfxRef.current?.pause();
      lullabyRef.current?.pause();
      setSfxPlaying(false);
      return;
    }
    if (story?.has_audio?.sfx) {
      try {
        const res = await fetch(`${API}/api/stories/${id}/audio/sfx`);
        if (res.ok && sfxRef.current) {
          const blob = await res.blob();
          sfxRef.current.src = URL.createObjectURL(blob);
          sfxRef.current.volume = 0.3;
          sfxRef.current.loop = true;
          sfxRef.current.play();
        }
      } catch {}
    }
    if (story?.has_audio?.lullaby) {
      try {
        const res = await fetch(`${API}/api/stories/${id}/audio/lullaby`);
        if (res.ok && lullabyRef.current) {
          const blob = await res.blob();
          lullabyRef.current.src = URL.createObjectURL(blob);
          lullabyRef.current.volume = 0.2;
          lullabyRef.current.loop = true;
          lullabyRef.current.play();
        }
      } catch {}
    }
    setSfxPlaying(true);
  };

  const startAutoPlay = async (fromScene: number) => {
    if (!story?.scenes) return;
    if (!sfxPlaying) toggleAmbient();
    for (let i = fromScene; i < story.scenes.length; i++) {
      if (stopRef.current) break;
      setCurrentSceneIndex(i);
      setIsLoading(true);
      const url = await fetchAudio(String(i));
      if (stopRef.current) break;
      if (url && audioRef.current) {
        audioRef.current.src = url;
        setIsPlaying(true);
        setIsLoading(false);
        await new Promise<void>(resolve => {
          audioRef.current!.onloadedmetadata = () => {
            if (audioRef.current && showCaptions) {
              startCaptionSync(story.scenes[i], audioRef.current.duration);
            }
          };
          audioRef.current!.onended = () => { stopCaptionSync(); resolve(); };
          audioRef.current!.play();
        });
        if (stopRef.current) break;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!stopRef.current) { setIsPlaying(false); setAutoPlaying(false); }
  };

  const handleAutoPlay = async () => {
    stopRef.current = false;
    setAutoPlaying(true);
    startAutoPlay(currentSceneIndex);
  };

  if (!story) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center">
      <p className="text-amber-100 text-xl">✨ Loading story...</p>
    </div>
  );

  const scene = story.scenes?.[currentSceneIndex] || '';
  const hasCachedAudio = story.has_audio && Object.keys(story.has_audio).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite ease-in-out; }
        .star-1 { width: 2px; height: 2px; top: 10%; left: 20%; }
        .star-2 { width: 3px; height: 3px; top: 20%; left: 80%; animation-delay: 0.5s; }
        .star-3 { width: 1px; height: 1px; top: 60%; left: 10%; animation-delay: 1s; }
        .star-4 { width: 2px; height: 2px; top: 80%; left: 90%; animation-delay: 1.5s; }
        .star-5 { width: 3px; height: 3px; top: 40%; left: 60%; animation-delay: 2s; }
      `}</style>
      <div className="star star-1"/><div className="star star-2"/><div className="star star-3"/><div className="star star-4"/><div className="star star-5"/>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <Link to="/library" className="text-amber-200 hover:text-amber-100 transition-colors">← Library</Link>
          <Link to="/" className="text-amber-200 hover:text-amber-100 transition-colors">+ New Story</Link>
        </div>

        <div className="max-w-3xl mx-auto bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 border border-amber-200/20" style={{boxShadow: '0 0 15px rgba(245,158,11,0.3)'}}>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-amber-100">{story.title}</h1>
            <p className="text-amber-200/60 mt-1">
              👤 {story.child_name} · 🌐 {story.language?.toUpperCase()} · ✨ {story.mood}
              {hasCachedAudio && <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">⚡ Instant Audio</span>}
              {story.has_images?.img_0 && <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">🎨 Illustrated</span>}
            </p>
          </div>

          {hasCachedAudio && (
            <div className="flex justify-center gap-4 mb-4">
              <button onClick={toggleAmbient}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${sfxPlaying ? 'bg-purple-500/50 text-purple-100' : 'bg-slate-700/50 text-amber-200/60 hover:bg-slate-700'}`}>
                {sfxPlaying ? '🔊 Ambient ON' : '🔇 Ambient OFF'}
              </button>
              <button onClick={() => setShowCaptions(!showCaptions)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${showCaptions ? 'bg-amber-500/50 text-amber-100' : 'bg-slate-700/50 text-amber-200/60 hover:bg-slate-700'}`}>
                {showCaptions ? '📖 CC ON' : '📖 CC OFF'}
              </button>
              <div className="flex items-center gap-2 text-amber-200/40 text-xs">
                <span>🎙️ Narration 100%</span> · <span>🌊 SFX 30%</span> · <span>🎵 Lullaby 20%</span>
              </div>
            </div>
          )}

          <div className="bg-slate-700/30 rounded-2xl p-6 mb-6 min-h-[200px]">
            {story.has_images?.[`img_${currentSceneIndex}`] && (
              <div className="mb-4 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={`${API}/api/stories/${id}/image/${currentSceneIndex}`}
                  alt={`Scene ${currentSceneIndex + 1} illustration`}
                  className="w-full h-auto max-h-[400px] object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="relative">
              {showCaptions && activeSentence >= 0 && (
                <div className="mb-3 p-3 bg-black/40 backdrop-blur rounded-xl border border-amber-400/30">
                  <p className="text-amber-100 text-lg font-medium text-center leading-relaxed">
                    📖 {splitSentences(scene)[activeSentence] || ''}
                  </p>
                </div>
              )}
              <p className="text-amber-50 text-lg leading-relaxed">
                {splitSentences(scene).map((s, idx) => (
                  <span key={idx} className={`transition-all duration-300 ${
                    activeSentence === idx
                      ? 'text-amber-300 font-semibold bg-amber-400/10 rounded px-0.5'
                      : activeSentence >= 0 && activeSentence !== idx
                      ? 'text-amber-50/40'
                      : ''
                  }`}>{s}{' '}</span>
                ))}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
                disabled={currentSceneIndex === 0}
                className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-30 transition-colors">◀</button>
              <span className="text-amber-100 text-sm">Scene {currentSceneIndex + 1} / {story.scenes?.length || 0}</span>
              <button onClick={() => setCurrentSceneIndex(Math.min((story.scenes?.length || 1) - 1, currentSceneIndex + 1))}
                disabled={currentSceneIndex >= (story.scenes?.length || 1) - 1}
                className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-30 transition-colors">▶</button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {isPlaying ? (
                <button onClick={handlePause}
                  className="px-4 py-2 rounded-xl bg-amber-500/80 text-white font-medium hover:bg-amber-500 transition-all">
                  ⏸ Pause
                </button>
              ) : (
                <button onClick={handleListen} disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500/80 text-white font-medium hover:bg-amber-500 transition-all disabled:opacity-50">
                  {isLoading ? '⏳' : isPaused ? '▶ Resume' : '🎧 Listen'}
                </button>
              )}

              {(isPlaying || isPaused || autoPlaying) && (
                <button onClick={handleStop}
                  className="px-4 py-2 rounded-xl bg-red-500/70 text-white font-medium hover:bg-red-500 transition-all">
                  ⏹ Stop
                </button>
              )}

              <button onClick={handleRestart}
                className="px-4 py-2 rounded-xl bg-slate-600/70 text-amber-100 font-medium hover:bg-slate-600 transition-all">
                ↻ Restart
              </button>

              {!autoPlaying && (
                <button onClick={handleAutoPlay} disabled={isPlaying || isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50">
                  🌙 Play All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setIsPaused(false); stopCaptionSync(); }} />
      <audio ref={sfxRef} />
      <audio ref={lullabyRef} />
    </div>
  );
};

export default StoryPlayer;
