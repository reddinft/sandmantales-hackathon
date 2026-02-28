import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listStories, type Story } from '../lib/api'

export default function StoryLibrary() {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const data = await listStories()
        setStories(data)
      } catch (err) {
        setError('Failed to load stories')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">Story Library</h1>

      {stories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-zinc-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl text-zinc-400 mb-2">No stories yet</h2>
          <p className="text-zinc-500">Create your first story to see it here</p>
          <Link
            to="/"
            className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Create First Story
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={`/story/${story.id}`}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 hover:border-indigo-500 transition-colors"
            >
              <h3 className="text-xl font-semibold text-indigo-400 mb-2">
                {story.child_name}'s Story
              </h3>
              <p className="text-zinc-400 text-sm mb-3">
                Language: {story.language}
              </p>
              <p className="text-zinc-500 text-sm mb-4 line-clamp-3">
                {story.prompt}
              </p>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{story.scenes.length} scenes</span>
                <span>{new Date(story.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
