import Phaser from 'phaser';
import type { GameConfig } from './config';
import { randomHsl, hslToColor, shiftHsl } from './utils/color';
import { Candidate } from './objects/Candidate';
import { ResultMenu } from './ui/ResultMenu';

type GameState = 'playing' | 'paused' | 'won' | 'lost';

export class GameScene extends Phaser.Scene {
  private readonly gameConfig: GameConfig;
  private candidates: Candidate[] = [];
  private target!: Phaser.GameObjects.Arc;
  private levelText!: Phaser.GameObjects.Text;
  private resultMenu!: ResultMenu;
  private state: GameState = 'playing';
  private level = 1;
  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pausePanel!: Phaser.GameObjects.Rectangle;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pauseHint!: Phaser.GameObjects.Text;

  constructor(gameConfig: GameConfig) {
    super('GameScene');
    this.gameConfig = gameConfig;
  }

  create(): void {
    this.level = 1;
    this.state = 'playing';

    const { width, height } = this.scale;
    const { fontFamily, title, target, hint, levelText, overlay, pauseScreen } = this.gameConfig;

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

    this.pauseOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, overlay.color, overlay.alpha)
      .setDepth(5)
      .setVisible(false);

    this.pausePanel = this.add
      .rectangle(
        width / 2,
        height / 2,
        pauseScreen.panel.width,
        pauseScreen.panel.height,
        pauseScreen.panel.color,
        pauseScreen.panel.alpha,
      )
      .setStrokeStyle(pauseScreen.panel.strokeWidth, pauseScreen.panel.strokeColor, 1)
      .setDepth(6)
      .setVisible(false);

    this.pauseTitle = this.add
      .text(width / 2, height / 2 - 34, pauseScreen.title, {
        fontFamily,
        fontSize: pauseScreen.titleFontSize,
        color: pauseScreen.titleColor,
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setVisible(false);

    this.pauseHint = this.add
      .text(width / 2, height / 2 + 46, pauseScreen.hint, {
        fontFamily,
        fontSize: pauseScreen.hintFontSize,
        color: pauseScreen.hintColor,
      })
      .setOrigin(0.5)
      .setDepth(7)
      .setVisible(false);

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

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

  private togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.pauseOverlay.setVisible(true);
      this.pausePanel.setVisible(true);
      this.pauseTitle.setVisible(true);
      this.pauseHint.setVisible(true);

      this.pausePanel.setAlpha(0);
      this.pauseTitle.setAlpha(0);
      this.pauseHint.setAlpha(0);
      this.tweens.add({
        targets: [this.pausePanel, this.pauseTitle, this.pauseHint],
        alpha: 1,
        duration: 200,
        ease: 'Sine.easeOut',
      });
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.pauseOverlay.setVisible(false);
      this.pausePanel.setVisible(false);
      this.pauseTitle.setVisible(false);
      this.pauseHint.setVisible(false);
    }
  }

  private finish(title: string, message: string, color: string): void {
    this.state = title === 'Победа!' ? 'won' : 'lost';
    this.resultMenu.show(title, message, color);
  }
}
