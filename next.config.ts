import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 관련 외부 패키지 설정을 추가합니다.
  serverExternalPackages: ["@imgly/background-removal"],
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;