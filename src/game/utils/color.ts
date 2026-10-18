import Phaser from 'phaser';

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function randomHsl(): Hsl {
  return {
    h: Phaser.Math.FloatBetween(0, 1),
    s: Phaser.Math.FloatBetween(0.35, 0.95),
    l: Phaser.Math.FloatBetween(0.35, 0.75),
  };
}

export function hslToColor(hsl: Hsl): number {
  return Phaser.Display.Color.HSLToColor(hsl.h, hsl.s, hsl.l).color;
}

export function shiftHsl(base: Hsl, delta: number): Hsl {
  const result = { ...base };
  const axes: Array<keyof Hsl> = ['s', 'l'];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const axis = axes[Phaser.Math.Between(0, axes.length - 1)];
    const sign = Phaser.Math.FloatBetween(0, 1) < 0.5 ? -1 : 1;
    const shifted = Phaser.Math.Clamp(base[axis] + sign * delta, 0, 1);

    if (Math.abs(shifted - base[axis]) >= delta * 0.4) {
      result[axis] = shifted;
      return result;
    }
  }

  result.l = Phaser.Math.Clamp(base.l + (base.l < 0.5 ? delta : -delta), 0, 1);
  return result;
}