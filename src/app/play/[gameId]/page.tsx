import { getGameById } from '@/lib/api' // 가상 API
import GamePlayer from '@/components/play/GamePlayer'

interface PlayPageProps {
  // 💥 Turbopack은 params를 Promise로 전달할 수 있습니다.
  params: Promise<{ gameId: string }>
}

// 💥 1. params를 { params }로 받습니다. (구조분해 하지 않습니다!)
export default async function PlayPage({ params }: PlayPageProps) {
  
  // 💥 2. 함수 안에서 'await'으로 Promise의 내용물을 꺼냅니다.
  const { gameId } = await params;

  // 3. 이제 gameId를 안전하게 사용할 수 있습니다.
  const game = await getGameById(gameId)

  if (!game) {
    return <div>게임을 찾을 수 없습니다.</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 왼쪽: 게임 플레이어 */}
      <div className="lg:w-3/4">
        {/* (가상) 광고가 뜰 자리 (BM) */}
        <div className="w-full h-20 bg-gray-700 flex items-center justify-center text-gray-400 mb-4 rounded-lg">
          (광고 영역)
        </div>
        
        {/* 게임 플레이어 컴포넌트 */}
        <GamePlayer gameCode={game.gameCode} />
      </div>

      {/* 오른쪽: 게임 정보 및 댓글 */}
      <div className="lg:w-1/4">
        <h1 className="text-3xl font-bold">{game.title}</h1>
        <div className="text-lg text-gray-400 mt-2">
          by {game.creator.name}
        </div>
        <div className="text-gray-500 mt-1">
          {game.plays.toLocaleString()} plays
        </div>
        
        <hr className="my-6 border-gray-700" />
        
        {/* TODO: 댓글 컴포넌트 */}
        <div className="text-gray-400">(댓글 영역)</div>
      </div>
    </div>
  )
}