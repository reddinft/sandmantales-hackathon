import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StoryCreator() {
  const [childName, setChildName] = useState('')
  const [language, setLanguage] = useState('EN')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:8001/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_name: childName,
          language,
          prompt,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        navigate(`/story/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating story:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-indigo-500">Create a Story</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Child's Name</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="fr">French</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Story Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe the story you want to create..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
              loading
                ? 'bg-indigo-600 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {loading ? 'Creating Story...' : 'Create Story'}
          </button>
        </form>
      </div>
    </div>
  )
}