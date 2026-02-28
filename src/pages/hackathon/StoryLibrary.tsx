import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStories, type Story } from '@/lib/api';

const LANG_COLORS: Record<string, string> = {
  en: 'bg-indigo-500',
  ja: 'bg-amber-500',
  fr: 'bg-blue-500',
  hi: 'bg-rose-500',
};

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  fr: 'French',
  hi: 'Hindi',
};

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  fr: 'French',
  hi: 'Hindi',
};

export default function StoryLibrary() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStories().then(s => { setStories(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      <nav className="h-14 bg-zinc-800/80 border-b border-zinc-700/50 flex items-center px-6">
        <span className="text-indigo-400 font-bold text-lg">Sandman Tales</span>
        <span className="ml-auto text-white text-sm">Story Library</span>
        <a href='/create' className='text-indigo-400 hover:text-indigo-300 text-sm ml-4'>+ New Story</a>
      </nav>

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white text-center">Your Stories</h1>
        <p className="text-zinc-400 text-center mt-2 mb-8">
          {stories.length ? `${stories.length} bedtime adventure${stories.length > 1 ? 's' : ''} waiting` : 'No stories yet'}
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌙</div>
            <p className="text-zinc-400 text-lg mb-6">No stories yet. Create your first bedtime adventure!</p>
            <button onClick={() => navigate('/create')}
              className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25">
              ✨ Create Your First Story
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => (
                <div key={story.id} className="bg-zinc-800 rounded-xl border border-zinc-700/50 overflow-hidden hover:border-indigo-500/50 transition-all group">
                  {/* Cover image */}
                  <div className="relative h-48 bg-zinc-700/50 flex items-center justify-center">
                    {story.scenes[0]?.image_url ? (
                      <img src={story.scenes[0].image_url} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl">📖</div>
                        <p className="text-zinc-500 text-xs mt-1">Cover Art</p>
                      </div>
                    )}
                    {/* Language badge */}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold text-white ${LANG_COLORS[story.language] || 'bg-zinc-600'}`}>
                      {LANG_LABELS[story.language] || story.language.toUpperCase()}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-base truncate">{story.title}</h3>
                    <p className="text-zinc-500 text-sm mt-1">{LANG_NAMES[story.language] || story.language}</p>
                    <button onClick={() => navigate(`/play/${story.id}`)}
                      className={`mt-4 w-full py-2.5 rounded-lg font-medium text-white transition-all ${LANG_COLORS[story.language] || 'bg-indigo-500'} hover:opacity-90`}>
                      Play Story
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button onClick={() => navigate('/create')}
                className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25">
                + Create New Story
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="py-4 text-center text-zinc-600 text-xs">
        Powered by Mistral Large 3 &nbsp;|&nbsp; Voices by ElevenLabs &nbsp;|&nbsp; Built by ClawCutters
      </footer>
    </div>
  );
}
