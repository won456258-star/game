'use server' // 💥 이 파일의 모든 코드는 서버에서만 실행됩니다!

import { GameSpec, Message } from './types'

// ------------------------------------------------------------------
// 1. 💥 게임 코드 생성기 (애니메이션 제거! 중력/점프/충돌은 확실히 적용!)
// ------------------------------------------------------------------
const localPlayerImg = '/images/player.png'
const localObstacleImg = '/images/obstacle.png'

function generateMockCode(spec: GameSpec): string {
  
  // 공통 변수 (러너, 레이싱용)
  // 💥 (수정!) playerUrl, obstacleUrl에 spec?.url 값을 확실히 대입합니다!
  const player = spec.playerSprite?.name || '플레이어';
  const playerUrl = spec.playerSprite?.url || localPlayerImg; 
  const playerScale = spec.playerSprite?.scale || 1; 
  
  const obstacle = spec.obstacleSprite?.name || '장애물';
  const obstacleUrl = spec.obstacleSprite?.url || localObstacleImg;
  const obstacleScale = spec.obstacleSprite?.scale || 1;

  const backgroundUrl = spec.backgroundImage?.url || '';
  const bgColor = spec.backgroundImage?.url ? '#FFFFFF' : (spec.theme === 'space' ? '#000020' : '#87CEEB');

  // ===================================
  // 💥 템플릿 1: 러너 (Runner) - 중력/점프/충돌 수정 (애니메이션 제거)
  // ===================================
  if (spec.template === 'runner') {
    return `
      let playerChar; let obstacleChar; let cursors; let ground;
      // 💥 (추가!) 게임 오버 콜백 함수
      function hitObstacle(player, obstacle) {
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', backgroundColor: 'rgba(0,0,0,0.5)' }).setOrigin(0.5).setDepth(100);
        this.physics.pause(); // 물리 엔진 정지
        player.setTint(0xff0000); // 플레이어 빨간색으로
        this.time.addEvent({
          delay: 2000, // 2초 후
          callback: () => {
            this.scene.restart(); // 씬 재시작 (목숨 1개 깎임)
          }
        });
      }

      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '${bgColor}',
        physics: { default: 'arcade', arcade: { 
          // 💥 (수정!) 중력을 500으로 다시 설정합니다!
          gravity: { y: 500 }, 
          debug: false 
        } },
        scene: {
          preload: function() {
            if ('${backgroundUrl}') this.load.image('background_sprite', '${backgroundUrl}');
            // 💥 (수정!) 'spritesheet' 대신 'image' 로드
            this.load.image('player_sprite', '${playerUrl}'); 
            this.load.image('obstacle_sprite', '${obstacleUrl}'); 
          },
          create: function() {
            if ('${backgroundUrl}') this.add.image(400, 300, 'background_sprite').setDisplaySize(800, 600);
            this.add.text(400, 100, '${player}(이)가 ${obstacle}(을)를 피하는 게임', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
            ground = this.physics.add.staticSprite(400, 590, null); ground.setSize(800, 20); ground.setVisible(false); 
            
            // 💥 (수정!) 'sprite' 생성 (프레임 번호 0 제거)
            playerChar = this.physics.add.sprite(200, 500, 'player_sprite'); 
            playerChar.setScale(${playerScale}); playerChar.setCollideWorldBounds(true);
            this.physics.add.collider(playerChar, ground); 
            
            obstacleChar = this.physics.add.sprite(700, 520, 'obstacle_sprite');
            obstacleChar.setScale(${obstacleScale}); obstacleChar.setImmovable(true); 
            obstacleChar.body.setAllowGravity(false);
            this.physics.add.collider(obstacleChar, ground); 
            
            // 💥 (추가!) 플레이어와 장애물 충돌 감지
            this.physics.add.collider(playerChar, obstacleChar, hitObstacle, null, this);
            
            // 💥 (제거!) 애니메이션 로직 모두 제거
            
            this.add.text(400, 50, '(조작: 위 화살표 (점프))', { fontSize: '18px', fill: '#ddd' }).setOrigin(0.5);
            cursors = this.input.keyboard.createCursorKeys();
          },
          update: function() {
            if (this.physics.world.isPaused) return; // 💥 게임 오버 시 멈춤

            if (obstacleChar.x < -50) {
              obstacleChar.x = 850; obstacleChar.setVelocityX(-Phaser.Math.Between(300, 600));
            } else if (obstacleChar.body.velocity.x === 0) { obstacleChar.setVelocityX(-300); }
            
            // 💥 (수정!) '점프' 로직
            if (cursors.up.isDown && playerChar.body.touching.down) { 
              playerChar.setVelocityY(-400); // 점프 파워
            }
            
            // 💥 (제거!) 애니메이션 제어 로직 제거
          }
        }
      };
    `;
  }
  
  // ===================================
  // 💥 템플릿 2: 레이싱 (Racing) - 충돌 수정 (애니메이션 제거)
  // ===================================
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
            // 💥 (수정!) 'spritesheet' 대신 'image' 로드
            this.load.image('player_sprite', '${playerUrl}'); 
            this.load.image('obstacle_sprite', '${obstacleUrl}'); 
          },
          create: function() {
            if ('${backgroundUrl}') this.add.image(400, 300, 'background_sprite').setDisplaySize(800, 600);
            
            playerChar = this.physics.add.sprite(400, 500, 'player_sprite'); // 💥 프레임 번호 0 제거
            playerChar.setScale(${playerScale}); playerChar.setCollideWorldBounds(true);
            playerChar.setDamping(true); playerChar.setDrag(0.95);
            
            obstaclesGroup = this.physics.add.group();
            for (let i = 0; i < 5; i++) {
              const obstacle = obstaclesGroup.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 400), 'obstacle_sprite'); // 💥 프레임 번호 0 제거
              obstacle.setScale(${obstacleScale}); obstacle.setImmovable(true);
            }
            this.physics.add.collider(playerChar, obstaclesGroup, hitObstacle, null, this); 
            
            // 💥 (제거!) 애니메이션 로직 모두 제거

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

  // ===================================
  // 템플릿 3: 스도쿠 (Sudoku)
  // ===================================
  if (spec.template === 'sudoku') {
    return `
      const puzzle = [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]];
      const solution = [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]];
      let gridCells = []; let selectedCell = null;
      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '#f0f0f0',
        scene: {
          create: function() {
            this.add.text(400, 50, '스도쿠 게임', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);
            const gridSize = 450, cellSize = gridSize / 9;
            const startX = (800 - gridSize) / 2, startY = (600 - gridSize) / 2;
            for (let r = 0; r < 9; r++) {
              gridCells[r] = [];
              for (let c = 0; c < 9; c++) {
                const x = startX + c * cellSize, y = startY + r * cellSize;
                const cellRect = this.add.rectangle(x, y, cellSize, cellSize).setOrigin(0).setStrokeStyle(1, 0xaaaaaa).setFillStyle(0xffffff).setInteractive();
                const num = puzzle[r][c];
                const text = this.add.text(x + cellSize/2, y + cellSize/2, num === 0 ? '' : num.toString(), { fontSize: '32px', fill: num === 0 ? '#3498db' : '#000000' }).setOrigin(0.5);
                gridCells[r][c] = { rect: cellRect, text: text, isGiven: (num !== 0) };
                cellRect.on('pointerdown', () => {
                  if (gridCells[r][c].isGiven) return;
                  if (selectedCell) gridCells[selectedCell.row][selectedCell.col].rect.setFillStyle(0xffffff);
                  selectedCell = { row: r, col: c }; cellRect.setFillStyle(0xeeeeee);
                });
              }
            }
            const graphics = this.add.graphics({ lineStyle: { width: 4, color: 0x000000 } });
            for (let i = 0; i <= 3; i++) {
              graphics.strokeLine(startX, startY + i * (cellSize * 3), startX + gridSize, startY + i * (cellSize * 3));
              graphics.strokeLine(startX + i * (cellSize * 3), startY, startX + i * (cellSize * 3), startY + gridSize);
            }
            this.input.keyboard.on('keydown', (event) => {
              if (selectedCell) {
                const key = event.key;
                if (key >= '1' && key <= '9') gridCells[selectedCell.row][selectedCell.col].text.setText(key);
                else if (key === 'Backspace' || key === 'Delete' || key === '0') gridCells[selectedCell.row][selectedCell.col].text.setText('');
              }
            });
            const checkButton = this.add.text(400, 550, '정답 확인', { fontSize: '24px', fill: '#ffffff', backgroundColor: '#2ecc71', padding: 10 }).setOrigin(0.5).setInteractive();
            checkButton.on('pointerdown', () => {
              let isCorrect = true;
              for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) { const cellText = gridCells[r][c].text.text; const cellValue = cellText === '' ? 0 : parseInt(cellText); if (cellValue !== solution[r][c]) { isCorrect = false; break; } } if (!isCorrect) break; }
              if (isCorrect) this.add.text(400, 300, '성공!', { fontSize: '64px', fill: 'green', backgroundColor: 'rgba(255,255,255,0.8)' }).setOrigin(0.5);
              else this.add.text(400, 300, '실패!', { fontSize: '64px', fill: 'red', backgroundColor: 'rgba(255,255,255,0.8)' }).setOrigin(0.5);
            });
          }
        }
      };
    `;
  }
  
  // ===================================
  // 템플릿 4: 테트리스 (Tetris)
  // ===================================
  if (spec.template === 'tetris') {
    return `
      const COLS = 10; const ROWS = 20; const BLOCK_SIZE = 30;
      let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      let currentPiece; let currentX; let currentY;
      let dropTimer;
      let cursors;
      let graphics;
      let score = 0; let scoreText;
      const PIECES = [[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
      function createPiece() {
        const typeId = Math.floor(Math.random() * PIECES.length); currentPiece = PIECES[typeId];
        currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2); currentY = 0;
        if (checkCollision(currentX, currentY, currentPiece)) {
          dropTimer.remove(); this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: 'red' }).setOrigin(0.5);
        }
      }
      function checkCollision(x, y, piece) {
        for (let r = 0; r < piece.length; r++) {
          for (let c = 0; c < piece[0].length; c++) {
            if (piece[r][c] && ((board[y + r] && board[y + r][x + c] !== 0) || (y + r >= ROWS) || (x + c < 0) || (x + c >= COLS))) { return true; }
          }
        } return false;
      }
      function lockPiece() {
        for (let r = 0; r < currentPiece.length; r++) {
          for (let c = 0; c < currentPiece[0].length; c++) {
            if (currentPiece[r][c]) { board[currentY + r][currentX + c] = 1; }
          }
        }
      }
      function clearLines() {
        let linesCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every(cell => cell !== 0)) {
            linesCleared++; board.splice(r, 1); board.unshift(Array(COLS).fill(0)); r++;
          }
        }
        score += linesCleared * 10; scoreText.setText('Score: ' + score);
      }
      function drawBoard() {
        graphics.clear(); const startX = (800 - (COLS * BLOCK_SIZE)) / 2; const startY = (600 - (ROWS * BLOCK_SIZE)) / 2;
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (board[r][c] !== 0) { graphics.fillStyle(0x888888, 1); graphics.fillRect(startX + c * BLOCK_SIZE, startY + r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); } } }
        for (let r = 0; r < currentPiece.length; r++) { for (let c = 0; c < currentPiece[0].length; c++) { if (currentPiece[r][c]) { graphics.fillStyle(0xFF0000, 1); graphics.fillRect(startX + (currentX + c) * BLOCK_SIZE, startY + (currentY + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); } } }
        graphics.lineStyle(1, 0x555555, 0.5);
        for (let r = 0; r <= ROWS; r++) graphics.strokeLine(startX, startY + r * BLOCK_SIZE, startX + COLS * BLOCK_SIZE, startY + r * BLOCK_SIZE);
        for (let c = 0; c <= COLS; c++) graphics.strokeLine(startX + c * BLOCK_SIZE, startY, startX + c * BLOCK_SIZE, startY + ROWS * BLOCK_SIZE);
      }
      function movePiece(dx, dy) { if (!checkCollision(currentX + dx, currentY + dy, currentPiece)) { currentX += dx; currentY += dy; return true; } return false; }
      function rotatePiece() {
        const newPiece = []; const rows = currentPiece.length; const cols = currentPiece[0].length;
        for (let c = 0; c < cols; c++) { newPiece[c] = []; for (let r = rows - 1; r >= 0; r--) { newPiece[c].push(currentPiece[r][c]); } }
        if (!checkCollision(currentX, currentY, newPiece)) { currentPiece = newPiece; }
      }
      const config = {
        type: Phaser.AUTO, parent: containerId, width: 800, height: 600,
        backgroundColor: '#111111',
        scene: {
          create: function() {
            this.add.text(400, 30, '테트리스', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
            scoreText = this.add.text(100, 50, 'Score: 0', { fontSize: '24px', fill: '#fff' });
            this.add.text(100, 100, '조작: 좌/우/아래 (이동)\\n위 (회전)', { fontSize: '18px', fill: '#ddd', align: 'left' });
            graphics = this.add.graphics();
            this.createPiece = createPiece.bind(this); this.checkCollision = checkCollision.bind(this); this.lockPiece = lockPiece.bind(this);
            this.clearLines = clearLines.bind(this); this.drawBoard = drawBoard.bind(this); this.movePiece = movePiece.bind(this); this.rotatePiece = rotatePiece.bind(this);
            this.createPiece();
            dropTimer = this.time.addEvent({
              delay: 1000,
              callback: () => { if (!this.movePiece(0, 1)) { this.lockPiece(); this.clearLines(); this.createPiece(); } }, loop: true
            });
            cursors = this.input.keyboard.createCursorKeys();
            this.input.keyboard.on('keydown-LEFT', () => this.movePiece(-1, 0)); this.input.keyboard.on('keydown-RIGHT', () => this.movePiece(1, 0));
            this.input.keyboard.on('keydown-DOWN', () => { if (!this.movePiece(0, 1)) { this.lockPiece(); this.clearLines(); this.createPiece(); } dropTimer.delay = 1000; });
            this.input.keyboard.on('keydown-UP', () => this.rotatePiece());
          },
          update: function() { this.drawBoard(); }
        }
      };
    `;
  }
  
  // ===================================
  // 템플릿 5: 크레이지 아케이드 (Bomberman)
  // ===================================
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
            // 💥 (수정!) 'spritesheet' 대신 'image' 로드
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
            playerChar.setScale(${playerScale});
            playerChar.setCollideWorldBounds(true);
            
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
              bomb.setScale(${obstacleScale});
              bomb.setImmovable(true);
              
              this.lastBombTime = this.time.now + 1000;
              
              this.time.addEvent({
                delay: 3000,
                callback: () => {
                  bomb.destroy(); 
                }
              });
            }
          }
        }
      };
    `;
  }
  
  // 템플릿이 없는 경우 (기본값)
  return `const config = { type: Phaser.AUTO, parent: containerId, width: 800, height: 600, backgroundColor: '#111111', scene: { create: function() { this.add.text(400, 300, '알 수 없는 템플릿입니다.', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5); } } };`;
}


// ------------------------------------------------------------------
// 2. 이미지 생성기 (Azure DALL-E 3 - 이전과 동일)
// ------------------------------------------------------------------
async function generateImageWithAI(description: string): Promise<string> {
  const AZURE_DALLE_API_KEY = process.env.AZURE_OAI_DALLE_API_KEY;
  const AZURE_DALLE_ENDPOINT = process.env.AZURE_OAI_DALLE_ENDPOINT;
  const AZURE_DALLE_DEPLOYMENT_NAME = process.env.AZURE_OAI_DALLE_DEPLOYMENT_NAME;

  if (!AZURE_DALLE_API_KEY || !AZURE_DALLE_ENDPOINT || !AZURE_DALLE_DEPLOYMENT_NAME) {
    throw new Error("Azure OpenAI DALL-E environment variables are not set");
  }
  
  const API_URL = `${AZURE_DALLE_ENDPOINT}openai/deployments/${AZURE_DALLE_DEPLOYMENT_NAME}/images/generations?api-version=2024-02-01`;

  console.log(`Generating image with Azure DALL-E 3 (Deployment: ${AZURE_DALLE_DEPLOYMENT_NAME})...`);

  const response = await fetch(
    API_URL,
    {
      method: 'POST',
      headers: { 'api-key': AZURE_DALLE_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: description, size: "1024x1024", n: 1 }),
    }
  );

  if (!response.ok) {
    throw new Error(`Azure DALL-E API request failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.data && result.data[0] && result.data[0].url) {
    return result.data[0].url;
  } else {
    throw new Error("Failed to parse Azure DALL-E API response.");
  }
}

