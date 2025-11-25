import { Game, GameSpec } from './types'

// --- (가상) DB 데이터 ---
const mockUser = { id: 'u1', name: 'Creator123' }

const localPlayerImg = '/images/player.png'
const localObstacleImg = '/images/obstacle.png'
const localThumbnailImg = '/images/thumb.png'

// 💥 g1 게임을 위한 코드 생성기만 남겨둡니다.
function generateMockCode(spec: GameSpec): string {
  const bgColor = spec.theme === 'space' ? '#000020' : '#87CEEB';
  const player = spec.playerSprite?.name || '플레이어';
  const playerUrl = spec.playerSprite?.url || localPlayerImg; 
  const obstacle = spec.obstacleSprite?.name || '장애물';
  const obstacleUrl = spec.obstacleSprite?.url || localObstacleImg;
  
  let playerChar: any; 
  let obstacleChar: any;
  let cursors: any;

  return `
    const config = {
      type: Phaser.AUTO,
      parent: containerId, 
      width: 800,
      height: 600,
      backgroundColor: '${bgColor}',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
      },
      scene: {
        preload: function() {
          this.load.image('player_sprite', '${playerUrl}'); 
          this.load.image('obstacle_sprite', '${obstacleUrl}'); 
        },
        create: function() {
          this.add.text(400, 100, 
            '${player}(이)가 ${obstacle}(을)를 피하는 게임', 
            { fontSize: '24px', fill: '#fff' }
          ).setOrigin(0.5);
          playerChar = this.physics.add.sprite(200, 300, 'player_sprite');
          playerChar.setCollideWorldBounds(true); 
          obstacleChar = this.physics.add.sprite(700, 300, 'obstacle_sprite');
          obstacleChar.setImmovable(true); 
          this.add.text(400, 500, 
            '(조작: ${spec.control || '알 수 없음'})', 
            { fontSize: '18px', fill: '#ddd' }
          ).setOrigin(0.5);
          cursors = this.input.keyboard.createCursorKeys();
        },
        update: function() {
          obstacleChar.setVelocityX(-300);
          if (obstacleChar.x < -50) {
            obstacleChar.x = 850;
            obstacleChar.y = Math.floor(Math.random() * 500) + 50; 
          }
          if ('${spec.control}' === 'keyboard') {
            playerChar.setVelocity(0);
            if (cursors.up.isDown) playerChar.setVelocityY(-300);
            else if (cursors.down.isDown) playerChar.setVelocityY(300);
            if (cursors.left.isDown) playerChar.setVelocityX(-300);
            else if (cursors.right.isDown) playerChar.setVelocityX(300);
          }
        }
      }
    };
    return new Phaser.Game(config);
  `;
}

// (가상) DB 데이터
const mockGames: Game[] = [
  {
    id: 'g1',
    title: 'Space Cat Runner',
    creator: mockUser,
    thumbnailUrl: localThumbnailImg,
    plays: 1024,
    gameSpec: { 
      template: 'runner', 
      playerSprite: { name: 'cat', url: localPlayerImg }, 
      obstacleSprite: { name: 'mouse', url: localObstacleImg }, 
      control: 'keyboard', 
      theme: 'space' 
    },
    gameCode: generateMockCode({ 
      template: 'runner', 
      playerSprite: { name: 'cat', url: localPlayerImg }, 
      obstacleSprite: { name: 'mouse', url: localObstacleImg }, 
      control: 'keyboard', 
      theme: 'space' 
    })
  },
]
// --- (끝) 가상 DB ---

export const getFeaturedGames = async (): Promise<Game[]> => {
  await new Promise(res => setTimeout(res, 300))
  return mockGames
}

export const getGameById = async (id: string): Promise<Game | null> => {
  await new Promise(res => setTimeout(res, 300))
  const game = mockGames.find(g => g.id === id)
  return game || null
}

// 💥 AI 관련 함수(sendMessageToAI, generateImageWithAI)는
// 💥 src/lib/actions.ts 파일로 이동했습니다!