import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getStory, type Story } from '../lib/api'

export default function StoryPlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [currentScene, setCurrentScene] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchStory = async () => {
      try {
        if (!id) return
        const data = await getStory(id)
        setStory(data)
      } catch (err) {
        setError('Failed to load story')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [id])

  const handleNext = () => {
    if (story && currentScene < story.scenes.length - 1) {
      setCurrentScene(currentScene + 1)
    }
  }

  const handlePrev = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  const toggleAudio = () => {
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-400">Story not found</div>
      </div>
    )
  }

  const currentSceneData = story.scenes[currentScene]

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-indigo-400 mb-2">
              {story.child_name}'s Story
            </h1>
            <p className="text-zinc-400 text-sm">
              Language: {story.language} • Scene {currentScene + 1} of {story.scenes.length}
            </p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 h-96 overflow-y-auto mb-6">
            <p className="text-zinc-100 text-lg leading-relaxed">
              {currentSceneData.text}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentScene === 0}
              className={`px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-colors ${currentScene === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleAudio}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentScene === story.scenes.length - 1}
              className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors ${currentScene === story.scenes.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          </div>
        </div>

        <div className="lg:w-96 lg:h-screen lg:border-l lg:border-zinc-700 p-6">
          <div className="bg-zinc-800 rounded-lg h-64 lg:h-full flex items-center justify-center">
            <div className="text-zinc-500 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Illustration Placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
