const API_BASE = 'http://localhost:8001'

export interface Story {
  id: string
  child_name: string
  language: string
  prompt: string
  scenes: Array<{
    id: number
    text: string
    audio_url?: string
    image_url?: string
  }>
  created_at: string
}

export interface CreateStoryRequest {
  child_name: string
  language: string
  prompt: string
}

export interface CreateStoryResponse {
  story_id: string
}

export const createStory = async (request: CreateStoryRequest): Promise<CreateStoryResponse> => {
  const response = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create story')
  }
  
  return response.json()
}

export const getStory = async (storyId: string): Promise<Story> => {
  const response = await fetch(`${API_BASE}/stories/${storyId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch story')
  }
  
  return response.json()
}

export const listStories = async (): Promise<Story[]> => {
  const response = await fetch(`${API_BASE}/stories`)
  
  if (!response.ok) {
    throw new Error('Failed to list stories')
  }
  
  return response.json()
}
