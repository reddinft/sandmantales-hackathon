import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-zinc-800 border-b border-zinc-700 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-xl font-bold text-indigo-400 hover:text-indigo-300">
            Sandman Tales
          </Link>
          <Link to="/" className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Create Story
          </Link>
          <Link to="/library" className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Story Library
          </Link>
        </div>
      </div>
    </nav>
  )
}
