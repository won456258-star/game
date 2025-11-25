"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Image from "next/image";
import { removeBackground } from "@imgly/background-removal";
import { sendMessageToAI } from "@/lib/actions";
import { Message, GameSpec } from "@/lib/types";

const PLACEHOLDER_PLAYER = "[[PLAYER_IMG_URL]]";
const PLACEHOLDER_OBSTACLE = "[[OBSTACLE_IMG_URL]]";
const PLACEHOLDER_BG = "[[BACKGROUND_IMG_URL]]";

declare global {
  interface Window {
    gameConfig: {
      playerScale: number;
      obstacleScale: number;
    };
    Phaser: any;
  }
}

export default function GameStudioPage() {
  // --- 상태 관리 ---
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "intro", role: "ai", content: "안녕하세요! 어떤 게임을 만들고 싶으신가요? (예: 우주에서 외계인을 피하는 러너 게임)" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 게임 코드 관리 (원본 vs 실행본)
  const [rawGameCode, setRawGameCode] = useState<string | null>(null); // 치환 전 코드
  const [executableCode, setExecutableCode] = useState<string | null>(null); // 치환 후 코드
  
  const [isPhaserLoaded, setIsPhaserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'play' | 'assets' | 'settings'>('play');
  const [scales, setScales] = useState({ player: 1.0, obstacle: 1.0 });

  // 자산 관리
  const [gameAssets, setGameAssets] = useState<{
    player: string | null;
    obstacle: string | null;
    background: string | null;
    music: string | null; // 배경음악 추가
  }>({ player: null, obstacle: null, background: null, music: null });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 채팅 스크롤 자동 내리기
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 슬라이더 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.gameConfig = { playerScale: scales.player, obstacleScale: scales.obstacle };
    }
  }, [scales]);

  // --- 핵심 로직: 자산이 변경되면 실행 코드를 다시 조립 ---
  useEffect(() => {
    if (!rawGameCode) return;

    let code = rawGameCode;
    // 현재 assets 상태에 있는 이미지들로 코드 내의 이름표를 교체
    if (gameAssets.player) code = code.replace(PLACEHOLDER_PLAYER, gameAssets.player);
    if (gameAssets.obstacle) code = code.replace(PLACEHOLDER_OBSTACLE, gameAssets.obstacle);
    if (gameAssets.background) code = code.replace(PLACEHOLDER_BG, gameAssets.background);
    
    // 이미지 없는 경우 빈 값 처리 (에러 방지)
    code = code.replace(PLACEHOLDER_PLAYER, "").replace(PLACEHOLDER_OBSTACLE, "").replace(PLACEHOLDER_BG, "");

    setExecutableCode(code);
  }, [rawGameCode, gameAssets]); // 원본 코드나 자산이 바뀌면 재조립

  // --- 채팅 전송 핸들러 ---
  const handleSend = async () => {
    if (!input.trim()) return;
    if (!isPhaserLoaded) return alert("엔진 로딩 중...");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    
    // 탭 및 상태 초기화 (새 게임 시작)
    setActiveTab('play');
    setScales({ player: 1.0, obstacle: 1.0 });
    // 기존 자산은 유지할지 초기화할지 선택 가능하지만, 여기선 초기화
    setGameAssets({ player: null, obstacle: null, background: null, music: null }); 
    setRawGameCode(null);

    try {
      const response = await sendMessageToAI([...messages, userMsg], {});
      const spec = response.updatedSpec;
      
      // 1. 원본 코드 저장 (아직 이미지 치환 안 함)
      if (response.generatedCode) {
        setRawGameCode(response.generatedCode);
      }

      // 2. 이미지 처리
      if (spec && spec.playerSprite?.url && spec.playerSprite.url.startsWith("data:image")) {
        const statusMsg: Message = { id: "status", role: "ai", content: "✂️ 배경 제거 및 리소스 처리 중..." };
        setMessages((prev) => [...prev, response.aiMessage, statusMsg]);

        // 초기 스케일 설정
        if (spec.playerSprite?.scale) setScales(p => ({ ...p, player: spec.playerSprite!.scale! }));
        if (spec.obstacleSprite?.scale) setScales(p => ({ ...p, obstacle: spec.obstacleSprite!.scale! }));

        try {
          // (1) 플레이어
          const pBlob = await removeBackground(spec.playerSprite.url);
          const pUrl = URL.createObjectURL(pBlob);
          
          // (2) 장애물
          let oUrl = null;
          if (spec.obstacleSprite?.url) {
            const oBlob = await removeBackground(spec.obstacleSprite.url);
            oUrl = URL.createObjectURL(oBlob);
          }

          // (3) 배경
          const bgUrl = spec.backgroundImage?.url || null;

          // 자산 상태 업데이트 -> useEffect가 감지하고 코드 재조립 -> 게임 실행
          setGameAssets(prev => ({ ...prev, player: pUrl, obstacle: oUrl, background: bgUrl }));
          setMessages((prev) => prev.filter(m => m.id !== "status"));

        } catch (err) {
          console.error(err);
          // 실패 시 원본 사용
          setGameAssets(prev => ({ 
            ...prev, 
            player: spec.playerSprite?.url || null, 
            obstacle: spec.obstacleSprite?.url || null, 
            background: spec.backgroundImage?.url || null 
          }));
        }
      } else {
        // 이미지가 없는 게임(테트리스 등)인 경우 메시지만 추가
        setMessages((prev) => [...prev, response.aiMessage]);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", content: "오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 파일 업로드 핸들러 (커스텀 이미지/음악) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'player' | 'obstacle' | 'background' | 'music') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    if (type === 'music') {
      setGameAssets(prev => ({ ...prev, music: objectUrl }));
    } else {
      // 이미지는 배경 제거 여부 선택 가능 (여기선 편의상 바로 적용하거나 배경 제거를 또 돌릴 수도 있음)
      // 여기서는 사용자가 올린 이미지는 배경 제거 없이 바로 적용합니다. (투명 PNG를 올린다고 가정)
      setGameAssets(prev => ({ ...prev, [type]: objectUrl }));
    }
  };

  // --- 게임 실행기 컴포넌트 ---
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
      } catch (err) { console.error("Game Error:", err); }

      return () => {
        const canvas = document.querySelector(`#${containerId} canvas`);
        if (canvas) canvas.remove();
      };
    }, [code]); // 코드가(자산이) 바뀌면 게임 재시작

    return <div id="game-container" className="w-full h-full flex items-center justify-center bg-black" />;
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-white overflow-hidden font-sans">
      <Script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js" onLoad={() => setIsPhaserLoaded(true)} />

      {/* ◀️ 좌측: 채팅 패널 (고정 너비) */}
      <div className="w-[400px] flex flex-col border-r border-gray-700 bg-[#252526]">
        <div className="p-4 border-b border-gray-700 bg-[#333333] font-bold">
          🤖 AI Game Designer
        </div>
        
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-lg text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#3e3e42] text-gray-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-gray-400 text-sm animate-pulse ml-2">AI가 게임을 설계 중입니다... 🎲</div>}
          <div ref={chatEndRef} />
        </div>

        {/* 입력창 */}
        <div className="p-4 border-t border-gray-700 bg-[#252526]">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#3e3e42] text-white p-3 rounded-md outline-none border border-gray-600 focus:border-blue-500 transition-colors placeholder-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isPhaserLoaded ? "게임을 만들어보세요!" : "엔진 로딩 중..."}
              disabled={!isPhaserLoaded || isLoading}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading} 
              className="bg-blue-600 px-4 rounded-md font-bold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ▶️ 우측: 게임 및 리소스 스튜디오 (가변 너비) */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
        
        {/* 상단 탭바 */}
        <div className="flex items-center justify-between px-4 bg-[#2d2d2d] border-b border-gray-700 h-12">
          <div className="flex h-full">
            <button onClick={() => setActiveTab('play')} className={`px-6 h-full text-sm font-medium border-r border-gray-600 ${activeTab === 'play' ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'text-gray-400 hover:bg-[#3e3e42]'}`}>
              🎮 Play Game
            </button>
            <button onClick={() => setActiveTab('assets')} className={`px-6 h-full text-sm font-medium border-r border-gray-600 ${activeTab === 'assets' ? 'bg-[#1e1e1e] text-white border-t-2 border-t-purple-500' : 'text-gray-400 hover:bg-[#3e3e42]'}`}>
              🎨 Assets & BGM
            </button>
          </div>
          
          {/* 배경음악 플레이어 (항상 보임) */}
          {gameAssets.music && (
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
              <span className="text-xs text-green-400">♪ BGM On</span>
              <audio src={gameAssets.music} controls autoPlay loop className="h-6 w-40" />
            </div>
          )}
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* 1. 게임 플레이 화면 */}
          <div className={`w-full h-full flex flex-col ${activeTab === 'play' ? 'flex' : 'hidden'}`}>
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {executableCode ? <GameRunner code={executableCode} /> : (
                <div className="text-gray-500 flex flex-col items-center gap-2">
                  <span className="text-4xl">🎮</span>
                  <span>왼쪽 채팅창에 명령어를 입력해 게임을 시작하세요.</span>
                </div>
              )}
            </div>
            
            {/* 하단 컨트롤 패널 (크기 조절) */}
            {executableCode && (
              <div className="h-16 bg-[#252526] border-t border-gray-700 flex items-center px-6 gap-8">
                <div className="flex flex-col w-48">
                  <label className="text-xs text-gray-400 mb-1 flex justify-between">
                    <span>Player Size</span>
                    <span>{scales.player.toFixed(1)}x</span>
                  </label>
                  <input type="range" min="0.1" max="3.0" step="0.1" value={scales.player} onChange={(e) => setScales(p => ({...p, player: parseFloat(e.target.value)}))} className="accent-blue-500 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                </div>
                <div className="flex flex-col w-48">
                  <label className="text-xs text-gray-400 mb-1 flex justify-between">
                    <span>Obstacle Size</span>
                    <span>{scales.obstacle.toFixed(1)}x</span>
                  </label>
                  <input type="range" min="0.1" max="3.0" step="0.1" value={scales.obstacle} onChange={(e) => setScales(p => ({...p, obstacle: parseFloat(e.target.value)}))} className="accent-red-500 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                </div>
              </div>
            )}
          </div>

          {/* 2. 리소스 관리 화면 */}
          <div className={`w-full h-full bg-[#1e1e1e] p-8 overflow-y-auto ${activeTab === 'assets' ? 'block' : 'hidden'}`}>
            <h2 className="text-xl font-bold mb-6 text-gray-200">Asset Manager</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 플레이어 카드 */}
              <AssetCard 
                title="Player" 
                imgSrc={gameAssets.player} 
                onUpload={(e) => handleFileUpload(e, 'player')} 
                color="blue"
              />
              
              {/* 장애물 카드 */}
              <AssetCard 
                title="Obstacle" 
                imgSrc={gameAssets.obstacle} 
                onUpload={(e) => handleFileUpload(e, 'obstacle')} 
                color="red"
              />

              {/* 배경 카드 */}
              <AssetCard 
                title="Background" 
                imgSrc={gameAssets.background} 
                onUpload={(e) => handleFileUpload(e, 'background')} 
                color="green"
              />

              {/* 배경음악 카드 */}
              <div className="bg-[#252526] rounded-xl p-4 border border-gray-700 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-yellow-400">🎵 BGM</span>
                  <span className="text-xs bg-yellow-900/50 text-yellow-200 px-2 py-0.5 rounded">Audio</span>
                </div>
                <div className="flex-1 bg-black/50 rounded-lg flex items-center justify-center border border-dashed border-gray-600 min-h-[120px]">
                  {gameAssets.music ? (
                    <div className="text-center">
                      <p className="text-2xl mb-2">💿</p>
                      <p className="text-xs text-gray-400">Music Loaded</p>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">No Music</span>
                  )}
                </div>
                <label className="w-full bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-sm py-2 rounded cursor-pointer text-center transition-colors">
                  Upload MP3
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'music')} />
                </label>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 재사용 가능한 리소스 카드 컴포넌트
