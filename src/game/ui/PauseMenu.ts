import Phaser from 'phaser';
import type { GameConfig } from '../config';

export class PauseMenu extends Phaser.GameObjects.Container {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gameConfig: GameConfig) {
    super(scene, 0, 0);

    const { width, height } = scene.scale;
    const { fontFamily, overlay, pauseScreen } = gameConfig;

    this.add(
      scene.add.rectangle(width / 2, height / 2, width, height, overlay.color, overlay.alpha),
    );

    this.panel = scene.add
      .rectangle(
        width / 2,
        height / 2,
        pauseScreen.panel.width,
        pauseScreen.panel.height,
        pauseScreen.panel.color,
        pauseScreen.panel.alpha,
      )
      .setStrokeStyle(pauseScreen.panel.strokeWidth, pauseScreen.panel.strokeColor, 1);

    this.titleText = scene.add
      .text(width / 2, height / 2 - 34, pauseScreen.title, {
        fontFamily,
        fontSize: pauseScreen.titleFontSize,
        color: pauseScreen.titleColor,
      })
      .setOrigin(0.5);

    this.hintText = scene.add
      .text(width / 2, height / 2 + 46, pauseScreen.hint, {
        fontFamily,
        fontSize: pauseScreen.hintFontSize,
        color: pauseScreen.hintColor,
      })
      .setOrigin(0.5);

    this.add([this.panel, this.titleText, this.hintText]);

    this.setDepth(5);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(): void {
    this.panel.setAlpha(0);
    this.titleText.setAlpha(0);
    this.hintText.setAlpha(0);
    this.setVisible(true);
    this.scene.tweens.add({
      targets: [this.panel, this.titleText, this.hintText],
      alpha: 1,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }

  hide(): void {
    this.setVisible(false);
  }
}
