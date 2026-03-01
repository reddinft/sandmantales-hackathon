import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StoryLibrary = () => {
  const [stories, setStories] = useState<any[]>([]);
  const API = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API}/api/stories`)
      .then(r => r.json())
      .then(setStories)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 relative overflow-hidden">
      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite ease-in-out; }
        .star-1 { width: 2px; height: 2px; top: 10%; left: 20%; }
        .star-2 { width: 3px; height: 3px; top: 20%; left: 80%; animation-delay: 0.5s; }
        .star-3 { width: 1px; height: 1px; top: 60%; left: 10%; animation-delay: 1s; }
      `}</style>
      <div className="star star-1"/><div className="star star-2"/><div className="star star-3"/>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-100">📚 Story Library</h1>
          <Link to="/" className="px-4 py-2 rounded-xl bg-amber-500/80 text-white hover:bg-amber-500 transition-all">
            + New Story
          </Link>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-amber-200/60 text-xl">No stories yet — create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(s => (
              <Link key={s.id} to={`/story/${s.id}`}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-200/20 hover:border-amber-200/50 transition-all hover:scale-[1.02]"
                style={{boxShadow: '0 0 10px rgba(245,158,11,0.2)'}}>
                <h2 className="text-xl font-bold text-amber-100 mb-2">{s.title}</h2>
                <div className="flex gap-2 text-sm text-amber-200/60">
                  <span>👤 {s.child_name}</span>
                  <span>·</span>
                  <span>🌐 {s.language?.toUpperCase()}</span>
                </div>
                <p className="text-amber-200/40 text-xs mt-2">{s.created_at}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryLibrary;
