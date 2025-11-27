// src/lib/utils.ts (NEW FILE)
import * as path from 'path';
import { ModifyCodeResponse } from './types';

// --- Path Helpers (Mocking Python's path functions) ---
const GAMES_ROOT_DIR = path.join(process.cwd(), 'game-projects'); 
const STYLE_FILE_NAME = "style.txt";

export function getGameDirPath(gameName: string): string {
  return path.join(GAMES_ROOT_DIR, gameName);
}

export function getCodePath(gameName: string): string {
  return path.join(getGameDirPath(gameName), "game.ts");
}

export function getDataPath(gameName: string): string {
  return path.join(getGameDirPath(gameName), "data.json");
}

export function getChatPath(gameName: string): string {
  return path.join(getGameDirPath(gameName), "chat.json");
}

export function getStylePath(gameName: string): string {
  return path.join(getGameDirPath(gameName), STYLE_FILE_NAME);
}

// --- AI Response Parsing (from Python's gemini.py) ---
export function parseAICodeResponse(responseText: string): Partial<ModifyCodeResponse> {
    const result: Partial<ModifyCodeResponse> = {};
    
    // game_code
    const codeStart = responseText.indexOf("###CODE_START###");
    const codeEnd = responseText.indexOf("###CODE_END###");
    if (codeStart !== -1 && codeEnd !== -1 && codeEnd > codeStart) {
        result.game_code = responseText.substring(codeStart + "###CODE_START###".length, codeEnd).trim();
    }
    
    // game_data
    const dataStart = responseText.indexOf("###DATA_START###");
    const dataEnd = responseText.indexOf("###DATA_END###");
    if (dataStart !== -1 && dataEnd !== -1 && dataEnd > dataStart) {
        result.game_data = responseText.substring(dataStart + "###DATA_START###".length, dataEnd).trim();
    }

    // description
    const descStart = responseText.indexOf("###DESCRIPTION_START###");
    const descEnd = responseText.indexOf("###DESCRIPTION_END###");
    if (descStart !== -1 && descEnd !== -1 && descEnd > descStart) {
        result.description = responseText.substring(descStart + "###DESCRIPTION_START###".length, descEnd).trim();
    }

    return result;
}

// --- Code Fence Removal (from Python's gemini.py) ---
export function removeCodeFencesSafe(codeString: string): string {
    let processedString = codeString.trim();

    // 1. Remove leading fence (e.g., ```json or ```typescript)
    if (processedString.startsWith('```')) {
        const firstNewlineIndex = processedString.indexOf('\n');
        if (firstNewlineIndex !== -1) {
            processedString = processedString.substring(firstNewlineIndex + 1);
        } else {
            processedString = processedString.substring(3);
        }
    }

    // 2. Remove trailing fence (```)
    processedString = processedString.trimRight();
    if (processedString.endsWith('```')) {
        processedString = processedString.substring(0, processedString.length - 3);
    }
    
    return processedString.trim();
}

// --- JSON Validation (Simplified) ---
export function validateJson(jsonStr: string): string {
    try {
        JSON.parse(jsonStr);
        return "";
    } catch (e) {
        if (e instanceof Error) {
            return `JSON 형식 오류: ${e.message}`;
        }
        return "알 수 없는 JSON 형식 오류";
    }
}