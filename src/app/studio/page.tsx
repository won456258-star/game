// src/app/studio/page.tsx (MODIFIED FILE)
'use client'

import { useState } from 'react'
import { Message, GameSpec } from '@/lib/types'
import { sendMessageToAI } from '@/lib/actions' 
import ChatPanel from '@/components/studio/ChatPanel'
import GamePreview from '@/components/studio/GamePreview'

// --- MOCKing: 실제 게임 ID가 필요합니다. ---
const MOCK_GAME_NAME = "my-ai-game";
// ------------------------------------------

export default function StudioPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: '안녕하세요! 어떤 게임을 만들고 싶으신가요? (예: 하늘에서 장애물 피하는 게임)' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [gameCode, setGameCode] = useState<string | null>(null)
  const [gameSpec, setGameSpec] = useState<Partial<GameSpec>>({})

  const handleSendMessage = async (userInput: string) => {
    setIsLoading(true)
    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: userInput }
    const newMessages = [...messages, newUserMessage]
    setMessages(newMessages)

    try {
      // 💥 MOCK_GAME_NAME 인자를 추가하여 호출합니다.
      const aiResponse = await sendMessageToAI(newMessages, gameSpec, MOCK_GAME_NAME) 

      setMessages(prev => [...prev, aiResponse.aiMessage])
      
      // NOTE: 파이썬 통합 로직은 generatedCode와 gameData를 직접 반환합니다.
      if (aiResponse.generatedCode) {
        setGameCode(aiResponse.generatedCode)
      }
      
      // gameSpec 업데이트 로직은 필요에 따라 actions.ts에서 추가 구현해야 합니다.

    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { id: 'err', role: 'ai', content: '오류가 발생했습니다. 다시 시도해주세요.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-150px)] gap-4">
      <div className="md:w-1/3 h-full">
        <ChatPanel 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage} 
        />
      </div>
      <div className="md:w-2/3 h-full bg-gray-950 rounded-lg shadow-inner">
        <GamePreview 
          gameCode={gameCode}
        />
      </div>
    </div>
  )
}