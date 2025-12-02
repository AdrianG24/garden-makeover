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
    this.background = new Graphics();
    this.background.fill(0x000000, 0.6);
    this.background.roundRect(0, 0, 180, 60, 10);
    this.background.endFill();
    this.addChild(this.background);

    this.balanceText = new Text(
      '$0',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 3, join: 'round' }
      })
    );
    this.balanceText.anchor.set(0.5);
    this.balanceText.position.set(90, 30);
    this.addChild(this.balanceText);

    this.position.set(window.innerWidth - 200, 20);
  }

  private setupEventListeners(): void {
    EventBus.attachListener('BALANCE:UPDATED', (balance: unknown) => {
      this.updateBalance(balance as number);
    });
  }

  private updateBalance(newBalance: number): void {
    this.balanceText.text = `$${newBalance}`;

    gsap.fromTo(
      this.balanceText.scale,
      { x: 1.2, y: 1.2 },
      { x: 1, y: 1, duration: 0.3, ease: 'back.out(1.7)' }
    );
  }

  public resize(width: number): void {
    this.position.set(width - 200, 20);
  }
}
