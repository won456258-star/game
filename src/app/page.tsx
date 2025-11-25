"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Image from "next/image";
import { removeBackground } from "@imgly/background-removal";
import { sendMessageToAI } from "@/lib/actions";
import { Message, GameSpec } from "@/lib/types";

const PLACEHOLDER_PLAYER = "[[PLAYER_IMG_URL]]";
const PLACEHOLDER_OBSTACLE = "[[OBSTACLE_IMG_URL]]";
const PLACEHOLDER_BG = "[[BACKGROUND_IMG_URL]]";

export default function GameChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [isPhaserLoaded, setIsPhaserLoaded] = useState(false);

  // ✨ [추가] 탭 상태 관리 ('play' | 'assets')
  const [activeTab, setActiveTab] = useState<'play' | 'assets'>('play');

  // ✨ [추가] 생성된 리소스 이미지 주소 저장소
  const [gameAssets, setGameAssets] = useState<{
    player: string | null;
    obstacle: string | null;
    background: string | null;
  }>({ player: null, obstacle: null, background: null });

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!isPhaserLoaded) {
      alert("게임 엔진을 불러오는 중입니다. 잠시만 기다려주세요!");
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setGameCode(null);
    
    // 새 요청 시 리소스 초기화 및 게임 탭으로 이동
    setGameAssets({ player: null, obstacle: null, background: null });
    setActiveTab('play');

    try {
      const response = await sendMessageToAI([...messages, userMsg], {});
      
      let finalCode = response.generatedCode;
      const spec = response.updatedSpec;

      // 이미지 처리 로직
      if (finalCode && spec && spec.playerSprite?.url && spec.playerSprite.url.startsWith("data:image")) {
        const statusMsg: Message = { id: "status", role: "ai", content: "✂️ AI가 생성한 이미지의 배경을 지우고 있습니다..." };
        setMessages((prev) => [...prev, response.aiMessage, statusMsg]);

        // 최종적으로 사용할 이미지 URL들을 담을 변수
        let finalPlayerUrl = spec.playerSprite.url;
        let finalObstacleUrl = spec.obstacleSprite?.url || null;
        let finalBgUrl = spec.backgroundImage?.url || null;

        try {
          // (1) 플레이어 배경 제거
          const playerBlob = await removeBackground(spec.playerSprite.url);
          finalPlayerUrl = URL.createObjectURL(playerBlob);
          finalCode = finalCode.replace(PLACEHOLDER_PLAYER, finalPlayerUrl);

          // (2) 장애물 배경 제거
          if (spec.obstacleSprite?.url) {
            const obstacleBlob = await removeBackground(spec.obstacleSprite.url);
            finalObstacleUrl = URL.createObjectURL(obstacleBlob);
            finalCode = finalCode.replace(PLACEHOLDER_OBSTACLE, finalObstacleUrl);
          }

          // (3) 배경 이미지 (배경 제거 안 함)
          if (spec.backgroundImage?.url) {
             finalCode = finalCode.replace(PLACEHOLDER_BG, spec.backgroundImage.url);
          }

          setMessages((prev) => prev.filter(m => m.id !== "status"));

        } catch (bgError) {
          console.error("배경 제거 중 오류:", bgError);
          alert("배경 제거 실패로 원본 이미지를 사용합니다.");
          // 실패 시 원본 URL 사용
          finalCode = finalCode.replace(PLACEHOLDER_PLAYER, spec.playerSprite.url)
                               .replace(PLACEHOLDER_OBSTACLE, spec.obstacleSprite?.url || "")
                               .replace(PLACEHOLDER_BG, spec.backgroundImage?.url || "");
        }

        // ✨ [추가] 처리된 최종 이미지들을 상태에 저장 (탭에서 보여주기 위함)
        setGameAssets({
          player: finalPlayerUrl,
          obstacle: finalObstacleUrl,
          background: finalBgUrl
        });
      }

      if (finalCode) {
        setGameCode(finalCode);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", content: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const GameRunner = ({ code }: { code: string }) => {
    useEffect(() => {
      if (!isPhaserLoaded || typeof window === 'undefined' || !window.Phaser) return;

      const containerId = 'game-container';
      const existingCanvas = document.querySelector(`#${containerId} canvas`);
      if (existingCanvas) existingCanvas.remove();

      try {
        const runGame = new Function('containerId', 'Phaser', code + `\n if(typeof config !== 'undefined') { new Phaser.Game(config); }`);
        // @ts-ignore
        runGame(containerId, window.Phaser);
      } catch (err) {
        console.error("게임 실행 오류:", err);
      }

      return () => {
        const canvas = document.querySelector(`#${containerId} canvas`);
        if (canvas) canvas.remove();
      };
    }, [code]);

    return (
      <div className="w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
         <div id="game-container"></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <Script 
        src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"
        onLoad={() => {
          console.log("✅ Phaser Game Engine Loaded!");
          setIsPhaserLoaded(true);
        }}
      />

      <h1 className="text-2xl font-bold mb-4 text-center">🎮 AI 게임 메이커 (Auto-BG Removal)</h1>
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* ✨ [추가] 탭 메뉴 */}
        <div className="flex gap-2 mb-2 px-1">
          <button 
            onClick={() => setActiveTab('play')}
            className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'play' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            🎮 게임 플레이
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'assets' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            🎨 생성된 리소스
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div className="flex-1 bg-black rounded-b-xl rounded-tr-xl border border-gray-700 p-1 overflow-hidden relative">
          
          {/* 1. 게임 플레이 탭 */}
          <div className={`w-full h-full ${activeTab === 'play' ? 'block' : 'hidden'}`}>
            {!isPhaserLoaded ? (
              <div className="flex h-full items-center justify-center text-yellow-400 animate-pulse">⚡ 게임 엔진 로딩 중...</div>
            ) : gameCode ? (
              <GameRunner code={gameCode} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                게임을 생성하면 여기서 바로 플레이할 수 있습니다.
              </div>
            )}
          </div>

          {/* 2. 리소스 보기 탭 (갤러리) */}
          <div className={`w-full h-full bg-gray-800 p-6 overflow-y-auto ${activeTab === 'assets' ? 'block' : 'hidden'}`}>
            {!gameAssets.player && !gameAssets.obstacle && !gameAssets.background ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                아직 생성된 이미지가 없습니다. 게임을 먼저 만들어주세요!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 플레이어 카드 */}
                {gameAssets.player && (
                  <div className="bg-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-600">
                    <span className="font-bold text-blue-300">🏃 플레이어</span>
                    <div className="relative w-32 h-32 bg-[url('https://t3.ftcdn.net/jpg/02/09/80/29/360_F_209802927_I0C9a2a9a0d8a0f9a0b.jpg')] bg-cover rounded-lg border border-gray-500 overflow-hidden">
                      <Image src={gameAssets.player} alt="Player" fill className="object-contain" />
                    </div>
                    <a href={gameAssets.player} download="player.png" className="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">다운로드</a>
                  </div>
                )}
                
                {/* 장애물 카드 */}
                {gameAssets.obstacle && (
                  <div className="bg-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-600">
                    <span className="font-bold text-red-300">🚧 장애물</span>
                    <div className="relative w-32 h-32 bg-[url('https://t3.ftcdn.net/jpg/02/09/80/29/360_F_209802927_I0C9a2a9a0d8a0f9a0b.jpg')] bg-cover rounded-lg border border-gray-500 overflow-hidden">
                      <Image src={gameAssets.obstacle} alt="Obstacle" fill className="object-contain" />
                    </div>
                    <a href={gameAssets.obstacle} download="obstacle.png" className="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">다운로드</a>
                  </div>
                )}

                {/* 배경 카드 */}
                {gameAssets.background && (
                  <div className="bg-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-600">
                    <span className="font-bold text-green-300">🌄 배경</span>
                    <div className="relative w-48 h-32 bg-black rounded-lg border border-gray-500 overflow-hidden">
                      <Image src={gameAssets.background} alt="Background" fill className="object-cover" />
                    </div>
                    <a href={gameAssets.background} download="background.png" className="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">다운로드</a>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 채팅창 (하단 고정) */}
      <div className="h-1/3 bg-gray-800 mt-4 rounded-xl p-4 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`p-2 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 ml-auto' : 'bg-gray-700'}`}>
              {m.content}
            </div>
          ))}
          {isLoading && <div className="text-gray-400 animate-pulse">AI가 생각 중입니다...</div>}
        </div>
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-gray-700 p-3 rounded-lg outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isPhaserLoaded ? "어떤 게임을 만들까요?" : "엔진 로딩 중..."}
            disabled={!isPhaserLoaded} 
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !isPhaserLoaded} 
            className={`px-6 rounded-lg font-bold transition-colors ${!isPhaserLoaded ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}