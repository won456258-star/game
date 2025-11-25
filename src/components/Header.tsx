import Link from 'next/link'
import { FaPlay, FaPlusSquare } from 'react-icons/fa'

export default function Header() {
  return (
    <header className="bg-gray-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-400">
          <FaPlay className="inline-block mr-2" />
          AI Arcade
        </Link>
        <div className="space-x-4">
          <Link href="/studio" className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium">
            <FaPlusSquare className="mr-2" />
            Create Game
          </Link>
          {/* TODO: Login Button */}
        </div>
      </nav>
    </header>
  )
}