import GameCard from '@/components/GameCard'
import { getFeaturedGames } from '@/lib/api' // 가상 API

export default async function ArcadePage() {
  // 1. 서버에서 핫한 게임 목록을 가져옵니다.
  const games = await getFeaturedGames()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Explore Games (Arcade)</h1>
      
      {/* 유튜브 레이아웃 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}