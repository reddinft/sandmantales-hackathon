import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, narrateScene, type Story, type Scene } from '@/lib/api';

export default function StoryPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;
    getStory(id).then(s => { setStory(s); setLoading(false); }).catch(() => { setError('Story not found'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!story || audioUrls[currentScene]) return;
    const scene = story.scenes[currentScene];
    if (scene?.audio_url) {
      setAudioUrls(prev => ({ ...prev, [currentScene]: scene.audio_url! }));
    } else if (scene) {
      narrateScene(scene.text, story.language)
        .then(url => setAudioUrls(prev => ({ ...prev, [currentScene]: url })))
        .catch(() => {});
    }
  }, [story, currentScene, audioUrls]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const goToScene = (idx: number) => {
    if (!story || idx < 0 || idx >= story.scenes.length) return;
    setCurrentScene(idx);
    setPlaying(false);
    setProgress(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(100);
    if (story && currentScene < story.scenes.length - 1) {
      setTimeout(() => goToScene(currentScene + 1), 1500);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !story) return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-red-400">{error || 'Story not found'}</div>
  );

  const scene = story.scenes[currentScene];
  const audioUrl = audioUrls[currentScene];

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Nav */}
      <nav className="h-14 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center px-6">
        <button onClick={() => navigate('/library')} className="text-indigo-400 font-bold text-lg hover:text-indigo-300">Sandman Tales</button>
        <span className="mx-auto text-white font-medium truncate max-w-md">{story.title}</span>
        <span className="text-zinc-400 text-sm">{currentScene + 1} / {story.scenes.length}</span>
      </nav>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main scene panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Illustration */}
          <div className="bg-zinc-800 rounded-xl flex-1 min-h-0 flex items-center justify-center border border-zinc-700/50 overflow-hidden">
            {scene?.image_url ? (
              <img src={scene.image_url} alt={scene.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-zinc-600 text-4xl mb-2">🎨</div>
                <p className="text-zinc-500 text-sm">Scene Illustration</p>
                <p className="text-zinc-600 text-xs mt-1">FLUX.1-schnell</p>
              </div>
            )}
          </div>

          {/* Scene text */}
          <div className="mt-4 px-2">
            <h3 className="text-white text-lg font-semibold mb-2">{scene?.title || `Scene ${currentScene + 1}`}</h3>
            <p className="text-zinc-200 text-base leading-relaxed">{scene?.text}</p>
            {scene?.mood && <p className="text-amber-500 text-sm mt-3 font-medium">Mood: {scene.mood}</p>}
          </div>

          {/* Audio player */}
          <div className="mt-4 bg-zinc-800 rounded-full px-4 py-3 flex items-center gap-4 border border-zinc-700/50">
            <button onClick={togglePlay} disabled={!audioUrl}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${audioUrl ? 'bg-green-500 hover:bg-green-400' : 'bg-zinc-700'}`}>
              {playing ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-zinc-500 text-xs shrink-0">ElevenLabs</span>
          </div>

          {/* Navigation arrows */}
          <div className="mt-3 flex justify-between">
            <button onClick={() => goToScene(currentScene - 1)} disabled={currentScene === 0}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 text-sm transition-all">
              ← Previous
            </button>
            <button onClick={() => goToScene(currentScene + 1)} disabled={currentScene >= story.scenes.length - 1}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 text-sm transition-all">
              Next →
            </button>
          </div>
        </div>

        {/* Scene sidebar */}
        <div className="w-72 shrink-0 bg-zinc-800 rounded-xl border border-zinc-700/50 flex flex-col overflow-hidden">
          <h2 className="text-white font-bold text-center py-3 border-b border-zinc-700/50">Scenes</h2>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {story.scenes.map((s, i) => (
              <button key={i} onClick={() => goToScene(i)}
                className={`w-full text-left p-3 rounded-lg transition-all ${i === currentScene ? 'bg-indigo-500 text-white' : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'}`}>
                <p className="text-sm font-medium truncate">{i + 1}. {s.title || `Scene ${i + 1}`}</p>
                <p className={`text-xs mt-1 truncate ${i === currentScene ? 'text-indigo-200' : 'text-zinc-500'}`}>{s.mood}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}
    </div>
  );
}
