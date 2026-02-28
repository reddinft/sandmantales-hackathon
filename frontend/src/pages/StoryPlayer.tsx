import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Scene {
  title?: string
  text: string
  mood?: string
  illustration_prompt?: string
  illustration_url?: string
}

export default function StoryPlayer() {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentScene, setCurrentScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`http://localhost:8001/api/stories/${id}`)
        if (response.ok) {
          const data = await response.json()
          setTitle(data.title || 'Untitled Story')
          // Content is stored as JSON string in DB
          let content = data.content
          if (typeof content === 'string') {
            content = JSON.parse(content)
          }
          setScenes(content?.scenes || [])
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
    if (id) fetchStory()
  }, [id])

  const playAudio = async () => {
    if (!scenes[currentScene]?.text) return
    setIsPlaying(true)
    try {
      const response = await fetch('http://localhost:8001/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scenes[currentScene].text, language: 'en' }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
        audio.onended = () => setIsPlaying(false)
      }
    } catch (err) {
      console.error('Error playing audio:', err)
      setIsPlaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-indigo-500 text-xl animate-pulse">Loading story...</div>
      </div>
    )
  }

  if (error || scenes.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-400 text-xl">{error || 'No scenes available'}</div>
      </div>
    )
  }

  const scene = scenes[currentScene]

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/library')} className="text-indigo-500 hover:text-indigo-400 transition-colors">
            ← Back to Library
          </button>
          <h1 className="text-xl font-bold text-indigo-400">{title}</h1>
          <div className="text-indigo-500 font-medium">
            Scene {currentScene + 1} of {scenes.length}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-8 mb-8">
          {scene.title && (
            <h2 className="text-2xl font-bold text-indigo-300 mb-4">{scene.title}</h2>
          )}
          {scene.mood && (
            <span className="inline-block px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm mb-4">
              {scene.mood}
            </span>
          )}

          <div className="mb-6">
            {scene.illustration_url ? (
              <img
                src={`http://localhost:8001${scene.illustration_url}`}
                alt={scene.title || 'Scene illustration'}
                className="w-full max-h-80 object-contain rounded-md bg-zinc-700"
              />
            ) : (
              <div className="w-full h-64 bg-zinc-700 rounded-md flex items-center justify-center text-zinc-500">
                🎨 Illustration coming soon
              </div>
            )}
          </div>

          <div className="mb-6">
            <p className="text-lg leading-relaxed">{scene.text}</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPlaying ? '🔊 Playing...' : '▶️ Listen'}
            </button>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentScene(c => Math.max(0, c - 1))}
              disabled={currentScene === 0}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentScene === 0 ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentScene(c => Math.min(scenes.length - 1, c + 1))}
              disabled={currentScene === scenes.length - 1}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentScene === scenes.length - 1 ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
