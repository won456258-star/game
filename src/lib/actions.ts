'use server'

import { AzureOpenAI } from "openai";
import { GameSpec, Message } from './types';

const localPlayerImg = '/images/player.png';
const localObstacleImg = '/images/obstacle.png';

const PLACEHOLDER_PLAYER = "[[PLAYER_IMG_URL]]";
const PLACEHOLDER_OBSTACLE = "[[OBSTACLE_IMG_URL]]";
const PLACEHOLDER_BG = "[[BACKGROUND_IMG_URL]]";

// ------------------------------------------------------------------
// 1. 게임 코드 생성기 (변경 없음)
// ------------------------------------------------------------------
function generateMockCode(spec: GameSpec): string {
  const player = spec.playerSprite?.name || '플레이어';
  const playerUrl = spec.playerSprite?.url ? PLACEHOLDER_PLAYER : localPlayerImg; 
  const playerScale = spec.playerSprite?.scale || 1; 
  
  const obstacle = spec.obstacleSprite?.name || '장애물';
  const obstacleUrl = spec.obstacleSprite?.url ? PLACEHOLDER_OBSTACLE : localObstacleImg;
  const obstacleScale = spec.obstacleSprite?.scale || 1;

  const backgroundUrl = spec.backgroundImage?.url ? PLACEHOLDER_BG : '';
  const bgColor = spec.backgroundImage?.url ? '#FFFFFF' : (spec.theme === 'space' ? '#000020' : '#87CEEB');

  const syncScaleLogic = (target: string, defaultScale: number, isGroup = false) => `
    if (window.gameConfig && ${target}) {
      const newScale = (window.gameConfig.${target === 'playerChar' ? 'playerScale' : 'obstacleScale'} || ${defaultScale});
      ${isGroup 
        ? `${target}.getChildren().forEach(child => child.setScale(newScale));` 
        : `${target}.setScale(newScale);`
      }
    }
  `;

  // (템플릿 코드는 너무 길어서 생략합니다. 기존 코드가 잘 동작했다면 그대로 두셔도 되지만, 
  // 혹시 모르니 전체 코드를 원하시면 말씀해주세요. 일단 아래 템플릿 로직은 기존과 동일하게 유지됩니다.)
  
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
            ${syncScaleLogic('playerChar', playerScale)}
            ${syncScaleLogic('obstacleChar', obstacleScale)}
            if (obstacleChar.x < -50) {
              obstacleChar.x = 850; obstacleChar.setVelocityX(-Phaser.Math.Between(300, 600));
            } else if (obstacleChar.body.velocity.x === 0) { obstacleChar.setVelocityX(-300); }
            if (cursors.up.isDown && playerChar.body.touching.down) { playerChar.setVelocityY(-400); }
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
            ${syncScaleLogic('playerChar', playerScale)}
            ${syncScaleLogic('obstaclesGroup', obstacleScale, true)}
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
            ${syncScaleLogic('playerChar', playerScale)}
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
  
  return `const config = { type: Phaser.AUTO, parent: containerId, width: 800, height: 600, backgroundColor: '#111111', scene: { create: function() { this.add.text(400, 300, '지원하지 않는 게임입니다.', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5); } } };`;
}

// ------------------------------------------------------------------
// 2. 💥 이미지 생성기 (Azure DALL-E 사용)
// ------------------------------------------------------------------
async function generateImageWithAI(description: string): Promise<string> {
  const endpoint = process.env.AZURE_OAI_DALLE_ENDPOINT;
  const apiKey = process.env.AZURE_OAI_DALLE_API_KEY;
  const deployment = process.env.AZURE_OAI_DALLE_DEPLOYMENT_NAME;

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure DALL-E 환경 변수가 설정되지 않았습니다.");
  }

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: "2024-02-01", 
    deployment,
  });

  console.log(`Azure DALL-E 3 이미지 생성 중: ${description}`);

  const response = await client.images.generate({
    model: deployment,
    prompt: description,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });

  if (response.data && response.data[0] && response.data[0].b64_json) {
    return `data:image/png;base64,${response.data[0].b64_json}`;
  } else {
    throw new Error("이미지 생성 실패");
  }
}

