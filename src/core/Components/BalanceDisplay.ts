import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { EventBus } from '../Controllers/EventController';

export class BalanceDisplay extends Container {
  private balanceText!: Text;
  private background!: Graphics;

  constructor() {
    super();
    this.createBalanceUI();
    this.setupEventListeners();
  }

  private createBalanceUI(): void {
    const isMobile = window.innerWidth < 968;
    const width = isMobile ? 150 : 210;
    const height = isMobile ? 45 : 60;
    const fontSize = isMobile ? 16 : 22;

    this.background = new Graphics();
    this.background.fill(0x000000, 0.6);
    this.background.roundRect(0, 0, width, height, 10);
    this.background.endFill();
    this.addChild(this.background);

    this.balanceText = new Text(
        'Balance: $90',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: fontSize,
          fontWeight: 'bold',
          fill: '#FFD700',
          stroke: { color: '#000000', width: 3, join: 'round' }
        })
    );
    this.balanceText.anchor.set(0.5);
    this.balanceText.position.set(width / 2, height / 2);
    this.addChild(this.balanceText);

    const padding = isMobile ? 10 : 20;
    this.position.set(window.innerWidth - width - padding, padding);
  }

  private setupEventListeners(): void {
    EventBus.on('BALANCE:UPDATED', (balance: unknown) => {
      this.updateBalance(balance as number);
    });
  }

  private updateBalance(newBalance: number): void {
    this.balanceText.text = `Balance: $${newBalance}`;

    gsap.fromTo(
        this.balanceText.scale,
        { x: 1.2, y: 1.2 },
        { x: 1, y: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );
  }

  public resize(width: number): void {
    const isMobile = width < 968;
    const balanceWidth = isMobile ? 150 : 210;
    const padding = isMobile ? 10 : 20;
    this.position.set(width - balanceWidth - padding, padding);
  }
}