const AssetCard = ({ title, imgSrc, onUpload, color }: { title: string, imgSrc: string | null, onUpload: (e: any) => void, color: string }) => (
  <div className="bg-[#252526] rounded-xl p-4 border border-gray-700 flex flex-col gap-4">
    <div className="flex justify-between items-center">
      <span className={`font-bold text-${color}-400`}>{title}</span>
      <span className={`text-xs bg-${color}-900/50 text-${color}-200 px-2 py-0.5 rounded`}>PNG/JPG</span>
    </div>
    
    <div className="relative w-full h-32 bg-[url('https://t3.ftcdn.net/jpg/02/09/80/29/360_F_209802927_I0C9a2a9a0d8a0f9a0b.jpg')] bg-cover rounded-lg border border-gray-600 overflow-hidden group">
      {imgSrc ? (
        <Image src={imgSrc} alt={title} fill className="object-contain" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/80 text-gray-600 text-sm">Empty</div>
      )}
    </div>

    <div className="flex gap-2">
      <label className="flex-1 bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-sm py-2 rounded cursor-pointer text-center transition-colors">
        Change
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </label>
      {imgSrc && (
        <a href={imgSrc} download={`${title}.png`} className="bg-black/50 hover:bg-black text-white px-3 py-2 rounded text-center">
          ⬇
        </a>
      )}
    </div>
  </div>
);