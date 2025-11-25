import { Message } from '@/lib/types'
import { FormEvent, useState, useRef, useEffect } from 'react'
import { FaPaperPlane } from 'react-icons/fa'

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (input: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 새 메시지가 오면 스크롤을 맨 아래로 내립니다.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-gray-700 text-gray-400">
              AI가 생각 중...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력창 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AI에게 메시지 보내기..."
            disabled={isLoading}
            className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-3 text-indigo-400 hover:text-indigo-300 disabled:text-gray-500"
          >
            <FaPaperPlane size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}