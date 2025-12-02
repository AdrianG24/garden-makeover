import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { playSoundEffect } from '../Utils/AudioManager';
import gsap from 'gsap';
import { POPUP_CONFIG } from '../../config';


export class NotificationDialog extends Container {
  constructor(messageContent: string) {
    super();
    this.buildPopupInterface(messageContent);
    playSoundEffect('sound_win');
  }

  public closeDialog(): void {
    gsap.to(this, {
      alpha: 0,
      duration: 0.5,
      onComplete: () => this.destroy(),
    });
  }

  private buildPopupInterface(messageContent: string): void {
    const backgroundGraphics = this.createBackgroundGraphics();
    this.addChild(backgroundGraphics);

    const messageTextElement = this.createMessageTextElement(messageContent);
    messageTextElement.x = (POPUP_CONFIG.width - messageTextElement.width) / 2;
    messageTextElement.y = (POPUP_CONFIG.height - messageTextElement.height) / 2;
    this.addChild(messageTextElement);

    this.x = (window.innerWidth - POPUP_CONFIG.width) / 2;
    this.y = (window.innerHeight - POPUP_CONFIG.height) / 2;

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => this.closeDialog());
  }

  private createBackgroundGraphics(): Graphics {
    const backgroundShape = new Graphics();
    backgroundShape.lineStyle(POPUP_CONFIG.borderThickness, POPUP_CONFIG.borderColor);
    backgroundShape.beginFill(POPUP_CONFIG.backgroundColor);
    backgroundShape.drawRoundedRect(
      0,
      0,
      POPUP_CONFIG.width,
      POPUP_CONFIG.height,
      10
    );
    backgroundShape.endFill();
    return backgroundShape;
  }

  private createMessageTextElement(messageContent: string): Text {
    const textStyling = new TextStyle(POPUP_CONFIG.textStyle);
    return new Text(messageContent, textStyling);
  }
}
