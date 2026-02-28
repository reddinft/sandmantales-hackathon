import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStory, type CreateStoryRequest } from '../lib/api'

export default function StoryCreator() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateStoryRequest>({
    child_name: '',
    language: 'EN',
    prompt: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await createStory(formData)
      navigate(`/story/${response.story_id}`)
    } catch (err) {
      setError('Failed to create story. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">Create a New Story</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="child_name" className="block text-sm font-medium text-zinc-300 mb-1">
            Child's Name
          </label>
          <input
            type="text"
            id="child_name"
            name="child_name"
            value={formData.child_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-zinc-300 mb-1">
            Language
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="EN">English</option>
            <option value="JA">Japanese</option>
            <option value="FR">French</option>
            <option value="HI">Hindi</option>
          </select>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-zinc-300 mb-1">
            Story Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            rows={6}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the story you want to create..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Story...
            </span>
          ) : (
            'Create Story'
          )}
        </button>
      </form>
    </div>
  )
}
