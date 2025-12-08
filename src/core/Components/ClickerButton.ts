import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';
import { eventEmitter } from '../Services/EventBusService';

export class ClickerButton extends Container {
  private button: Graphics;
  private buttonText: Text;
  private coinText: Text;
  private isMobile = window.innerWidth < 968;
  private currentLevel = 1;
  private clickValue = 5;

  constructor(
      private itemService: ItemService,
      private audioService: AudioService
  ) {
    super();

    this.button = new Graphics();
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';

    this.addChild(this.button);

    this.buttonText = new Text('💰', new TextStyle({
      fontFamily: 'Arial',
      fontSize: 1,
    }));
    this.buttonText.anchor.set(0.5);
    this.addChild(this.buttonText);

    this.coinText = new Text('+5$', new TextStyle({
      fontFamily: 'Arial',
      fontSize: 1,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: 2, join: 'round' }
    }));
    this.coinText.anchor.set(0.5);
    this.addChild(this.coinText);

    this.button.on('pointerdown', () => this.onClick());
    this.button.on('pointerover', () => this.onHover());
    this.button.on('pointerout', () => this.onHoverOut());

    this.setupEvents();
    this.updateClickValue();
    this.updateVisuals();
    this.updatePosition(window.innerWidth, window.innerHeight);
  }

  private setupEvents(): void {
    eventEmitter.on('GRID_ITEMS:CHANGE_LEVEL', (level: unknown) => {
      this.currentLevel = level as number;
      this.updateClickValue();
    });
  }

  private updateClickValue(): void {
    this.clickValue = 5 * Math.pow(2, this.currentLevel - 1);
    this.coinText.text = `+${this.clickValue}$`;
  }

  private updateVisuals(): void {
    this.isMobile = window.innerWidth < 968;

    const size = this.isMobile ? 80 : 120;
    const textSize = this.isMobile ? 40 : 60;
    const coinSize = this.isMobile ? 16 : 24;

    this.button.clear();
    this.button.fill(0xFFD700, 1);
    this.button.circle(0, 0, size / 2);
    this.button.stroke({ width: this.isMobile ? 4 : 6, color: 0xFF8C00 });
    this.button.circle(0, 0, size / 2);
    this.button.endFill();

    this.buttonText.style.fontSize = textSize;

    this.coinText.style.fontSize = coinSize;
    this.coinText.style.stroke = {
      color: '#000000',
      width: this.isMobile ? 2 : 3
    };

    this.coinText.position.set(0, this.isMobile ? 45 : 70);
  }

  private onClick(): void {
    this.itemService.addMoney(this.clickValue);
    this.audioService.playSound('sound_click', false);

    gsap.killTweensOf(this.scale);
    gsap.to(this.scale, {
      x: 0.9,
      y: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });

    const float = new Text(`+${this.clickValue}$`, {
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 20 : 28,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000', width: 3 }
    });
    float.anchor.set(0.5);
    float.position.set(0, -50);
    float.alpha = 0;

    this.addChild(float);

    gsap.to(float, {
      y: -100,
      alpha: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    gsap.to(float, {
      alpha: 0,
      duration: 0.3,
      delay: 0.5,
      onComplete: () => float.destroy()
    });
  }

  private onHover(): void {
    gsap.to(this.scale, { x: 1.1, y: 1.1, duration: 0.2 });
  }

  private onHoverOut(): void {
    gsap.to(this.scale, { x: 1, y: 1, duration: 0.2 });
  }

  private updatePosition(width: number, height: number): void {
    this.isMobile = width < 968;
    const padding = this.isMobile ? 20 : 40;
    this.position.set(width - padding - 60, height - padding - 60);
  }

  public resize(width: number, height: number): void {
    this.updateVisuals();
    this.updatePosition(width, height);
  }
}
