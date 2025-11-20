export class Snake {
  constructor(size, startPos) {
    this.size = size;
    this.body = [];
    for (let i = 0; i < size; i++) {
      this.body.push({
        x: startPos.x - i,
        y: startPos.y,
      });
    }
    this.direction = "RIGHT";
    this.isDead = false;
  }

  // 180도 턴 방지하며 방향 잡기
  setDirection(dir) {
    const opposite = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    if (opposite[dir] === this.direction) return;
    this.direction = dir;
  }

  move() {
    if (this.isDead) return;
    const head = { ...this.body[0] };

    switch (this.direction) {
      case "UP":
        head.y -= 1;
        break;
      case "DOWN":
        head.y += 1;
        break;
      case "LEFT":
        head.x -= 1;
        break;
      case "RIGHT":
        head.x += 1;
        break;
    }

    // 새 머리 추가
    this.body.unshift(head);
    // 꼬리 삭제
    this.body.pop();
  }
}
