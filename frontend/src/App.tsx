import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import StoryCreator from './pages/StoryCreator'
import StoryPlayer from './pages/StoryPlayer'
import StoryLibrary from './pages/StoryLibrary'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StoryCreator />} />
        <Route path="/story/:id" element={<StoryPlayer />} />
        <Route path="/library" element={<StoryLibrary />} />
      </Routes>
    </Router>
  )
}

export default App
