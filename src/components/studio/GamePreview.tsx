'use client'

import { useEffect, useRef } from 'react'

interface GamePreviewProps {
  gameCode: string | null;
}

// 이 컴포넌트는 AI가 생성한 JS 코드를 받아 Phaser 게임으로 실행합니다.
export default function GamePreview({ gameCode }: GamePreviewProps) {
  const gameInstanceRef = useRef<Phaser.Game | null>(null)
  const gameContainerId = 'studio-preview-container'

  // Phaser.js 스크립트를 동적으로 로드합니다.
  useEffect(() => {
    const phaserScript = document.createElement('script')
    phaserScript.src = '/js/phaser.min.js'
    phaserScript.async = true
    document.body.appendChild(phaserScript)

    return () => {
      document.body.removeChild(phaserScript)
    }
  }, [])

  useEffect(() => {
    // 1. Phaser 라이브러리가 로드되었는지 확인합니다.
    if (!window.Phaser) {
      console.warn('Phaser not loaded yet')
      return;
    }

    // 2. AI가 새 게임 코드를 전달했습니다.
    if (gameCode) {
      // 3. 기존에 실행 중인 게임이 있다면 파괴합니다. (중요!)
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      }

      try {
        // 4. AI가 생성한 코드는 즉시 실행 함수(IIFE)로 감싸서
        //    전역 스코프 오염을 막고, Phaser 인스턴스를 반환받도록 설계합니다.
        //    (이 로직은 AI 프롬프트 엔지니어링으로 정의해야 함)
        
        // (가상) AI가 생성한 코드가 이렇다고 가정:
        // (function(containerId) { 
        //    const config = {...}; 
        //    const game = new Phaser.Game(config); 
        //    return game; 
        // })
        
        // Function 생성자를 사용해 문자열 코드를 실행 가능한 함수로 만듭니다.
        // (주의: 실제 서비스에서는 보안(샌드박싱)이 필요합니다)
        const GameRunner = new Function('containerId', `
          ${gameCode}
          return new Phaser.Game(config);
        `);
        
        // 5. 새 게임을 실행하고 인스턴스를 ref에 저장합니다.
        gameInstanceRef.current = GameRunner(gameContainerId)

      } catch (error) {
        console.error('Error running generated game code:', error)
      }
    }

    // 컴포넌트 언마운트 시 게임 인스턴스 파괴
    return () => {
      gameInstanceRef.current?.destroy(true)
      gameInstanceRef.current = null
    }

  }, [gameCode]) // gameCode가 변경될 때마다 이 로직이 재실행됩니다.

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Phaser 게임이 렌더링될 컨테이너 */}
      <div id={gameContainerId} className="w-full h-full" />
      
      {!gameCode && (
        <div className="absolute text-gray-500">
          AI와 대화하여 게임을 생성하면 여기에 프리뷰가 표시됩니다.
        </div>
      )}
    </div>
  )
}