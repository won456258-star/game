// 1. window.Phaser가 있다고 알려줍니다. (이전과 동일)
declare interface Window {
  Phaser: any;
}

// 2. Phaser라는 이름의 타입/변수가 있다고 알려줍니다. (새로 추가!)
declare var Phaser: any;