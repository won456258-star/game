// AI와 대화하는 메시지
export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

// AI가 완성해가는 게임 사양서 (기획서)
export interface GameSpec {
  // 💥 (수정!) "bomberman" (크레이지 아케이드) 템플릿 추가
  template: 'runner' | 'racing' | 'sudoku' | 'tetris' | 'bomberman' | null; 
  
  playerSprite?: { name: string; url: string; scale: number; frameWidth: number; frameHeight: number; } | null;
  obstacleSprite?: { name: string; url: string; scale: number; frameWidth: number; frameHeight: number; } | null;
  control?: 'keyboard' | 'mouse' | null;
  theme?: 'fantasy' | 'space' | 'desert' | 'logic' | 'classic' | 'arcade' | null;
  backgroundImage?: { name: string; url: string; } | null; 
  
  imagePrompts?: {
      player?: string;
      obstacle?: string;
      background?: string;
  };
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