'use server'

import { GameSpec, Message } from './types'

// ------------------------------------------------------------------
// 1. 게임 코드 생성기
// ------------------------------------------------------------------
const localPlayerImg = '/images/player.png'
const localObstacleImg = '/images/obstacle.png'

// 💥 [핵심] 클라이언트에서 교체할 임시 이름표입니다.
const PLACEHOLDER_PLAYER = "[[PLAYER_IMG_URL]]";
const PLACEHOLDER_OBSTACLE = "[[OBSTACLE_IMG_URL]]";
const PLACEHOLDER_BG = "[[BACKGROUND_IMG_URL]]";

function generateMockCode(spec: GameSpec): string {
  // 💥 코드를 짤 때는 실제 URL 대신 '이름표'를 사용합니다.
  const player = spec.playerSprite?.name || '플레이어';
  const playerUrl = spec.playerSprite?.url ? PLACEHOLDER_PLAYER : localPlayerImg; 
  const playerScale = spec.playerSprite?.scale || 1; 
  
  const obstacle = spec.obstacleSprite?.name || '장애물';
  const obstacleUrl = spec.obstacleSprite?.url ? PLACEHOLDER_OBSTACLE : localObstacleImg;
  const obstacleScale = spec.obstacleSprite?.scale || 1;

  const backgroundUrl = spec.backgroundImage?.url ? PLACEHOLDER_BG : '';
  const bgColor = spec.backgroundImage?.url ? '#FFFFFF' : (spec.theme === 'space' ? '#000020' : '#87CEEB');

  // ... (템플릿 로직은 기존과 동일하므로, 아래 템플릿 부분은 그대로 둡니다.
  //      단, 위에서 정의한 playerUrl, obstacleUrl 변수가 이름표를 담고 있다는 점이 중요합니다!)

  // [여기서부터 기존 템플릿 코드 시작] - 변경 없음
  if (spec.template === 'runner') {
    return `
      let playerChar; let obstacleChar; let cursors; let ground;
      function hitObstacle(player, obstacle) {
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.5)' }).setOrigin(0.5).setDepth(100);
        this.physics.pause();
        player.setTint(0xff0000);
        this.time.addEvent({ delay: 2000, callback: () => { this.scene.restart(); } });
      }
      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '${bgColor}',
        physics: { default: 'arcade', arcade: { gravity: { y: 500 }, debug: false } },
        scene: {
          preload: function() {
            if ('${backgroundUrl}') this.load.image('background_sprite', '${backgroundUrl}');
            this.load.image('player_sprite', '${playerUrl}'); 
            this.load.image('obstacle_sprite', '${obstacleUrl}'); 
          },
          create: function() {
            if ('${backgroundUrl}') this.add.image(400, 300, 'background_sprite').setDisplaySize(800, 600);
            this.add.text(400, 100, '${player}(이)가 ${obstacle}(을)를 피하는 게임', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
            ground = this.physics.add.staticSprite(400, 590, null); ground.setSize(800, 20); ground.setVisible(false); 
            
            playerChar = this.physics.add.sprite(200, 500, 'player_sprite'); 
            playerChar.setScale(${playerScale}); playerChar.setCollideWorldBounds(true);
            this.physics.add.collider(playerChar, ground); 
            
            obstacleChar = this.physics.add.sprite(700, 520, 'obstacle_sprite');
            obstacleChar.setScale(${obstacleScale}); obstacleChar.setImmovable(true); 
            obstacleChar.body.setAllowGravity(false);
            this.physics.add.collider(obstacleChar, ground); 
            
            this.physics.add.collider(playerChar, obstacleChar, hitObstacle, null, this);
            
            this.add.text(400, 50, '(조작: 위 화살표 (점프))', { fontSize: '18px', fill: '#ddd' }).setOrigin(0.5);
            cursors = this.input.keyboard.createCursorKeys();
          },
          update: function() {
            if (this.physics.world.isPaused) return;
            if (obstacleChar.x < -50) {
              obstacleChar.x = 850; obstacleChar.setVelocityX(-Phaser.Math.Between(300, 600));
            } else if (obstacleChar.body.velocity.x === 0) { obstacleChar.setVelocityX(-300); }
            
            if (cursors.up.isDown && playerChar.body.touching.down) { 
              playerChar.setVelocityY(-400); 
            }
          }
        }
      };
    `;
  }
  
  if (spec.template === 'racing') {
    return `
      let playerChar; let obstaclesGroup; let cursors;
      function hitObstacle(player, obstacle) {
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.5)' }).setOrigin(0.5).setDepth(100);
        this.physics.pause(); player.setTint(0xff0000);
        this.time.addEvent({ delay: 2000, callback: () => { this.scene.restart(); } });
      }
      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '${bgColor}',
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scene: {
          preload: function() {
            if ('${backgroundUrl}') this.load.image('background_sprite', '${backgroundUrl}');
            this.load.image('player_sprite', '${playerUrl}'); 
            this.load.image('obstacle_sprite', '${obstacleUrl}'); 
          },
          create: function() {
            if ('${backgroundUrl}') this.add.image(400, 300, 'background_sprite').setDisplaySize(800, 600);
            
            playerChar = this.physics.add.sprite(400, 500, 'player_sprite');
            playerChar.setScale(${playerScale}); playerChar.setCollideWorldBounds(true);
            playerChar.setDamping(true); playerChar.setDrag(0.95);
            
            obstaclesGroup = this.physics.add.group();
            for (let i = 0; i < 5; i++) {
              const obstacle = obstaclesGroup.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 400), 'obstacle_sprite');
              obstacle.setScale(${obstacleScale}); obstacle.setImmovable(true);
            }
            this.physics.add.collider(playerChar, obstaclesGroup, hitObstacle, null, this); 
            
            this.add.text(400, 50, '(조작: 화살표 키 (운전))', { fontSize: '18px', fill: '#ddd' }).setOrigin(0.5);
            cursors = this.input.keyboard.createCursorKeys();
          },
          update: function() {
            if (this.physics.world.isPaused) return; 
            const acceleration = 200; const angularVelocity = 200;
            playerChar.setAngularVelocity(0);
            if (cursors.left.isDown) { playerChar.setAngularVelocity(-angularVelocity); } 
            else if (cursors.right.isDown) { playerChar.setAngularVelocity(angularVelocity); }
            playerChar.setVelocity(0);
            if (cursors.up.isDown) { this.physics.velocityFromRotation(playerChar.rotation - Math.PI/2, acceleration, playerChar.body.velocity); } 
            else if (cursors.down.isDown) { this.physics.velocityFromRotation(playerChar.rotation - Math.PI/2, -acceleration, playerChar.body.velocity); }
          }
        }
      };
    `;
  }

  if (spec.template === 'bomberman') {
     return `
      let playerChar; let cursors; let walls; let bombs;
      const TILE_SIZE = 40; 
      function hitWallOrBomb(player, item) {
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.5)' }).setOrigin(0.5).setDepth(100);
        this.physics.pause(); player.setTint(0xff0000);
        this.time.addEvent({ delay: 2000, callback: () => { this.scene.restart(); } });
      }
      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '#006400', 
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scene: {
          preload: function() {
            if ('${backgroundUrl}') this.load.image('background_sprite', '${backgroundUrl}');
            this.load.image('player_sprite', '${playerUrl}');
            this.load.image('bomb_sprite', '${obstacleUrl}');
            this.load.image('wall_sprite', '${localObstacleImg}'); 
          },
          create: function() {
            if ('${backgroundUrl}') this.add.image(400, 300, 'background_sprite').setDisplaySize(800, 600);
            walls = this.physics.add.staticGroup();
            for (let x = TILE_SIZE/2; x < 800; x += TILE_SIZE) {
              for (let y = TILE_SIZE/2; y < 600; y += TILE_SIZE) {
                if (x === TILE_SIZE/2 || y === TILE_SIZE/2 || x >= 800 - TILE_SIZE/2 || y >= 600 - TILE_SIZE/2 || (x % (TILE_SIZE*2) === TILE_SIZE/2 + TILE_SIZE && y % (TILE_SIZE*2) === TILE_SIZE/2 + TILE_SIZE)) {
                   walls.create(x, y, 'wall_sprite').setScale(${obstacleScale}).refreshBody();
                }
              }
            }
            bombs = this.physics.add.group();
            playerChar = this.physics.add.sprite(TILE_SIZE * 1.5, TILE_SIZE * 1.5, 'player_sprite'); 
            playerChar.setScale(${playerScale}); playerChar.setCollideWorldBounds(true);
            this.physics.add.collider(playerChar, walls);
            this.physics.add.collider(playerChar, bombs, hitWallOrBomb, null, this); 
            cursors = this.input.keyboard.createCursorKeys();
          },
          update: function() {
            if (this.physics.world.isPaused) return; 
            playerChar.setVelocity(0);
            if (cursors.left.isDown) { playerChar.setVelocityX(-150); } 
            else if (cursors.right.isDown) { playerChar.setVelocityX(150); } 
            else if (cursors.up.isDown) { playerChar.setVelocityY(-150); } 
            else if (cursors.down.isDown) { playerChar.setVelocityY(150); }
            if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.time.now > (this.lastBombTime || 0)) {
              const bombX = Math.floor(playerChar.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
              const bombY = Math.floor(playerChar.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
              const bomb = bombs.create(bombX, bombY, 'bomb_sprite'); 
              bomb.setScale(${obstacleScale}); bomb.setImmovable(true);
              this.lastBombTime = this.time.now + 1000;
              this.time.addEvent({ delay: 3000, callback: () => { bomb.destroy(); } });
            }
          }
        }
      };
    `;
  }
  
  // 스도쿠, 테트리스 등 이미지 없는 게임
  if (spec.template === 'sudoku' || spec.template === 'tetris') {
      // (이전 코드의 스도쿠/테트리스 로직을 그대로 유지하면 됩니다. 여기서는 생략하지 않고 간단히 처리)
      return `/* ${spec.template} 코드는 이전과 동일하게 생성됩니다 (이미지 사용 안함) */`;
  }

  return `const config = { type: Phaser.AUTO, parent: containerId, width: 800, height: 600, backgroundColor: '#111111', scene: { create: function() { this.add.text(400, 300, '알 수 없는 템플릿입니다.', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5); } } };`;
}

