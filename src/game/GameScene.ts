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
  private phase = 1;
  private phase2Timer = 0;
  private phaseBarBg!: Phaser.GameObjects.Rectangle;
  private phaseBarFill!: Phaser.GameObjects.Rectangle;
  private phaseTimerText!: Phaser.GameObjects.Text;
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

    this.phase = 1;
    this.phase2Timer = this.gameConfig.phase2Time * 1000;

    const barY = height - 24;
    const barHeight = 8;
    const barWidth = width - 40;

    this.phaseBarBg = this.add
      .rectangle(width / 2, barY, barWidth, barHeight, 0x1e293b)
      .setOrigin(0.5)
      .setDepth(2);

    this.phaseBarFill = this.add
      .rectangle(20, barY, barWidth, barHeight, 0x3b82f6)
      .setOrigin(0, 0.5)
      .setDepth(3);

    this.phaseTimerText = this.add
      .text(width / 2, barY - 18, '', {
        fontFamily,
        fontSize: '16px',
        color: '#93c5fd',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.updatePhaseBar();

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    this.generateLevel(this.level);
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') return;

    if (this.phase === 1) {
      this.phase2Timer -= delta;
      if (this.phase2Timer <= 0) {
        this.phase2Timer = 0;
        this.startPhase2();
      }
      this.updatePhaseBar();
    }

    const speed =
      (this.gameConfig.baseSpeed + (this.level - 1) * this.gameConfig.speedPerLevel) *
      (this.phase === 2 ? this.gameConfig.phase2SpeedMultiplier : 1);
    const { playfield, candidateRadius } = this.gameConfig;
    const radius = candidateRadius * (this.phase === 2 ? this.gameConfig.phase2RadiusMultiplier : 1);

    for (const candidate of this.candidates) {
      candidate.update(delta, speed, playfield, radius);
    }
  }

  private generateLevel(level: number): void {
    this.state = 'playing';

    for (const candidate of this.candidates) {
      candidate.destroy();
    }
    this.candidates = [];

    const { totalLevels, candidateCount, candidateRadius, playfield, maxDelta, minDelta } = this.gameConfig;
    const radius = candidateRadius * (this.phase === 2 ? this.gameConfig.phase2RadiusMultiplier : 1);
    const count = candidateCount + (this.phase === 2 ? this.gameConfig.phase2ExtraCandidates : 0);

    this.levelText.setText(`Уровень ${level} / ${totalLevels}`);

    const base = randomHsl();
    this.target.setFillStyle(hslToColor(base));

    const progress = (level - 1) / (totalLevels - 1);
    const delta = maxDelta - (maxDelta - minDelta) * progress;

    for (let i = 0; i < count; i += 1) {
      const correct = i === 0;
      const color = correct ? base : shiftHsl(base, delta);

      const candidate = new Candidate(
        this,
        Phaser.Math.Between(playfield.left + radius, playfield.right - radius),
        Phaser.Math.Between(playfield.top + radius, playfield.bottom - radius),
        radius,
        hslToColor(color),
        correct,
        (item) => this.handleCandidate(item),
      );

      this.candidates.push(candidate);
    }
  }

  private updatePhaseBar(): void {
    const total = this.gameConfig.phase2Time * 1000;
    const ratio = Math.max(0, this.phase2Timer / total);

    this.phaseBarFill.setDisplaySize(this.phaseBarBg.width * ratio, this.phaseBarBg.height);
    this.phaseTimerText.setText(`До фазы 2: ${Math.ceil(this.phase2Timer / 1000)}с`);
  }

  private startPhase2(): void {
    this.phase = 2;
    this.phaseBarFill.setFillStyle(0xf59e0b);
    this.phaseBarFill.setDisplaySize(this.phaseBarBg.width, this.phaseBarBg.height);
    this.phaseTimerText.setText('Фаза 2 активна');

    this.generateLevel(this.level);

    const banner = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'ФАЗА 2 НАЧАЛАСЬ!', {
        fontFamily: this.gameConfig.fontFamily,
        fontSize: '48px',
        color: '#f59e0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: this.scale.height / 2 - 40,
      duration: 2000,
      ease: 'Sine.easeOut',
      onComplete: () => banner.destroy(),
    });
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
