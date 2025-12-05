import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';

export class ClickerButton extends Container {
  private button: Graphics;
  private buttonText: Text;
  private coinText: Text;
  private isMobile = window.innerWidth < 968;

  constructor(
    private itemService: ItemService,
    private audioService: AudioService
  ) {
    super();
    this.button = new Graphics();
    this.buttonText = new Text('', new TextStyle({}));
    this.coinText = new Text('', new TextStyle({}));
    this.createButton();
    this.updatePosition(window.innerWidth, window.innerHeight);
  }

  private createButton(): void {
    this.isMobile = window.innerWidth < 968;
    const buttonSize = this.isMobile ? 80 : 120;

    this.button.clear();
    this.button.fill(0xFFD700, 1);
    this.button.circle(0, 0, buttonSize / 2);
    this.button.endFill();
    this.button.stroke({ width: this.isMobile ? 4 : 6, color: 0xFF8C00 });
    this.button.circle(0, 0, buttonSize / 2);
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';

    this.button.on('pointerdown', () => this.onClick());
    this.button.on('pointerover', () => this.onHover());
    this.button.on('pointerout', () => this.onHoverOut());

    this.addChild(this.button);

    this.buttonText = new Text('💰', new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 40 : 60,
    }));
    this.buttonText.anchor.set(0.5);
    this.addChild(this.buttonText);

    this.coinText = new Text('+5$', new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 16 : 24,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: this.isMobile ? 2 : 3, join: 'round' }
    }));
    this.coinText.anchor.set(0.5);
    this.coinText.position.set(0, this.isMobile ? 45 : 70);
    this.addChild(this.coinText);
  }

  private onClick(): void {
    this.itemService.addMoney(5);
    this.audioService.playSound('sound_click', false);

    gsap.killTweensOf(this.scale);
    gsap.to(this.scale, {
      x: 0.9,
      y: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    });

    const floatingText = new Text('+5$', new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.isMobile ? 20 : 28,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: this.isMobile ? 2 : 3, join: 'round' }
    }));
    floatingText.anchor.set(0.5);
    floatingText.position.set(0, -50);
    floatingText.alpha = 0;
    this.addChild(floatingText);

    gsap.to(floatingText, {
      y: -100,
      alpha: 1,
      duration: 0.5,
      ease: 'power2.out'
    });
    gsap.to(floatingText, {
      alpha: 0,
      duration: 0.3,
      delay: 0.5,
      onComplete: () => {
        this.removeChild(floatingText);
      }
    });
  }

  private onHover(): void {
    gsap.to(this.scale, {
      x: 1.1,
      y: 1.1,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  private onHoverOut(): void {
    gsap.to(this.scale, {
      x: 1,
      y: 1,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  private updatePosition(width: number, height: number): void {
    this.isMobile = width < 968;
    const padding = this.isMobile ? 20 : 40;
    this.position.set(width - padding - 60, height - padding - 60);
  }

  public resize(width: number, height: number): void {
    this.createButton();
    this.updatePosition(width, height);
  }
}
