import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Story {
  id: string
  title: string
  child_name: string
  language: string
  created_at: string
}

export default function StoryLibrary() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('http://localhost:8001/stories')
        if (response.ok) {
          const data = await response.json()
          setStories(data)
        } else {
          setError('Failed to load stories')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  const handlePlayStory = (id: string) => {
    navigate(`/story/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-indigo-500 text-xl">Loading stories...</div>
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

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">Story Library</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-md font-medium transition-colors"
          >
            Create New Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-xl">No stories yet</p>
            <p className="text-zinc-500 mt-2">Create your first story to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition-colors cursor-pointer"
                onClick={() => handlePlayStory(story.id)}
              >
                <h3 className="text-xl font-semibold mb-2 text-indigo-400 truncate">{story.title || 'Untitled Story'}</h3>
                <p className="text-zinc-400 mb-1">For: {story.child_name}</p>
                <p className="text-zinc-500 text-sm mb-3">Language: {story.language}</p>
                <p className="text-zinc-600 text-sm">
                  Created: {new Date(story.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}