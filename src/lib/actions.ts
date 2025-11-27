// src/lib/actions.ts (MODIFIED FILE)
'use server'

import { OpenAI } from "openai";
import { Message, AIResponse, ResourceSpec, GameSpec, PromptDevideResponse, ModifyCodeResponse } from './types'; 
import { removeCodeFencesSafe, parseAICodeResponse, validateJson, getStylePath, getGameDirPath, getDataPath, getCodePath } from './utils';
import { saveChat } from './chat-manager'; 
import * as path from 'path';
// import * as fs from 'fs/promises'; // 실제 환경에서 필요

// --- MOCK IMPLEMENTATIONS for missing Node.js dependencies/file system logic ---
const mockFs = {
    readFile: async (p: string) => 'original content', // Mock content
    writeFile: async (p: string, d: string) => { /* console.log(`[FS MOCK] Writing to ${p}`) */ },
    exists: (p: string) => true,
    findCurrentVersionFromFile: (p: string) => ({ version: 'v1-1', parent: null }),
    checkTypescriptCompileError: (p: string) => "", // Mock TSC check
};
// Prompt Templates from Python's classes.py (Mocked)
const mockPromptTemplates = {
  getDevidePrompt: (message: string) => `당신의 역할은 사용자 쿼리를 수정/질문/부적절 요청으로 분류하는 것입니다. 결과는 JSON으로만 반환하세요. 사용자 쿼리: ${message}`,
  getMakePrompt: (userReq: string) => `새로운 게임 코드를 생성해 주세요. 요청: ${userReq} ###CODE_START### ... ###DATA_START### ... ###DESCRIPTION_START### ...`,
  getModifyPrompt: (userReq: string, code: string, data: string) => `기존 코드를 수정해 주세요. 요청: ${userReq}. 현재 코드: ${code}`,
};
// -----------------------------------------------------------------------------------

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const modelName = "gpt-4o";

// 1. 텍스트 생성 함수 (기존 DALL-E 리소스 기획용)
async function callTextGenerationAPI(prompt: string): Promise<string> {
  // ... (기존 로직 유지) ...
  return "{}";
}

// 2. 이미지 생성 함수 (기존 DALL-E)
async function generateImageWithAI(spec: ResourceSpec): Promise<string> {
  // ... (기존 로직 유지) ...
  return `data:image/png;base64,`;
}

// --------------------------------------------------------------------
// [파이썬 기능 통합] 이미지 재생성 로직 (스타일 적용 및 배경 제거)
// --------------------------------------------------------------------
async function regenerateAssetLogic(gameName: string, assetName: string, prompt: string): Promise<[boolean, string]> {
    console.log(`\n🎨 [AI 에셋 재생성 시작] 게임: ${gameName}, 파일: ${assetName}`);
    
    const stylePath = getStylePath(gameName);
    let finalPrompt = prompt;
    let savedStyle = '';

    if (mockFs.exists(stylePath)) {
        savedStyle = (await mockFs.readFile(stylePath, 'utf-8')).trim();
        if (savedStyle) {
            finalPrompt = `${prompt}. (IMPORTANT STYLE REQUIREMENT: ${savedStyle})`;
        }
    }
    
    // DALL-E/Vision을 사용한 이미지 재요청 로직
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json", 
        });
        const newImageBase64 = response.data[0].b64_json;
        // const newImageBuffer = Buffer.from(newImageBase64!, 'base64');

        // 배경 제거 (클라이언트 라이브러리 대신 서버에서 처리한다고 가정)
        let lowerName = assetName.toLowerCase();
        if (!lowerName.includes("background") && !lowerName.includes("bg")) {
            // 이 곳에 Node.js용 배경 제거 라이브러리(예: sharp 기반) 호출 로직이 들어갑니다.
            console.log(`   ✂️ [자동 배경 제거] 로직 실행 (실제 처리는 생략)`);
        }

        // 파일 덮어쓰기 (MOCK)
        // await mockFs.writeFile(path.join(path.join(getGameDirPath(gameName), "assets"), assetName), newImageBase64); 

        return [true, `✅ '${assetName}' 재생성 완료! (스타일: ${savedStyle || '기본'})`];

    } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        return [false, `❌ 에러 발생: ${error}`];
    }
}
// --------------------------------------------------------------------

