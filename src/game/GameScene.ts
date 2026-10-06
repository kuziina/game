import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Игровые параметры
// ---------------------------------------------------------------------------

const TOTAL_LEVELS = 10;
const CANDIDATE_COUNT = 4;
const CANDIDATE_RADIUS = 28;

/** Скорость движения кандидатов на 1-м уровне (px/с). */
const BASE_SPEED = 85;
/** Прирост скорости за каждый следующий уровень. */
const SPEED_PER_LEVEL = 15;

/**
 * Максимальное цветовое отклонение «обманок» (уровень 1).
 * Значение в диапазоне 0..1 в HSL-пространстве.
 * Уже с первого уровня оттенки должны быть заметно, но не грубо похожи.
 */
const MAX_DELTA = 0.22;
/** Минимальное отклонение «обманок» (уровень 10). */
const MIN_DELTA = 0.05;

/** Область, в которой движутся кандидаты (не пересекает эталон и HUD). */
const PLAYFIELD = {
  left: 45,
  right: 915,
  top: 215,
  bottom: 545,
};

// ---------------------------------------------------------------------------
// Типы и утилиты цвета
// ---------------------------------------------------------------------------

interface Hsl {
  h: number;
  s: number;
  l: number;
}

interface Candidate {
  shape: Phaser.GameObjects.Arc;
  correct: boolean;
  vx: number;
  vy: number;
}

type GameState = 'playing' | 'won' | 'lost';

function randomHsl(): Hsl {
  return {
    h: Phaser.Math.FloatBetween(0, 1),
    s: Phaser.Math.FloatBetween(0.35, 0.95),
    l: Phaser.Math.FloatBetween(0.35, 0.75),
  };
}

function hslToColor(hsl: Hsl): number {
  return Phaser.Display.Color.HSLToColor(hsl.h, hsl.s, hsl.l).color;
}

/**
 * Возвращает цвет-«обманку»: базовый цвет со сдвигом по одной случайной
 * оси HSL на заданную дельту. Если сдвиг почти не отличается от исходного
 * (например, из-за границ 0..1), пробуем другую ось.
 */
function shiftHsl(base: Hsl, delta: number): Hsl {
  const result = { ...base };
  const axes: Array<keyof Hsl> = ['h', 's', 'l'];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const axis = axes[Phaser.Math.Between(0, axes.length - 1)];
    const sign = Phaser.Math.FloatBetween(0, 1) < 0.5 ? -1 : 1;
    const shifted = Phaser.Math.Clamp(base[axis] + sign * delta, 0, 1);

    if (Math.abs(shifted - base[axis]) >= delta * 0.4) {
      result[axis] = shifted;
      return result;
    }
  }

  // Запасной вариант: заметно сдвигаем светлоту в сторону от текущей.
  result.l = Phaser.Math.Clamp(base.l + (base.l < 0.5 ? delta : -delta), 0, 1);
  return result;
}

// ---------------------------------------------------------------------------
// Сцена
// ---------------------------------------------------------------------------

export class GameScene extends Phaser.Scene {
  private candidates: Candidate[] = [];
  private target!: Phaser.GameObjects.Arc;
  private levelText!: Phaser.GameObjects.Text;
  private state: GameState = 'playing';
  private level = 1;

  constructor() {
    super('GameScene');
  }

