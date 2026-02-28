import { useState, useEffect } from 'react';

type Story = {
  id: string;
  title: string;
  child_name: string;
  language: string;
  created_at: string | null;
};

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  ja: '🇯🇵',
  fr: '🇫🇷',
  hi: '🇮🇳',
  es: '🇪🇸',
  pt: '🇧🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ar: '🇸🇦',
  ko: '🇰🇷',
};

export default function StoryLibrary() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories');
        const data = await response.json();
        setStories(data);
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars.png')] opacity-20"></div>
      <div className="relative z-10 container mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-amber-100 flex items-center gap-3">
            <span>📚</span>
            Story Library
            <span className="text-2xl font-normal text-amber-200/80">
              ({stories.length})
            </span>
          </h1>
          <a
            href="/"
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-amber-300/50"
          >
            + New Story
          </a>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {stories.map((story) => (
              <a
                key={story.id}
                href={`/story/${story.id}`}
                className="block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-amber-200/30 group cursor-pointer h-full flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">
                        {languageFlags[story.language] || '🌍'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(story.created_at)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {story.title}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      For <span className="font-semibold">{story.child_name}</span>
                    </p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-amber-100/30 rounded-full group-hover:bg-amber-200/40 transition-all duration-300"></div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}