import Phaser from 'phaser';
import { GameScene } from './GameScene';

export interface GameConfig {
  // Геймплей
  totalLevels: number;
  candidateCount: number;
  candidateRadius: number;
  baseSpeed: number;
  speedPerLevel: number;
  maxDelta: number;
  minDelta: number;
  playfield: { left: number; right: number; top: number; bottom: number };

  // Фазы
  phase2Level: number;
  phase2SpeedMultiplier: number;
  phase2RadiusMultiplier: number;
  phase2ExtraCandidates: number;

  // Интерфейс
  fontFamily: string;
  title: { text: string; y: number; fontSize: string; color: string };
  target: { y: number; radius: number; color: number };
  hint: { text: string; y: number; fontSize: string; color: string };
  levelText: { x: number; y: number; fontSize: string; color: string };
  overlay: { color: number; alpha: number };
  pauseScreen: {
    title: string;
    titleFontSize: string;
    titleColor: string;
    hint: string;
    hintFontSize: string;
    hintColor: string;
    panel: {
      width: number;
      height: number;
      color: number;
      alpha: number;
      radius: number;
      strokeColor: number;
      strokeWidth: number;
    };
  };
  resultScreen: {
    titleOffsetY: number;
    titleFontSize: string;
    messageOffsetY: number;
    messageFontSize: string;
    messageColor: string;
    restartOffsetY: number;
    restartFontSize: string;
    restartColor: string;
    restartBackground: string;
    restartPadding: { x: number; y: number };
    winColor: string;
    loseColor: string;
  };
}

export function createGame(parent: string): Phaser.Game {
  const gameConfig: GameConfig = {
    // Геймплей
    totalLevels: 10,
    candidateCount: 4,
    candidateRadius: 28,
    baseSpeed: 85,
    speedPerLevel: 15,
    maxDelta: 0.2,
    minDelta: 0.05,
    playfield: { left: 45, right: 915, top: 215, bottom: 545 },

    // Фазы
    phase2Level: 5,
    phase2SpeedMultiplier: 1.2,
    phase2RadiusMultiplier: 0.8,
    phase2ExtraCandidates: 2,

    // Интерфейс
    fontFamily: 'system-ui, sans-serif',
    title: {
      text: 'НАЙДИ ОТТЕНОК',
      y: 34,
      fontSize: '30px',
      color: '#ffffff',
    },
    target: {
      y: 122,
      radius: 46,
      color: 0xffffff,
    },
    hint: {
      text: 'Кликни по кругу, который совпадает с эталоном',
      y: 182,
      fontSize: '18px',
      color: '#cbd5e1',
    },
    levelText: {
      x: 24,
      y: 20,
      fontSize: '22px',
      color: '#ffffff',
    },
    overlay: {
      color: 0x0f172a,
      alpha: 0.85,
    },
    pauseScreen: {
      title: 'ПАУЗА',
      titleFontSize: '64px',
      titleColor: '#ffffff',
      hint: 'Нажмите ESC, чтобы продолжить',
      hintFontSize: '24px',
      hintColor: '#cbd5e1',
      panel: {
        width: 440,
        height: 240,
        color: 0x1e293b,
        alpha: 0.95,
        radius: 20,
        strokeColor: 0x334155,
        strokeWidth: 2,
      },
    },
    resultScreen: {
      titleOffsetY: -60,
      titleFontSize: '52px',
      messageOffsetY: 0,
      messageFontSize: '24px',
      messageColor: '#e2e8f0',
      restartOffsetY: 70,
      restartFontSize: '26px',
      restartColor: '#ffffff',
      restartBackground: '#2563eb',
      restartPadding: { x: 18, y: 10 },
      winColor: '#4ade80',
      loseColor: '#f87171',
    },
  };

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 640,
    backgroundColor: '#0f172a',
    scene: [new GameScene(gameConfig)],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  return new Phaser.Game(config);
}