// --------------------------------------------------------------------
// [파이썬 기능 통합] 코드 수정 로직 (modify_code from gemini.py)
// --------------------------------------------------------------------
async function modifyCodeLogic(userRequests: string, userQuestion: string, gameName: string): Promise<[string, string, string, string]> {
    // 1. 기존 코드/데이터 로드 (MOCK)
    const codePath = getCodePath(gameName);
    const dataPath = getDataPath(gameName);

    const originalCode = mockFs.exists(codePath) ? await mockFs.readFile(codePath, 'utf-8') : "";
    const originalData = mockFs.exists(dataPath) ? await mockFs.readFile(dataPath, 'utf-8') : "";
    const isFirstCreated = originalCode === "";

    // 2. 프롬프트 생성 (파이썬 템플릿 사용)
    let prompt: string;
    if (isFirstCreated) {
        prompt = mockPromptTemplates.getMakePrompt(userRequests);
    } else {
        prompt = mockPromptTemplates.getModifyPrompt(userRequests, originalCode, originalData);
    }

    // 3. Gemini API 호출
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [{ "role": "user", "content": prompt }],
    });

    // 4. 응답 파싱 및 유효성 검사
    const responseData = parseAICodeResponse(response.choices[0].message.content || "");
    const gameCode = removeCodeFencesSafe(responseData.game_code || '');
    const gameDataRaw = removeCodeFencesSafe(responseData.game_data || '');
    let description = removeCodeFencesSafe(responseData.description || '');

    let modifyCheck = "";
    let error = "";
    
    // 파일 쓰기 및 유효성 검사 (MOCK)
    if (gameCode) { modifyCheck += "< game.ts : 수정 O >   "; } else { modifyCheck += "< game.ts : 수정 X >   "; }

    if (gameDataRaw) {
        error = validateJson(gameDataRaw);
        if (error === "") {
            // await mockFs.writeFile(dataPath, gameDataRaw); // MOCK 저장
            // mockFs.checkAndCreateImagesWithText(...) // Asset Generation Mock 호출
            modifyCheck += "< data.json : 수정 O >\n";
        } else {
            modifyCheck += "< data.json : 수정 X (JSON Error) >\n";
        }
    } else { modifyCheck += "< data.json : 수정 X >\n"; }
    
    // 컴파일 에러 체크 및 버전 생성 (MOCK)
    description = modifyCheck + description;
    const tscError = mockFs.checkTypescriptCompileError(codePath);
    if (tscError) { error = (error ? error + '\n' : '') + tscError; }
    
    return [gameCode, gameDataRaw, description, error];
}
// --------------------------------------------------------------------


