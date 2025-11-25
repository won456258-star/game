"use client"; // 사용자의 키보드 입력을 받아야 하므로 필수!

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GamePage() {
  // 1. 캐릭터의 위치 상태 (x: 가로, y: 세로)
  const [position, setPosition] = useState({ x: 50, y: 50 });
  // 2. 캐릭터 이미지 주소
  const [characterSrc, setCharacterSrc] = useState<string | null>(null);

  // 3. 키보드 입력을 감지해서 캐릭터를 움직이는 함수
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 10; // 한 번에 움직이는 거리 (픽셀)

      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        // 방향키에 따라 좌표 변경
        if (e.key === "ArrowUp") newY -= step;
        if (e.key === "ArrowDown") newY += step;
        if (e.key === "ArrowLeft") newX -= step;
        if (e.key === "ArrowRight") newX += step;

        return { x: newX, y: newY };
      });
    };

    // 브라우저에 "키보드 눌림" 감시자 등록
    window.addEventListener("keydown", handleKeyDown);

    // 페이지를 나갈 때 감시자 제거 (청소)
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 4. 파일 업로드 처리 함수
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCharacterSrc(url);
    }
  };

  return (
    <div className="w-full h-screen bg-green-100 relative overflow-hidden">
      {/* --- 게임 UI 오버레이 (버튼 등) --- */}
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        {/* 캐릭터 업로드 버튼 */}
        <label className="bg-white px-4 py-2 rounded-lg shadow-md cursor-pointer hover:bg-gray-50 border border-gray-200 font-bold text-gray-700">
          📂 캐릭터 불러오기
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {/* 배경 제거 도구로 이동하는 버튼 */}
        <Link
          href="/remove-bg"
          className="bg-blue-600 px-4 py-2 rounded-lg shadow-md text-white font-bold hover:bg-blue-700"
        >
          🪄 배경 제거하러 가기
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full">
        키보드 방향키로 움직여보세요! 🎮
      </div>

      {/* --- 게임 스테이지 (캐릭터) --- */}
      {characterSrc ? (
        <div
          className="absolute transition-all duration-75" // 부드러운 움직임 효과
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: "100px", // 캐릭터 크기
            height: "100px",
          }}
        >
          <Image
            src={characterSrc}
            alt="My Character"
            fill
            className="object-contain drop-shadow-xl" // 그림자 효과 추가
          />
        </div>
      ) : (
        // 캐릭터가 없을 때 안내 문구
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          <p className="text-xl font-bold">좌측 상단 버튼을 눌러 캐릭터를 불러오세요!</p>
        </div>
      )}
    </div>
  );
}