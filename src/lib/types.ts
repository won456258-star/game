// AI와 대화하는 메시지
export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system'; // 'system' 역할도 혹시 몰라 추가해두었습니다.
  content: string;
}

// ✨ [추가] 생성될 리소스 하나의 정보 (이미지 생성 툴용)
export interface ResourceSpec {
  // 다양한 리소스 타입을 지원하도록 확장
  type: 'player' | 'enemy' | 'boss' | 'projectile_player' | 'projectile_enemy' | 'background' | 'item' | 'other';
  name: string;        // 리소스 이름 (예: 산타클로스)
  description: string; // 설명 (예: 선물 자루를 멘 산타)
  imagePrompt: string; // DALL-E에게 보낼 프롬프트
  url?: string | null; // 생성된 이미지 주소 (생성 전에는 null)
}

// ✨ [추가] AI의 응답 형식 (이미지 생성 툴용)
export interface AIResponse {
  reply: string;             // 챗봇의 답변 텍스트
  resources: ResourceSpec[]; // 생성할 리소스 목록
}

// ------------------------------------------------------------------
// 기존 게임 생성 로직용 타입 (유지)
// ------------------------------------------------------------------

export interface SpriteSpec {
  name: string;
  url: string | null;
  scale?: number;
  frameWidth?: number;
  frameHeight?: number;
}

export interface ImagePrompts {
  player?: string;
  obstacle?: string;
  background?: string;
}

// AI가 완성해가는 게임 사양서 (기획서)
export interface GameSpec {
  template: 'runner' | 'racing' | 'sudoku' | 'tetris' | 'bomberman' | null; 
  
  playerSprite?: SpriteSpec | null;
  obstacleSprite?: SpriteSpec | null;
  control?: 'keyboard' | 'mouse' | 'touch' | null;
  theme?: 'fantasy' | 'space' | 'desert' | 'logic' | 'classic' | 'arcade' | null;
  backgroundImage?: SpriteSpec | null; 
  
  imagePrompts?: ImagePrompts | null;
}

// 완성된 게임 정보 (DB 저장용)
export interface Game {
  id: string;
  title: string;
  creator: {
    id: string;
    name: string;
  };
  thumbnailUrl: string;
  plays: number;
  gameSpec: GameSpec;    // AI가 완성한 사양서
  gameCode: string;      // AI가 생성한 최종 JS 코드
}