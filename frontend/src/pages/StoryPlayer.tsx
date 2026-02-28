import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Scene {
  id: number
  text: string
  illustration_url?: string
  audio_url?: string
}

export default function StoryPlayer() {
  const { id } = useParams<{ id: string }>()
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentScene, setCurrentScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`http://localhost:8001/stories/${id}`)
        if (response.ok) {
          const data = await response.json()
          setScenes(data.scenes || [])
        } else {
          setError('Story not found')
        }
      } catch (err) {
        setError('Failed to load story')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchStory()
    }
  }, [id])

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1)
    }
  }

  const handlePrev = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-indigo-500 text-xl">Loading story...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-400 text-xl">No scenes available</div>
      </div>
    )
  }

  const scene = scenes[currentScene]

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/library')}
            className="text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            ← Back to Library
          </button>
          <div className="text-indigo-500 font-medium">
            Scene {currentScene + 1} of {scenes.length}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-8 mb-8">
          <div className="mb-6">
            {scene.illustration_url ? (
              <img
                src={scene.illustration_url}
                alt="Scene illustration"
                className="w-full max-h-96 object-contain rounded-md"
              />
            ) : (
              <div className="w-full h-96 bg-zinc-700 rounded-md flex items-center justify-center text-zinc-500">
                Illustration Placeholder
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="text-lg leading-relaxed">{scene.text}</p>
          </div>

          {scene.audio_url && (
            <div className="mb-6">
              <audio controls className="w-full">
                <source src={scene.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentScene === 0}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentScene === 0
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentScene === scenes.length - 1}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentScene === scenes.length - 1
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}