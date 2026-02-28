import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

type Scene = {
  title: string;
  text: string;
  mood: string;
  illustration_prompt: string;
  illustration_url: string;
};

type StoryContent = {
  scenes: Scene[];
};

const StoryPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<StoryContent | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`/api/stories/${id}`);
        const data = await response.json();
        setStory(JSON.parse(data.content));
      } catch (error) {
        console.error('Failed to fetch story:', error);
      }
    };

    fetchStory();
  }, [id]);

  const handleNextScene = () => {
    if (story && currentSceneIndex < story.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const handleListen = async () => {
    if (!story) return;

    const scene = story.scenes[currentSceneIndex];
    try {
      const response = await fetch('/api/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: scene.text,
          language: 'fr',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Failed to narrate:', error);
    }
  };

  const currentScene = story?.scenes[currentSceneIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/stars.png')] opacity-30 animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <Link
          to="/library"
          className="absolute top-6 left-6 flex items-center text-amber-200 hover:text-amber-100 transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Library
        </Link>

        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
          {currentScene && (
            <>
              <div className="relative mb-6 rounded-2xl overflow-hidden shadow-amber-500/50 shadow-lg">
                <img
                  src={`http://localhost:8001${currentScene.illustration_url}`}
                  alt={currentScene.illustration_prompt}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-3xl font-bold text-amber-50 mb-2">{currentScene.title}</h1>
                  <div className="inline-block px-3 py-1 bg-amber-200/20 text-amber-100 text-sm rounded-full border border-amber-200/30">
                    {currentScene.mood}
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-amber-50 leading-relaxed">
                <p className="text-lg">{currentScene.text}</p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePrevScene}
                    disabled={currentSceneIndex === 0}
                    className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-amber-100">
                    Scene {currentSceneIndex + 1} of {story.scenes.length}
                  </span>
                  <button
                    onClick={handleNextScene}
                    disabled={currentSceneIndex === story.scenes.length - 1}
                    className="p-2 rounded-full bg-amber-200/20 text-amber-100 hover:bg-amber-200/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleListen}
                  className="flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-full shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>{isPlaying ? 'Playing...' : 'Listen'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default StoryPlayer;