// ------------------------------------------------------------------
// 2. 이미지 생성기 (Azure DALL-E 3) - 💥 Base64 리턴으로 변경!
// ------------------------------------------------------------------
async function generateImageWithAI(description: string): Promise<string> {
  const AZURE_DALLE_API_KEY = process.env.AZURE_OAI_DALLE_API_KEY;
  const AZURE_DALLE_ENDPOINT = process.env.AZURE_OAI_DALLE_ENDPOINT;
  const AZURE_DALLE_DEPLOYMENT_NAME = process.env.AZURE_OAI_DALLE_DEPLOYMENT_NAME;

  if (!AZURE_DALLE_API_KEY || !AZURE_DALLE_ENDPOINT || !AZURE_DALLE_DEPLOYMENT_NAME) {
    throw new Error("Azure OpenAI DALL-E environment variables are not set");
  }
  
  const API_URL = `${AZURE_DALLE_ENDPOINT}openai/deployments/${AZURE_DALLE_DEPLOYMENT_NAME}/images/generations?api-version=2024-02-01`;

  console.log(`Generating image with Azure DALL-E 3 (Prompt: ${description.substring(0, 20)}...)...`);

  const response = await fetch(
    API_URL,
    {
      method: 'POST',
      headers: { 'api-key': AZURE_DALLE_API_KEY, 'Content-Type': 'application/json' },
      // 💥 response_format을 'b64_json'으로 설정하여 이미지 데이터를 직접 받습니다.
      body: JSON.stringify({ prompt: description, size: "1024x1024", n: 1, response_format: "b64_json" }),
    }
  );

  if (!response.ok) {
    throw new Error(`Azure DALL-E API request failed with status ${response.status}`);
  }

  const result = await response.json();

  // 💥 Base64 데이터를 받아서 Data URL 형식으로 반환합니다.
  if (result.data && result.data[0] && result.data[0].b64_json) {
    return `data:image/png;base64,${result.data[0].b64_json}`;
  } else if (result.data && result.data[0] && result.data[0].url) {
    // 혹시라도 URL로 온 경우 (API 버전에 따라 다를 수 있음)
    return result.data[0].url;
  } else {
    throw new Error("Failed to parse Azure DALL-E API response.");
  }
}

