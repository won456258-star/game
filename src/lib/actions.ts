'use server'

import { OpenAI } from "openai"; // 또는 AzureOpenAI
import { Message, AIResponse, ResourceSpec } from './types';

// --- OpenAI 클라이언트 설정 (사용하시는 환경에 맞춰 주석 해제/제거) ---
// [CASE 1] 일반 OpenAI (ChatGPT) 사용 시
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// [CASE 2] Azure OpenAI 사용 시
// const openai = new AzureOpenAI({
//   endpoint: process.env.AZURE_OAI_ENDPOINT!,
//   apiKey: process.env.AZURE_OAI_API_KEY!,
//   apiVersion: "2024-05-01-preview",
//   deployment: process.env.AZURE_OAI_CHAT_DEPLOYMENT_NAME!,
// });
// 이미지 생성용 클라이언트도 별도로 설정 필요... (이전 코드 참고)
// ------------------------------------------------------------------


// 1. 텍스트 생성 함수 (기획 및 프롬프트 작성)
async function callTextGenerationAPI(prompt: string): Promise<string> {
  console.log("GPT: 리소스 기획 중...");
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // 또는 deployment 이름
    messages: [
      { "role": "system", "content": prompt.substring(0, prompt.indexOf('[INST]')) },
      { "role": "user", "content": prompt.substring(prompt.indexOf('[INST]')) }
    ],
    response_format: { "type": "json_object" }
  });
  return response.choices[0].message.content || "{}";
}

// 2. 이미지 생성 함수 (DALL-E 3)
async function generateImageWithAI(spec: ResourceSpec): Promise<string> {
  console.log(`DALL-E: 이미지 생성 중 - ${spec.name}`);
  // Azure 사용 시 클라이언트 교체 필요
  const response = await openai.images.generate({
    model: "dall-e-3", // 또는 deployment 이름
    prompt: spec.imagePrompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });
  return `data:image/png;base64,${response.data[0].b64_json}`;
}

// 3. 메인 함수 (요청 분석 -> 기획 -> 이미지 생성 -> 결과 반환)
export const sendMessageToAI = async (messages: Message[]): Promise<{
  aiMessage: Message;
  generatedResources?: ResourceSpec[];
}> => {
  const lastUserMessage = messages[messages.length - 1].content;

  // ✨ [핵심] AI에게 역할을 부여하는 시스템 프롬프트
  const systemPrompt = `
You are an expert game asset director and prompt engineer.
Your task is to analyze the user's request for game assets and break it down into a list of individual, high-quality asset specifications.
For each asset, define its type, a creative name, a brief description, and a detailed DALL-E 3 prompt to generate it.

**CRITICAL PROMPT ENGINEERING RULES:**
1.  **Style:** All assets MUST be in a **consistent 2D pixel art style** suitable for a retro game. Add "2D pixel art sprite," "retro game style," "clean edges" to prompts.
2.  **Background:** All sprites (except 'background' type) MUST have a **solid white background** for easy removal. Add "isolated on solid white background."
3.  **Perspective:** Use appropriate views (e.g., "side view" for platformers, "top-down view" for shooters).
4.  **Details:** Be specific about colors, actions, and mood to get the best results.

**Response Format (JSON only):**
{
  "reply": "크리스마스 컨셉의 멋진 도트 에셋들을 만들어드릴게요! 잠시만 기다려주세요.",
  "resources": [
    {
      "type": "player",
      "name": "산타클로스",
      "description": "선물 자루를 멘 씩씩한 산타",
      "imagePrompt": "2D pixel art sprite of Santa Claus running, carrying a large sack of gifts, cheerful expression, red suit, white beard, retro game style, isolated on solid white background."
    },
    {
      "type": "enemy",
      "name": "루돌프 로봇",
      "description": "빨간 코가 반짝이는 고장 난 로봇 사슴",
      "imagePrompt": "2D pixel art sprite of a malfunctioning robot reindeer with a glowing red nose, sparks flying, metallic texture, menacing look, side view, retro game style, isolated on solid white background."
    },
    {
      "type": "background",
      "name": "눈 내리는 마을",
      "description": "크리스마스 장식이 된 밤 마을 풍경",
      "imagePrompt": "Seamless looping 2D pixel art background of a snowy Christmas village at night, cozy lights from houses, decorated trees, snow falling, retro game style."
    }
    // ... 필요한 만큼 계속 추가
  ]
}

**User's Request:**
[INST] ${lastUserMessage} [/INST]
`;

  try {
    // 1️⃣ 기획 단계: GPT에게 리소스 목록과 프롬프트를 받아옵니다.
    const gptResponse = await callTextGenerationAPI(systemPrompt);
    const aiPlan: AIResponse = JSON.parse(gptResponse);

    const aiMessage = { id: Date.now().toString(), role: 'ai' as const, content: aiPlan.reply };
    let generatedResources: ResourceSpec[] = [];

    // 2️⃣ 생성 단계: 리소스가 있다면 DALL-E를 돌립니다.
    if (aiPlan.resources && aiPlan.resources.length > 0) {
      console.log(`총 ${aiPlan.resources.length}개의 이미지 생성을 시작합니다.`);
      
      // 여러 이미지를 병렬로 동시에 생성 요청 (속도 향상)
      const imagePromises = aiPlan.resources.map(async (spec) => {
        try {
          const imageUrl = await generateImageWithAI(spec);
          return { ...spec, url: imageUrl }; // URL 채워서 반환
        } catch (error) {
          console.error(`이미지 생성 실패 (${spec.name}):`, error);
          return { ...spec, url: null, description: `(생성 실패) ${spec.description}` }; // 실패 표시
        }
      });

      generatedResources = await Promise.all(imagePromises);
      console.log("모든 이미지 생성 완료!");
      aiMessage.content += " 이미지 생성이 모두 완료되었습니다! '🎨 생성된 리소스' 탭에서 확인해보세요.";
    }

    return { aiMessage, generatedResources };

  } catch (error) {
    console.error("AI 처리 중 오류 발생:", error);
    return {
      aiMessage: { id: Date.now().toString(), role: 'ai', content: "죄송합니다. 요청을 처리하는 중에 문제가 발생했습니다." },
    };
  }
};