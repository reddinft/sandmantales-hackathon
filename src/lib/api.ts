const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface Scene {
  scene_number: number;
  title: string;
  text: string;
  mood: string;
  illustration_prompt: string;
  image_url?: string;
  audio_url?: string;
}

export interface Story {
  id: string;
  title: string;
  language: string;
  prompt: string;
  scenes: Scene[];
  created_at: string;
}

export async function generateStory(prompt: string, language: string): Promise<Story> {
  const res = await fetch(`${API_BASE}/api/story/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, language, num_scenes: 6 }),
  });
  if (!res.ok) throw new Error(`Story generation failed: ${res.status}`);
  return res.json();
}

export async function narrateScene(text: string, language: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/voice/narrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`Narration failed: ${res.status}`);
  const data = await res.json();
  return data.audio_url;
}

export async function transcribeVoice(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const data = await res.json();
  return data.text;
}

export async function getStories(): Promise<Story[]> {
  const res = await fetch(`${API_BASE}/api/stories`);
  if (!res.ok) throw new Error(`Failed to fetch stories: ${res.status}`);
  return res.json();
}

export async function getStory(id: string): Promise<Story> {
  const res = await fetch(`${API_BASE}/api/stories/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch story: ${res.status}`);
  return res.json();
}
