import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import StoryCreator from './components/StoryCreator'
import StoryPlayer from './components/StoryPlayer'
import StoryLibrary from './components/StoryLibrary'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-900 text-zinc-100">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="" element={<StoryCreator />} />
            <Route path="/story/:id" element={<StoryPlayer />} />
            <Route path="/library" element={<StoryLibrary />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