// ------------------------------------------------------------------
// 3. 💥 텍스트 생성기 (Azure OpenAI Chat 사용)
// ------------------------------------------------------------------
async function callTextGenerationAPI(prompt: string): Promise<string> {
  const endpoint = process.env.AZURE_OAI_ENDPOINT;
  const apiKey = process.env.AZURE_OAI_API_KEY;
  const deployment = process.env.AZURE_OAI_CHAT_DEPLOYMENT_NAME;

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure Chat 환경 변수가 설정되지 않았습니다.");
  }

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: "2024-05-01-preview",
    deployment,
  });

  console.log("Azure GPT 텍스트 생성 중...");

  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { "role": "system", "content": prompt.substring(0, prompt.indexOf('[INST]')) },
      { "role": "user", "content": prompt.substring(prompt.indexOf('[INST]')) }
    ],
    response_format: { "type": "json_object" }
  });

  if (response.choices && response.choices[0] && response.choices[0].message.content) {
    return response.choices[0].message.content;
  } else {
    throw new Error("GPT 응답 실패");
  }
}

// ------------------------------------------------------------------
// 4. 자율형 AI 대화 함수 (메인)
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

  const systemPrompt = `
You are an autonomous game development AI. 
Your goal is to *autonomously* fill out the *entire* GameSpec JSON based on the user prompt *in one step*.
You MUST reply in a specific JSON format. DO NOT write any text outside of the JSON object.
**You MUST respond in the same language as the user's last prompt (Korean).**

**User's Prompt:**
${lastUserMessage}

**Your Task:**
1. Analyze the prompt.
2. Select the best template: "runner", "racing", or "bomberman".
3. Invent creative names for sprites and theme.
4. Invent DALL-E prompts for 'imagePrompts'. **CRITICAL: Add 'white background' and 'isolated' to prompts.**
5. Set 'triggerAllImages: true'.
6. Return the *complete* JSON object.

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
    const gptResponse = await callTextGenerationAPI(systemPrompt);
    let aiDecision;
    
    try {
        aiDecision = JSON.parse(gptResponse);
    } catch (e) {
        const jsonMatch = gptResponse.match(/{[\s\S]*}/);
        if (jsonMatch) {
            aiDecision = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("JSON 파싱 실패");
        }
    }
    
    aiResponseContent = aiDecision.reply || "AI가 기획서를 생성했습니다.";
    newSpec = aiDecision.updatedSpec || newSpec;

    if (aiDecision.triggerAllImages && newSpec.imagePrompts) {
      aiResponseContent += " (이미지 생성 중...)"; 
      
      try {
        const imagePromises = [
          generateImageWithAI(newSpec.imagePrompts.player!),
          generateImageWithAI(newSpec.imagePrompts.obstacle!),
          generateImageWithAI(newSpec.imagePrompts.background!)
        ];
        
        const [playerBase64, obstacleBase64, backgroundBase64] = await Promise.all(imagePromises);
        
        if (newSpec.playerSprite) newSpec.playerSprite.url = playerBase64;
        if (newSpec.obstacleSprite) newSpec.obstacleSprite.url = obstacleBase64;
        if (newSpec.backgroundImage) newSpec.backgroundImage.url = backgroundBase64;
        
        aiResponseContent = "이미지 생성 완료! 게임을 시작합니다.";
        generatedCode = generateMockCode(newSpec as GameSpec);
        
      } catch (error: any) {
          console.error('Image Gen Error:', error);
          aiResponseContent = `이미지 생성 실패: ${error.message}. 임시 이미지를 사용합니다.`;
          generatedCode = generateMockCode(newSpec as GameSpec); 
      }
    }

  } catch (error: any) {
      aiResponseContent = "오류: AI 응답을 처리할 수 없습니다.";
      console.error(error);
  }

  return {
    aiMessage: { id: Date.now().toString(), role: 'ai', content: aiResponseContent },
    updatedSpec: newSpec,
    generatedCode: generatedCode
  }
}