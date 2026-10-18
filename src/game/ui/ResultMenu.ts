import Phaser from 'phaser';
import type { GameConfig } from '../config';

export class ResultMenu extends Phaser.GameObjects.Container {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly restartText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gameConfig: GameConfig, onRestart: () => void) {
    super(scene, 0, 0);

    const { width, height } = scene.scale;
    const { fontFamily, overlay, resultScreen } = gameConfig;

    this.add(
      scene.add.rectangle(width / 2, height / 2, width, height, overlay.color, overlay.alpha),
    );

    this.titleText = scene.add
      .text(width / 2, height / 2 + resultScreen.titleOffsetY, '', {
        fontFamily,
        fontSize: resultScreen.titleFontSize,
        color: resultScreen.winColor,
      })
      .setOrigin(0.5);

    this.messageText = scene.add
      .text(width / 2, height / 2 + resultScreen.messageOffsetY, '', {
        fontFamily,
        fontSize: resultScreen.messageFontSize,
        color: resultScreen.messageColor,
      })
      .setOrigin(0.5);

    this.restartText = scene.add
      .text(width / 2, height / 2 + resultScreen.restartOffsetY, 'Начать заново', {
        fontFamily,
        fontSize: resultScreen.restartFontSize,
        color: resultScreen.restartColor,
        backgroundColor: resultScreen.restartBackground,
        padding: resultScreen.restartPadding,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onRestart);

    this.add([this.titleText, this.messageText, this.restartText]);

    this.setDepth(10);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(title: string, message: string, color: string): void {
    this.titleText.setText(title).setColor(color);
    this.messageText.setText(message);
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }
}