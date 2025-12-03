import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { IEventBus } from '../Interfaces/IEventBus';

export class DayNightToggle extends Container {
  private background!: Graphics;
  private iconText!: Text;
  private currentMode: 'day' | 'night' = 'day';
  private buttonSize: number = 70;

  constructor(private eventBus: IEventBus) {
    super();
    this.createToggleButton();
    this.setupInteraction();
  }

  private createToggleButton(): void {
    const isMobile = window.innerWidth < 768;
    this.buttonSize = isMobile ? 40 : 55;
    const fontSize = isMobile ? 22 : 32;

    this.background = new Graphics();
    this.background.fill(0x000000, 0.6);
    this.background.roundRect(0, 0, this.buttonSize, this.buttonSize, 10);
    this.background.endFill();
    this.addChild(this.background);

    this.iconText = new Text(
        '☀️',
        new TextStyle({
          fontSize: fontSize,
        })
    );
    this.iconText.anchor.set(0.5);
    this.iconText.position.set(this.buttonSize / 2, this.buttonSize / 2);
    this.addChild(this.iconText);

    const padding = 10
    const topPosition = isMobile ? 90 : 140;
    this.position.set(padding, topPosition);
  }

  private setupInteraction(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', () => {
      this.toggleMode();
    });

    this.on('pointerover', () => {
      gsap.to(this.scale, {
        x: 1.06,
        y: 1.06,
        duration: 0.2,
        ease: 'back.out(1.7)',
      });
    });

    this.on('pointerout', () => {
      gsap.to(this.scale, {
        x: 1,
        y: 1,
        duration: 0.2,
        ease: 'power2.out',
      });
    });
  }

  private toggleMode(): void {
    this.currentMode = this.currentMode === 'day' ? 'night' : 'day';
    this.iconText.text = this.currentMode === 'day' ? '☀️' : '🌙';

    gsap.fromTo(
        this.iconText.scale,
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.7)' }
    );

    this.eventBus.emit('LIGHTING:TOGGLE');
  }

  public resize(width: number): void {
    const isMobile = width < 768;
    const padding = 10
    const topPosition = isMobile ? 90 : 140;
    this.position.set(padding, topPosition);
  }
}
