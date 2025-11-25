"use client";

import { useState } from "react";
// [수정된 부분 1] 중괄호 { }를 써서 정확한 이름을 가져옵니다.
import { removeBackground } from "@imgly/background-removal"; 
import Image from "next/image";

export default function RemoveBgPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setProcessedImage(null);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageSrc) return;

    setIsLoading(true);
    try {
      // [수정된 부분 2] 함수 이름도 removeBackground로 변경되었습니다.
      const blob = await removeBackground(imageSrc);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (error) {
      console.error("배경 제거 실패:", error);
      alert("배경 제거 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-black">
      <h1 className="text-3xl font-bold mb-8 text-black dark:text-white">
        AI 이미지 배경 제거기 🪄
      </h1>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            이미지 파일 선택 (DALL-E 생성 이미지 등)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          />
        </div>

        {imageSrc && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">원본 이미지:</p>
            <div className="relative w-full h-64 border rounded-lg overflow-hidden">
              <Image
                src={imageSrc}
                alt="Original"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleRemoveBackground}
          disabled={!imageSrc || isLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-colors ${
            !imageSrc || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "배경 제거 중... (시간이 좀 걸려요)" : "배경 제거 실행!"}
        </button>

        {processedImage && (
          <div className="mt-8">
            <p className="text-sm text-green-600 font-bold mb-2">
              완성된 이미지 (우클릭해서 저장하세요):
            </p>
            <div className="relative w-full h-64 border-2 border-green-400 border-dashed rounded-lg overflow-hidden bg-[url('https://t3.ftcdn.net/jpg/02/09/80/29/360_F_209802927_I0C9a2a9a0d8a0f9a0b.jpg')] bg-cover">
              <Image
                src={processedImage}
                alt="Processed"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}