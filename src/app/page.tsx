"use client";

import { useState, useEffect, useRef } from "react";
// ... 기타 import
import { sendMessageToAI } from "@/lib/actions";
import { Message, ResourceSpec } from "@/lib/types"; // ResourceSpec import 추가

// ... (기존 코드 유지)

export default function GameStudioPage() {
  // ... (기존 상태 유지)
  const [activeTab, setActiveTab] = useState<'play' | 'assets'>('play');

  // ✨ [변경] 여러 리소스를 담을 수 있는 배열로 상태 변경
  const [generatedAssets, setGeneratedAssets] = useState<ResourceSpec[]>([]);

  // ... (채팅 스크롤 등 useEffect 유지)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    
    // 새 요청 시 기존 리소스 초기화 및 탭 이동
    setGeneratedAssets([]);
    setActiveTab('assets'); // 이미지 생성 결과가 나올 테니 리소스 탭으로 이동

    try {
      // 서버에 요청 전송
      const response = await sendMessageToAI([...messages, userMsg]);
      
      // AI 응답 메시지 추가
      setMessages((prev) => [...prev, response.aiMessage]);

      // ✨ [핵심] 생성된 리소스가 있으면 상태에 저장
      if (response.generatedResources && response.generatedResources.length > 0) {
        setGeneratedAssets(response.generatedResources);
        
        // (선택 사항) 여기서 배경 제거 로직을 수행할 수도 있습니다.
        // 지금은 DALL-E가 흰 배경으로 만들어주므로 일단 그대로 보여줍니다.
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", content: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (handleFileUpload, GameRunner 등 기존 코드 유지)

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-white overflow-hidden font-sans">
      {/* ... (좌측 채팅 패널 코드 유지) */}

      {/* ▶️ 우측: 게임 및 리소스 스튜디오 */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
        
        {/* 상단 탭바 */}
        <div className="flex items-center justify-between px-4 bg-[#2d2d2d] border-b border-gray-700 h-12">
          <div className="flex h-full">
            {/* 탭 버튼들... (기존 코드 유지) */}
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* 1. 게임 플레이 화면 (기존 코드 유지) */}
          {/* ... */}

          {/* ✨ [변경] 2. 리소스 관리 화면 (동적 렌더링) */}
          <div className={`w-full h-full bg-[#1e1e1e] p-8 overflow-y-auto ${activeTab === 'assets' ? 'block' : 'hidden'}`}>
            <h2 className="text-xl font-bold mb-6 text-gray-200">
              생성된 리소스 ({generatedAssets.length})
            </h2>
            
            {generatedAssets.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                {isLoading ? "AI가 열심히 이미지를 생성하고 있습니다..." : "채팅창에 원하는 게임 에셋을 요청해보세요!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {/* ✨ 배열을 순회하며 카드 생성 */}
                {generatedAssets.map((asset, index) => (
                  <AssetCard 
                    key={index}
                    title={asset.name}
                    description={asset.description}
                    imgSrc={asset.url}
                    type={asset.type}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ✨ [변경] AssetCard 컴포넌트 (조금 더 범용적으로 수정)
const AssetCard = ({ title, description, imgSrc, type }: { title: string, description: string, imgSrc: string | null, type: string }) => {
  // 타입별 색상 지정
  const colorMap: { [key: string]: string } = {
    player: 'blue', enemy: 'red', boss: 'purple', background: 'green', default: 'gray'
  };
  const color = colorMap[type.split('_')[0]] || colorMap.default;

  return (
    <div className="bg-[#252526] rounded-xl p-4 border border-gray-700 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <span className={`font-bold text-${color}-400 truncate`}>{title}</span>
        <span className={`text-xs bg-${color}-900/50 text-${color}-200 px-2 py-0.5 rounded uppercase`}>{type}</span>
      </div>
      
      <div className="relative w-full h-48 bg-[url('https://t3.ftcdn.net/jpg/02/09/80/29/360_F_209802927_I0C9a2a9a0d8a0f9a0b.jpg')] bg-cover rounded-lg border border-gray-600 overflow-hidden group bg-center">
        {imgSrc ? (
          <Image src={imgSrc} alt={title} fill className={`object-contain ${type === 'background' ? 'object-cover' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/80 text-gray-500 text-sm p-4 text-center">
            이미지 생성 실패
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 line-clamp-2 flex-1">{description}</p>

      {imgSrc && (
        <a href={imgSrc} download={`${title.replace(/\s+/g, '_')}.png`} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-center text-sm font-bold transition-colors">
          다운로드
        </a>
      )}
    </div>
  );
};