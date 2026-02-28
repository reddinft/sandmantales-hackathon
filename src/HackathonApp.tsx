import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StoryCreator from '@/pages/hackathon/StoryCreator';
import StoryPlayer from '@/pages/hackathon/StoryPlayer';
import StoryLibrary from '@/pages/hackathon/StoryLibrary';

export default function HackathonApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<StoryCreator />} />
        <Route path="/play/:id" element={<StoryPlayer />} />
        <Route path="/library" element={<StoryLibrary />} />
        <Route path="*" element={<Navigate to="/create" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