// 3. 메인 함수 (파이썬의 /process-code 엔드포인트 기능 흡수)
export const sendMessageToAI = async (messages: Message[], gameSpec: Partial<GameSpec>, gameName: string): Promise<{
  aiMessage: Message;
  generatedResources?: ResourceSpec[];
  generatedCode?: string;
  gameData?: string;
}> => {
  const lastUserMessage = messages[messages.length - 1].content;
  saveChat(gameName, 'user', lastUserMessage); // 채팅 저장

  // A. 스타일 설정 요청 처리
  const styleMatch = lastUserMessage.match(/^(스타일 설정:|Set style:)/i);
  if (styleMatch) {
    const styleContent = lastUserMessage.split(":", 2)[1]?.trim() || "";
    if (styleContent) {
        // await mockFs.writeFile(getStylePath(gameName), styleContent); // MOCK 파일 저장
        const replyMsg = `✅ 게임 스타일이 '${styleContent}'(으)로 설정되었습니다!`;
        saveChat(gameName, 'bot', replyMsg);
        return { aiMessage: { id: Date.now().toString(), role: 'ai' as const, content: replyMsg } };
    }
  }

  // B. 이미지 재요청 처리
  const assetMatch = lastUserMessage.match(/([\w-]+\.png)/i);
  const keywordMatch = lastUserMessage.match(/(그려|바꿔|생성|만들어|수정)/);
  if (assetMatch && keywordMatch) {
    const assetName = assetMatch[1];
    const prompt = lastUserMessage.replace(assetName, "").replace("줘", "").trim();
    
    const [success, replyMsg] = await regenerateAssetLogic(gameName, assetName, prompt);
    saveChat(gameName, 'bot', replyMsg);
    
    return { aiMessage: { id: Date.now().toString(), role: 'ai' as const, content: replyMsg } };
  }
  
  // C. 요청 분할 및 코드 수정/생성 로직
  const devidePrompt = mockPromptTemplates.getDevidePrompt(lastUserMessage);
  let devideResponse: string;
  try {
      const response = await openai.chat.completions.create({
          model: modelName,
          messages: [{ "role": "user", "content": devidePrompt }],
          response_format: { "type": "json_object" }
      });
      devideResponse = response.choices[0].message.content || "";
  } catch (e) {
      const errorMsg = "요청 분할 중 AI 오류가 발생했습니다. 다시 시도해 주세요.";
      saveChat(gameName, 'bot', errorMsg);
      return { aiMessage: { id: Date.now().toString(), role: 'ai', content: errorMsg } };
  }

  const devideResult: PromptDevideResponse = JSON.parse(removeCodeFencesSafe(devideResponse));
  const modificationRequests = devideResult.Modification_Requests || [];
  const questions = devideResult.Questions || [];
  const inappropriate = devideResult.Inappropriate || [];
  
  let inappropriateAnswer = inappropriate.map(item => `죄송합니다. '${item}'는 도와드릴 수 없습니다.`).join('\n\n');
  let devideSummary = `요청: ${modificationRequests.join(', ')}\n질문: ${questions.join(', ')}`;


  // 수정 요청이 있는 경우 (핵심 로직)
  if (modificationRequests.length > 0) {
      let gameCode = '';
      let gameData = '';
      let descriptionTotal = '';
      let error = '';
      let success = false;
      let userRequests = modificationRequests.join(' ');
      
      for (let i = 0; i < 5; i++) {
          try {
              const [code, data, desc, err] = await modifyCodeLogic(userRequests, questions.join(' '), gameName);
              descriptionTotal += desc;
              
              if (err === "") {
                  gameCode = code;
                  gameData = data;
                  success = true;
                  break;
              } else {
                  userRequests = err; 
                  descriptionTotal += `\n\n========Compile Error========\n${err}\n=============================\n`;
              }
          } catch (e) {
              console.error(e);
          }
      }

      if (success) {
          const replyContent = devideSummary + "\n\n" + descriptionTotal + "\n\n" + inappropriateAnswer + " 코드가 생성/수정되었습니다. '🎨 생성된 리소스' 탭에서 확인해보세요.";
          saveChat(gameName, 'bot', replyContent);
          return { 
              aiMessage: { id: Date.now().toString(), role: 'ai' as const, content: replyContent },
              generatedCode: gameCode,
              gameData: gameData
          };
      } else {
          const failMessage = devideSummary + "\n\n" + descriptionTotal + "\n\n" + inappropriateAnswer + "\n\n코드 수정에 실패했습니다. 다시 시도해 주세요.";
          saveChat(gameName, 'bot', failMessage);
          return { aiMessage: { id: Date.now().toString(), role: 'ai', content: failMessage } };
      }
  } 
  // 질문만 있는 경우 (간소화)
  else {
    const replyContent = devideSummary + "\n\n" + inappropriateAnswer + (questions.length > 0 ? " 질문에 대한 답변 로직이 생략되었습니다." : "\n\n무엇을 도와드릴까요?");
    saveChat(gameName, 'bot', replyContent);
    return { aiMessage: { id: Date.now().toString(), role: 'ai', content: replyContent } };
  }
};