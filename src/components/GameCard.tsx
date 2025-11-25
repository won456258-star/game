import { Game } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { FaUser, FaEye } from 'react-icons/fa'

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/play/${game.id}`} className="block bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-300">
      <div className="relative w-full h-40">
        <Image 
          src={game.thumbnailUrl} 
          alt={game.title} 
          // 💥 'layout="fill"'과 'objectFit="cover"' 대신,
          // 💥 'fill'과 'style={{ objectFit: 'cover' }}'를 사용합니다.
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 반응형 이미지 크기 최적화
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg truncate">{game.title}</h3>
        <div className="text-sm text-gray-400 mt-2 flex items-center justify-between">
          <span className="flex items-center">
            <FaUser className="mr-1" />
            {game.creator.name}
          </span>
          <span className="flex items-center">
            <FaEye className="mr-1" />
            {game.plays.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  )
}