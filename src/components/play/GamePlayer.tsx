'use client' 
// 💥 이 파일은 브라우저에서 실행되어야 하므로 'use client'가 필수입니다!

import { useEffect, useRef } from 'react'

interface GamePlayerProps {
  gameCode: string;
}

export default function GamePlayer({ gameCode }: GamePlayerProps) {
  // 💥 타입은 'phaser.d.ts' 파일에서 전역으로 가져옵니다.
  // 💥 'Phaser.Game' 대신 'any'를 사용하여 타입 오류를 강제로 우회합니다.
  const gameInstanceRef = useRef<any>(null)
  const gameContainerId = 'main-game-container' // 스튜디오와 ID가 달라야 함

  // 1. /js/phaser.min.js 스크립트를 동적으로 로드합니다.
  useEffect(() => {
    if (!document.querySelector('script[src="/js/phaser.min.js"]')) {
      const phaserScript = document.createElement('script')
      phaserScript.src = '/js/phaser.min.js'
      phaserScript.async = true
      document.body.appendChild(phaserScript)
    }
  }, [])

  // 2. 스크립트가 로드되면(window.Phaser) 게임 코드를 실행합니다.
  useEffect(() => {
    if (typeof window.Phaser === 'undefined') {
      const timer = setTimeout(() => {
        // Phaser 로드 재시도
        if (typeof window.Phaser !== 'undefined') {
          runGameCode()
        }
      }, 500)
      return () => clearTimeout(timer)
    } else {
      runGameCode()
    }

    function runGameCode() {
      if (gameCode) {
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true)
        }
        
        try {
          // AI가 생성한 코드를 실행 가능한 함수로 변환
          const GameRunner = new Function('containerId', `
            ${gameCode}
            // 💥 이 'Phaser'는 import된 모듈이 아니라
            //    window.Phaser에서 가져온 전역 변수입니다.
            return new Phaser.Game(config);
          `);
          
          // 게임 실행
          gameInstanceRef.current = GameRunner(gameContainerId)

        } catch (error) {
          console.error('Error running game code:', error)
        }
      }
    }

    return () => {
      gameInstanceRef.current?.destroy(true)
      gameInstanceRef.current = null
    }
  }, [gameCode]) // gameCode가 바뀔 때마다 이 로직이 재실행됩니다.

  return (
    // 게임 컨테이너 (비율 유지)
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div id={gameContainerId} className="w-full h-full" />
    </div>
  )
}