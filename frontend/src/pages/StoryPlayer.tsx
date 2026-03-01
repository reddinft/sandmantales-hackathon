import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const StoryPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<any>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sfxPlaying, setSfxPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sfxRef = useRef<HTMLAudioElement>(null);
  const lullabyRef = useRef<HTMLAudioElement>(null);
  const API = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API}/api/stories/${id}`)
      .then(r => r.json())
      .then(setStory)
      .catch(console.error);
  }, [id]);

  const fetchAudio = async (sceneKey: string): Promise<string | null> => {
    // Try cached audio first
    if (story?.has_audio?.[sceneKey]) {
      try {
        const res = await fetch(`${API}/api/stories/${id}/audio/${sceneKey}`);
        if (res.ok) {
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }
      } catch {}
    }
    // Fall back to live TTS
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
    setIsLoading(true);
    const url = await fetchAudio(String(currentSceneIndex));
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
    setIsLoading(false);
  };

  const toggleAmbient = async () => {
    if (sfxPlaying) {
      sfxRef.current?.pause();
      lullabyRef.current?.pause();
      setSfxPlaying(false);
      return;
    }
    // Start ambient layers
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

  const handleAutoPlay = async () => {
    if (!story?.scenes) return;
    // Start ambient
    if (!sfxPlaying) toggleAmbient();
    
    for (let i = currentSceneIndex; i < story.scenes.length; i++) {
      setCurrentSceneIndex(i);
      setIsLoading(true);
      const url = await fetchAudio(String(i));
      if (url && audioRef.current) {
        audioRef.current.src = url;
        setIsPlaying(true);
        setIsLoading(false);
        await new Promise<void>(resolve => {
          audioRef.current!.onended = () => resolve();
          audioRef.current!.play();
        });
        // Small pause between scenes
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    setIsPlaying(false);
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
            </p>
          </div>

          {/* 3-Layer Audio Controls */}
          {hasCachedAudio && (
            <div className="flex justify-center gap-4 mb-4">
              <button onClick={toggleAmbient}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${sfxPlaying ? 'bg-purple-500/50 text-purple-100' : 'bg-slate-700/50 text-amber-200/60 hover:bg-slate-700'}`}>
                {sfxPlaying ? '🔊 Ambient ON' : '🔇 Ambient OFF'}
              </button>
              <div className="flex items-center gap-2 text-amber-200/40 text-xs">
                <span>🎙️ Narration 100%</span>
                <span>·</span>
                <span>🌊 SFX 30%</span>
                <span>·</span>
                <span>🎵 Lullaby 20%</span>
              </div>
            </div>
          )}

          <div className="bg-slate-700/30 rounded-2xl p-6 mb-6 min-h-[200px]">
            <p className="text-amber-50 text-lg leading-relaxed">{scene}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
                disabled={currentSceneIndex === 0}
                className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-30 transition-colors">
                ◀
              </button>
              <span className="text-amber-100 text-sm">
                Scene {currentSceneIndex + 1} / {story.scenes?.length || 0}
              </span>
              <button onClick={() => setCurrentSceneIndex(Math.min((story.scenes?.length || 1) - 1, currentSceneIndex + 1))}
                disabled={currentSceneIndex >= (story.scenes?.length || 1) - 1}
                className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-30 transition-colors">
                ▶
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={handleListen} disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-amber-500/80 text-white font-medium hover:bg-amber-500 transition-all disabled:opacity-50">
                {isLoading ? '⏳' : isPlaying ? '🔊 Playing' : '🎧 Listen'}
              </button>
              <button onClick={handleAutoPlay} disabled={isPlaying || isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50">
                🌙 Play All
              </button>
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      <audio ref={sfxRef} />
      <audio ref={lullabyRef} />
    </div>
  );
};

export default StoryPlayer;
