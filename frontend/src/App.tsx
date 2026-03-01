import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import StoryCreator from './pages/StoryCreator'
import StoryPlayer from './pages/StoryPlayer'
import StoryLibrary from './pages/StoryLibrary'
import Login from './pages/Login'

const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><StoryCreator /></ProtectedRoute>} />
        <Route path="/story/:id" element={<StoryPlayer />} />
        <Route path="/library" element={<StoryLibrary />} />
      </Routes>
    </Router>
  )
}

export default App
