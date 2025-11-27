// src/lib/types.ts (Modified/Expanded)

// 기존 타입들... (Message, AIResponse, ResourceSpec, GameSpec 등)
export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

// --- New Types from Python Logic ---
export type Sender = 'user' | 'bot';

export interface PromptDevideResponse {
  Modification_Requests: string[];
  Questions: string[];
  Inappropriate: string[];
}

export interface ModifyCodeResponse {
    game_code: string;
    game_data: string;
    description: string;
}

export interface ChatEntry {
    from: Sender;
    text: string;
}