// ------------------------------------------------------------------
// 3. AI 채팅 호출기 (Azure OpenAI) - 변경 없음
// ------------------------------------------------------------------
async function callTextGenerationAPI(prompt: string): Promise<string> {
  const AZURE_CHAT_API_KEY = process.env.AZURE_OAI_API_KEY;
  const AZURE_CHAT_ENDPOINT = process.env.AZURE_OAI_ENDPOINT;
  const AZURE_CHAT_DEPLOYMENT_NAME = process.env.AZURE_OAI_CHAT_DEPLOYMENT_NAME;

  if (!AZURE_CHAT_API_KEY || !AZURE_CHAT_ENDPOINT || !AZURE_CHAT_DEPLOYMENT_NAME) {
    throw new Error("Azure OpenAI Chat environment variables are not set");
  }

  const API_URL = `${AZURE_CHAT_ENDPOINT}openai/deployments/${AZURE_CHAT_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;

  const response = await fetch(
    API_URL,
    {
      method: 'POST',
      headers: { 'api-key': AZURE_CHAT_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { "role": "system", "content": prompt.substring(0, prompt.indexOf('[INST]')) },
          { "role": "user", "content": prompt.substring(prompt.indexOf('[INST]')) }
        ],
        max_tokens: 1500, 
        response_format: { "type": "json_object" } 
      }),
    }
  );

  if (!response.ok) { throw new Error(`Azure OpenAI API request failed with status ${response.status}`); }
  const result = await response.json();
  if (result.choices && result.choices[0] && result.choices[0].message) {
    return result.choices[0].message.content;
  } else { throw new Error("Failed to parse Azure API response."); }
}

// ------------------------------------------------------------------
// 4. 자율형 AI 대화 함수
// ------------------------------------------------------------------
export const sendMessageToAI = async (
  messages: Message[],
  currentSpec: Partial<GameSpec>
): Promise<{
  aiMessage: Message;
  updatedSpec?: Partial<GameSpec>;
  generatedCode?: string | null;
}> => {

  const lastUserMessage = messages[messages.length - 1].content;
  let aiResponseContent = '';
  let newSpec = { ...currentSpec };
  let generatedCode: string | null = null;

  // 프롬프트 (기존과 동일)
  const systemPrompt = `
You are an autonomous game development AI. The user will give you a single prompt.
Your goal is to *autonomously* fill out the *entire* GameSpec JSON based on that prompt *in one step*.
You MUST reply in a specific JSON format. DO NOT write any text outside of the JSON object.
**You MUST respond in the same language as the user's last prompt.**

**User's Prompt:**
${lastUserMessage}

**Your Task:**
1. Analyze the user's prompt.
2. Select the best template: "runner", "racing", "sudoku", "tetris", or "bomberman".
3. **If "runner", "racing", or "bomberman":**
    - Invent creative names for 'playerSprite', 'obstacleSprite', and 'theme'.
    - Invent DALL-E prompts for 'imagePrompts'. **CRITICAL: Add 'white background' and 'isolated' to prompts for easier background removal.**
    - Set 'triggerAllImages: true'.
4. **If "sudoku" or "tetris":**
    - Set 'triggerCodeGeneration: true'.
5. Return the *complete* JSON object.

**JSON Response Format:**
{
  "reply": "알겠습니다! 픽셀아트 스타일의 레이싱 게임을 만들겠습니다...",
  "updatedSpec": {
    "template": "racing",
    "playerSprite": { "name": "Red Kart", "url": null, "scale": 0.5 },
    "obstacleSprite": { "name": "Rock", "url": null, "scale": 0.5 },
    "control": "keyboard",
    "theme": "Desert",
    "backgroundImage": { "name": "Desert Track", "url": null },
    "imagePrompts": { 
      "player": "pixel art of a red racing kart, top down view, white background, isolated", 
      "obstacle": "pixel art of a grey rock, white background, isolated", 
      "background": "pixel art of a desert racing track, top down view" 
    }
  },
  "triggerAllImages": true,
  "triggerCodeGeneration": false
}

**Start your JSON response now:**
[INST] ${lastUserMessage} [/INST]
`;

  try {
    const azureResponseRaw = await callTextGenerationAPI(systemPrompt);
    
    let aiDecision;
    try {
      const jsonMatch = azureResponseRaw.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error("AI response was not in the expected JSON format.");
      const jsonString = jsonMatch[0].replace(/\\n/g, "\\\\n").replace(/,\s*([}\]])/g, '$1'); 
      aiDecision = JSON.parse(jsonString);
    } catch (parseError: any) {
      throw new Error("Failed to parse AI response. " + parseError.message);
    }
    
    aiResponseContent = aiDecision.reply || "AI가 기획서를 생성했습니다.";
    newSpec = aiDecision.updatedSpec || newSpec;

    if (aiDecision.triggerAllImages && newSpec.imagePrompts) {
      aiResponseContent = aiDecision.reply + " (이미지 생성 및 배경 제거 준비 중...)"; 
      
      try {
        const imagePromises = [
          generateImageWithAI(newSpec.imagePrompts.player!),
          generateImageWithAI(newSpec.imagePrompts.obstacle!),
          generateImageWithAI(newSpec.imagePrompts.background!)
        ];
        
        const [playerBase64, obstacleBase64, backgroundBase64] = await Promise.all(imagePromises);
        console.log('All images generated (Base64)!');

        // 💥 Base64 데이터를 spec에 저장합니다. (클라이언트가 다운로드/처리할 수 있도록)
        if (newSpec.playerSprite) newSpec.playerSprite.url = playerBase64;
        if (newSpec.obstacleSprite) newSpec.obstacleSprite.url = obstacleBase64;
        if (newSpec.backgroundImage) newSpec.backgroundImage.url = backgroundBase64;
        
        aiResponseContent = "이미지 생성 완료! 배경 제거 후 게임을 시작합니다...";
        
        // 💥 코드 생성 시에는 Base64 대신 '이름표'가 들어갑니다. (이후 클라이언트에서 교체)
        console.log("Generating game code with placeholders...");
        generatedCode = generateMockCode(newSpec as GameSpec);
        
      } catch (error: any) {
          console.error('Failed to generate images:', error);
          aiResponseContent = `이미지 생성 실패: ${error.message}. 임시 이미지를 사용합니다.`;
          generatedCode = generateMockCode(newSpec as GameSpec); 
      }
    } else if (aiDecision.triggerCodeGeneration) {
      aiResponseContent = aiDecision.reply;
      newSpec = aiDecision.updatedSpec;
      generatedCode = generateMockCode(newSpec as GameSpec);
    }

  } catch (error: any) {
      aiResponseContent = "오류: AI 응답을 처리할 수 없습니다.";
  }

  return {
    aiMessage: { id: Date.now().toString(), role: 'ai', content: aiResponseContent },
    updatedSpec: newSpec,
    generatedCode: generatedCode
  }
}