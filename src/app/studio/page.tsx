'use client'

import { useState } from 'react'
import { Message, GameSpec } from '@/lib/types'
// 💥 1. api.ts 대신 actions.ts에서 import 합니다!
import { sendMessageToAI } from '@/lib/actions' 
import ChatPanel from '@/components/studio/ChatPanel'
import GamePreview from '@/components/studio/GamePreview'

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
      // 💥 2. Server Action을 직접 호출합니다! (fetch가 필요 없습니다)
      const aiResponse = await sendMessageToAI(newMessages, gameSpec)

      setMessages(prev => [...prev, aiResponse.aiMessage])
      
      if (aiResponse.updatedSpec) {
        setGameSpec(aiResponse.updatedSpec)
      }
      
      if (aiResponse.generatedCode) {
        setGameCode(aiResponse.generatedCode)
      }

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