import Phaser from 'phaser';

export interface Playfield {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class Candidate {
  readonly shape: Phaser.GameObjects.Arc;
  readonly correct: boolean;

  private vx: number;
  private vy: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    correct: boolean,
    onClick: (candidate: Candidate) => void,
  ) {
    this.correct = correct;

    this.shape = scene.add.circle(x, y, radius, color);
    this.shape.setInteractive({ useHandCursor: true });
    this.shape.on('pointerdown', () => onClick(this));

    let vx = Phaser.Math.FloatBetween(-1, 1);
    let vy = Phaser.Math.FloatBetween(-1, 1);
    const length = Math.hypot(vx, vy) || 1;
    this.vx = vx / length;
    this.vy = vy / length;
  }

  update(deltaMs: number, speed: number, playfield: Playfield, radius: number): void {
    const seconds = deltaMs / 1000;

    this.shape.x += this.vx * speed * seconds;
    this.shape.y += this.vy * speed * seconds;

    if (this.shape.x < playfield.left + radius) {
      this.shape.x = playfield.left + radius;
      this.vx = Math.abs(this.vx);
    } else if (this.shape.x > playfield.right - radius) {
      this.shape.x = playfield.right - radius;
      this.vx = -Math.abs(this.vx);
    }

    if (this.shape.y < playfield.top + radius) {
      this.shape.y = playfield.top + radius;
      this.vy = Math.abs(this.vy);
    } else if (this.shape.y > playfield.bottom - radius) {
      this.shape.y = playfield.bottom - radius;
      this.vy = -Math.abs(this.vy);
    }
  }

  destroy(): void {
    this.shape.destroy();
  }
}