  create(): void {
    // Сброс состояния при рестарте: scene.restart() не создаёт новый объект сцены,
    // поэтому поля класса нужно восстанавливать вручную.
    this.level = 1;
    this.state = 'playing';

    const { width } = this.scale;

    this.add
      .text(width / 2, 34, 'НАЙДИ ОТТЕНОК', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.target = this.add.circle(width / 2, 122, 46, 0xffffff);

    this.add
      .text(width / 2, 182, 'Кликни по кругу, который совпадает с эталоном', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.levelText = this.add.text(24, 20, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    });

    this.generateLevel(this.level);
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'playing') return;

    const seconds = delta / 1000;
    const speed = BASE_SPEED + (this.level - 1) * SPEED_PER_LEVEL;

    for (const candidate of this.candidates) {
      candidate.shape.x += candidate.vx * speed * seconds;
      candidate.shape.y += candidate.vy * speed * seconds;

      if (candidate.shape.x < PLAYFIELD.left + CANDIDATE_RADIUS) {
        candidate.shape.x = PLAYFIELD.left + CANDIDATE_RADIUS;
        candidate.vx = Math.abs(candidate.vx);
      } else if (candidate.shape.x > PLAYFIELD.right - CANDIDATE_RADIUS) {
        candidate.shape.x = PLAYFIELD.right - CANDIDATE_RADIUS;
        candidate.vx = -Math.abs(candidate.vx);
      }

      if (candidate.shape.y < PLAYFIELD.top + CANDIDATE_RADIUS) {
        candidate.shape.y = PLAYFIELD.top + CANDIDATE_RADIUS;
        candidate.vy = Math.abs(candidate.vy);
      } else if (candidate.shape.y > PLAYFIELD.bottom - CANDIDATE_RADIUS) {
        candidate.shape.y = PLAYFIELD.bottom - CANDIDATE_RADIUS;
        candidate.vy = -Math.abs(candidate.vy);
      }
    }
  }

  private generateLevel(level: number): void {
    this.state = 'playing';

    for (const candidate of this.candidates) {
      candidate.shape.destroy();
    }
    this.candidates = [];

    this.levelText.setText(`Уровень ${level} / ${TOTAL_LEVELS}`);

    const base = randomHsl();
    this.target.setFillStyle(hslToColor(base));

    const progress = (level - 1) / (TOTAL_LEVELS - 1);
    const delta = MAX_DELTA - (MAX_DELTA - MIN_DELTA) * progress;

    for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
      const correct = i === 0;
      const color = correct ? base : shiftHsl(base, delta);

      const shape = this.add.circle(
        Phaser.Math.Between(PLAYFIELD.left + CANDIDATE_RADIUS, PLAYFIELD.right - CANDIDATE_RADIUS),
        Phaser.Math.Between(PLAYFIELD.top + CANDIDATE_RADIUS, PLAYFIELD.bottom - CANDIDATE_RADIUS),
        CANDIDATE_RADIUS,
        hslToColor(color),
      );
      shape.setInteractive({ useHandCursor: true });
      shape.on('pointerdown', () => this.handleCandidate(shape));

      let vx = Phaser.Math.FloatBetween(-1, 1);
      let vy = Phaser.Math.FloatBetween(-1, 1);
      const length = Math.hypot(vx, vy) || 1;
      vx /= length;
      vy /= length;

      this.candidates.push({ shape, correct, vx, vy });
    }
  }

  private handleCandidate(shape: Phaser.GameObjects.Arc): void {
    if (this.state !== 'playing') return;

    const candidate = this.candidates.find((item) => item.shape === shape);
    if (!candidate) return;

    if (candidate.correct) {
      if (this.level >= TOTAL_LEVELS) {
        this.finish('Победа!', `Все ${TOTAL_LEVELS} уровней пройдены!`, '#4ade80');
      } else {
        this.level += 1;
        this.generateLevel(this.level);
      }
    } else {
      this.finish('Поражение', `Неверный оттенок на уровне ${this.level}.`, '#f87171');
    }
  }

  private finish(title: string, message: string, color: string): void {
    this.state = title === 'Победа!' ? 'won' : 'lost';

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.85).setDepth(10);

    this.add
      .text(width / 2, height / 2 - 60, title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        color,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(width / 2, height / 2, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.add
      .text(width / 2, height / 2 + 70, 'Начать заново', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        color: '#ffffff',
        backgroundColor: '#2563eb',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.restart());
  }
}