// ------------------------------------------------------------------
// 3. AI 채팅 호출기 (Azure OpenAI - 이전과 동일)
// ------------------------------------------------------------------
async function callTextGenerationAPI(prompt: string): Promise<string> {
  const AZURE_CHAT_API_KEY = process.env.AZURE_OAI_API_KEY;
  const AZURE_CHAT_ENDPOINT = process.env.AZURE_OAI_ENDPOINT;
  const AZURE_CHAT_DEPLOYMENT_NAME = process.env.AZURE_OAI_CHAT_DEPLOYMENT_NAME;

  if (!AZURE_CHAT_API_KEY || !AZURE_CHAT_ENDPOINT || !AZURE_CHAT_DEPLOYMENT_NAME) {
    throw new Error("Azure OpenAI Chat environment variables are not set");
  }

  const API_URL = `${AZURE_CHAT_ENDPOINT}openai/deployments/${AZURE_CHAT_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;

  console.log(`Calling Azure OpenAI API (Deployment: ${AZURE_CHAT_DEPLOYMENT_NAME})...`);

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

  if (!response.ok) {
    throw new Error(`Azure OpenAI API request failed with status ${response.status}`);
  }

  const result = await response.json();
  
  if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
    return result.choices[0].message.content;
  } else {
    throw new Error("Failed to parse Azure API response.");
  }
}


// ------------------------------------------------------------------
// 4. 💥 '자율형' AI 대화 함수 (프롬프트 수정!)
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

  // 1. 💥 (수정!) Gombo AI처럼 작동하도록 프롬프트를 완전히 교체합니다.
  const systemPrompt = `
You are an autonomous game development AI. The user will give you a single prompt (e.g., "a game like Mario Kart" or "Sudoku").
Your goal is to *autonomously* fill out the *entire* GameSpec JSON based on that prompt *in one step*.
You MUST reply in a specific JSON format. DO NOT write any text outside of the JSON object.
**You MUST respond in the same language as the user's last prompt (e.g., if Korean, respond in Korean).**

**User's Prompt:**
${lastUserMessage}

**Your Task:**
1.  Analyze the user's prompt.
2.  Select the best template: "runner" (Gogunbontu, Flappy Bird), "racing" (Mario Kart), "sudoku", "tetris", or "bomberman" (Crazy Arcade).
3.  **If "runner", "racing", or "bomberman":**
    -   *Invent* creative names for 'playerSprite', 'obstacleSprite' (or 'bomb' for bomberman), and 'theme'.
    -   *Invent* DALL-E prompts for 'imagePrompts' (player, obstacle, background).
        -   **CRITICAL:** Player/Obstacle prompts MUST be for a **"single character"** or **"single item"**, NOT a spritesheet. (e.g., "pixel art of a cute knight", "pixel art of a water bomb", "pixel art of a red racing kart, top down view").
        -   Background prompts should be for a single landscape image.
    -   *Invent* 'frameWidth' and 'frameHeight' (e.g., 64x64). **(NOTE: DALL-E will ignore this, but set it anyway for the 'image' loader).**
    -   Set 'control' to 'keyboard'.
    -   Return the *complete* JSON with 'triggerAllImages: true'.
4.  **If "sudoku" or "tetris":**
    -   Set 'template' to the correct one ("sudoku" or "tetris") and 'theme' to 'logic' or 'classic'.
    -   Set all sprite/image fields to 'null'.
    -   Set 'triggerCodeGeneration: true' (no images needed).
5.  Return the *complete* JSON object.

**JSON Response Format (Runner/Racing/Bomberman):**
{
  "reply": "알겠습니다! 2D 픽셀아트 스타일의 '크레이지 아케이드' 게임을 만들겠습니다...",
  "updatedSpec": {
    "template": "bomberman",
    "playerSprite": { "name": "Bazzi", "url": null, "scale": 1.0, "frameWidth": 64, "frameHeight": 64 },
    "obstacleSprite": { "name": "Water Bomb", "url": null, "scale": 0.8, "frameWidth": 32, "frameHeight": 32 },
    "control": "keyboard",
    "theme": "Arcade",
    "backgroundImage": { "name": "Blocky Map", "url": null },
    "imagePrompts": { 
      "player": "pixel art of a cute character (like Bazzi), top down view, transparent background", 
      "obstacle": "pixel art of a single cartoon water bomb, transparent background", 
      "background": "pixel art of a 'bomberman' map with grass and blocks, top down view" 
    }
  },
  "triggerAllImages": true,
  "triggerCodeGeneration": false
}

**JSON Response Format (Sudoku/Tetris):**
{
  "reply": "알겠습니다! 바로 플레이할 수 있는 테트리스 게임을 생성하겠습니다.",
  "updatedSpec": {
    "template": "tetris", "playerSprite": null, "obstacleSprite": null, "control": "keyboard", "theme": "classic", "backgroundImage": null, "imagePrompts": null
  },
  "triggerAllImages": false,
  "triggerCodeGeneration": true
}

**Start your JSON response now:**
[INST] ${lastUserMessage} [/INST]
`;

  try {
    // 2. Azure (텍스트 AI) 호출
    const azureResponseRaw = await callTextGenerationAPI(systemPrompt);
    
    // 3. '안전하게' JSON 파싱 (이전과 동일)
    let aiDecision;
    try {
      const jsonMatch = azureResponseRaw.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error("AI response was not in the expected JSON format.");
      const jsonString = jsonMatch[0].replace(/\\n/g, "\\\\n").replace(/,\s*([}\]])/g, '$1'); 
      aiDecision = JSON.parse(jsonString);
    } catch (parseError: any) {
      console.error("Failed to parse AI JSON response:", parseError.message);
      console.error("Original (raw) AI response:", azureResponseRaw);
      throw new Error("Failed to parse AI response. " + parseError.message);
    }
    
    aiResponseContent = aiDecision.reply || "AI가 기획서를 생성했습니다.";
    newSpec = aiDecision.updatedSpec || newSpec;

    // 4. (수정!) AI가 "모든 이미지 생성"을 결정한 경우
    if (aiDecision.triggerAllImages && newSpec.imagePrompts) {
      aiResponseContent = aiDecision.reply + " (모든 이미지 생성 중... 30~60초 소요)"; 
      
      try {
        // DALL-E 3개 호출을 *동시에* 시작합니다.
        const imagePromises = [
          generateImageWithAI(newSpec.imagePrompts.player!),
          generateImageWithAI(newSpec.imagePrompts.obstacle!),
          generateImageWithAI(newSpec.imagePrompts.background!)
        ];
        
        const [playerUrl, obstacleUrl, backgroundUrl] = await Promise.all(imagePromises);
        console.log('All images generated (Player, Obstacle, Background)!');

        // 💥 (수정!) newSpec에 DALL-E가 생성한 URL을 확실히 할당합니다.
        if (newSpec.playerSprite) newSpec.playerSprite.url = playerUrl;
        if (newSpec.obstacleSprite) newSpec.obstacleSprite.url = obstacleUrl;
        if (newSpec.backgroundImage) newSpec.backgroundImage.url = backgroundUrl;
        
        aiResponseContent = "모든 이미지 생성 완료! 게임 코드를 생성합니다...";
        
        // 5. 코드를 *즉시* 생성합니다.
        console.log("All specs complete. Generating game code...");
        generatedCode = generateMockCode(newSpec as GameSpec);
        
      } catch (error: any) {
          console.error('Failed to generate images with AI:', error);
          aiResponseContent = `이미지 생성에 실패했습니다. (오류: ${error.message}). 임시 이미지를 사용합니다.`;
          // 💥 (수정!) 이미지 생성 실패 시에도 newSpec에 localImg를 확실히 할당합니다.
          if (newSpec.playerSprite) newSpec.playerSprite.url = localPlayerImg;
          if (newSpec.obstacleSprite) newSpec.obstacleSprite.url = localObstacleImg;
          generatedCode = generateMockCode(newSpec as GameSpec); 
      }
    }
    
    // 6. (수정!) AI가 "코드 생성" (스도쿠/테트리스)을 결정한 경우
    else if (aiDecision.triggerCodeGeneration) {
      aiResponseContent = aiDecision.reply;
      newSpec = aiDecision.updatedSpec;
      console.log("Logic puzzle specs complete. Generating game code...");
      generatedCode = generateMockCode(newSpec as GameSpec);
    }

  } catch (error: any) {
      console.error('Failed to get AI response (Chat):', error);
      if (error.message.includes("JSON")) {
          aiResponseContent = "오류: AI가 JSON 형식이 아닌 답변을 보냈습니다. 다시 시도해 주세요.";
      } else if (error.message.includes("environment variables")) {
         aiResponseContent = "오류: Azure API 키가 설정되지 않았습니다. .env.local 파일을 확인하고 서버를 재시작하세요.";
      } else if (error.message.includes("404")) { 
         aiResponseContent = "오류: Azure 채팅 배포 이름을 찾을 수 없습니다(404). .env.local 파일의 CHAT_DEPLOYMENT_NAME을 확인하세요.";
      } else if (error.message.includes("401")) {
         aiResponseContent = "오류: Azure API 키가 유효하지 않습니다(401). .env.local 파일의 API_KEY를 확인하세요.";
      } else {
        aiResponseContent = "오류: Azure AI 어시스턴트에게 답변을 받아오지 못했습니다.";
      }
  }

  // 7. 최종 결과 반환
  return {
    aiMessage: { id: Date.now().toString(), role: 'ai', content: aiResponseContent },
    updatedSpec: newSpec,
    generatedCode: generatedCode
  }
}