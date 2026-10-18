import Phaser from 'phaser';
import type { GameConfig } from './config';
import { randomHsl, hslToColor, shiftHsl } from './utils/color';
import { Candidate } from './objects/Candidate';
import { ResultMenu } from './ui/ResultMenu';

type GameState = 'playing' | 'won' | 'lost';

export class GameScene extends Phaser.Scene {
  private readonly gameConfig: GameConfig;
  private candidates: Candidate[] = [];
  private target!: Phaser.GameObjects.Arc;
  private levelText!: Phaser.GameObjects.Text;
  private resultMenu!: ResultMenu;
  private state: GameState = 'playing';
  private level = 1;

  constructor(gameConfig: GameConfig) {
    super('GameScene');
    this.gameConfig = gameConfig;
  }

  create(): void {
    this.level = 1;
    this.state = 'playing';

    const { width } = this.scale;
    const { fontFamily, title, target, hint, levelText } = this.gameConfig;

    this.add
      .text(width / 2, title.y, title.text, {
        fontFamily,
        fontSize: title.fontSize,
        color: title.color,
      })
      .setOrigin(0.5);

    this.target = this.add.circle(width / 2, target.y, target.radius, target.color);

    this.add
      .text(width / 2, hint.y, hint.text, {
        fontFamily,
        fontSize: hint.fontSize,
        color: hint.color,
      })
      .setOrigin(0.5);

    this.levelText = this.add.text(levelText.x, levelText.y, '', {
      fontFamily,
      fontSize: levelText.fontSize,
      color: levelText.color,
    });

    this.resultMenu = new ResultMenu(this, this.gameConfig, () => this.scene.restart());

    this.generateLevel(this.level);
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') return;

    const speed = this.gameConfig.baseSpeed + (this.level - 1) * this.gameConfig.speedPerLevel;
    const { playfield, candidateRadius } = this.gameConfig;

    for (const candidate of this.candidates) {
      candidate.update(delta, speed, playfield, candidateRadius);
    }
  }

  private generateLevel(level: number): void {
    this.state = 'playing';

    for (const candidate of this.candidates) {
      candidate.destroy();
    }
    this.candidates = [];

    const { totalLevels, candidateCount, candidateRadius, playfield, maxDelta, minDelta } = this.gameConfig;

    this.levelText.setText(`Уровень ${level} / ${totalLevels}`);

    const base = randomHsl();
    this.target.setFillStyle(hslToColor(base));

    const progress = (level - 1) / (totalLevels - 1);
    const delta = maxDelta - (maxDelta - minDelta) * progress;

    for (let i = 0; i < candidateCount; i += 1) {
      const correct = i === 0;
      const color = correct ? base : shiftHsl(base, delta);

      const candidate = new Candidate(
        this,
        Phaser.Math.Between(playfield.left + candidateRadius, playfield.right - candidateRadius),
        Phaser.Math.Between(playfield.top + candidateRadius, playfield.bottom - candidateRadius),
        candidateRadius,
        hslToColor(color),
        correct,
        (item) => this.handleCandidate(item),
      );

      this.candidates.push(candidate);
    }
  }

  private handleCandidate(candidate: Candidate): void {
    if (this.state !== 'playing') return;

    const { totalLevels, resultScreen } = this.gameConfig;

    if (candidate.correct) {
      if (this.level >= totalLevels) {
        this.finish('Победа!', `Все ${totalLevels} уровней пройдены!`, resultScreen.winColor);
      } else {
        this.level += 1;
        this.generateLevel(this.level);
      }
    } else {
      this.finish('Поражение', `Неверный оттенок на уровне ${this.level}.`, resultScreen.loseColor);
    }
  }

  private finish(title: string, message: string, color: string): void {
    this.state = title === 'Победа!' ? 'won' : 'lost';
    this.resultMenu.show(title, message, color);
  }
}
