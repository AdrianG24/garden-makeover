import { Container, Graphics, Text } from 'pixi.js';
import { AudioService } from '../Services/AudioService';
import gsap from 'gsap';

export class WelcomeScreen extends Container {
  private onBuyCallback: () => void;

  private overlay!: Graphics;
  private panel!: Container;
  private panelBg!: Graphics;
  private title!: Text;
  private description!: Text;
  private buyButton!: Container;
  private buyButtonBg!: Graphics;
  private buyButtonText!: Text;

  constructor(
      onBuy: () => void,
      private audioService: AudioService
  ) {
    super();
    this.onBuyCallback = onBuy;

    this.create();
    this.layout();
  }

  private create(): void {
    this.overlay = new Graphics();
    this.addChild(this.overlay);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBg = new Graphics();
    this.panel.addChild(this.panelBg);

    this.title = new Text('', {});
    this.title.anchor.set(0.5);
    this.panel.addChild(this.title);

    this.description = new Text('', {});
    this.description.anchor.set(0.5);
    this.panel.addChild(this.description);

    this.buyButton = new Container();
    this.buyButton.eventMode = 'static';
    this.buyButton.cursor = 'pointer';

    this.buyButtonBg = new Graphics();
    this.buyButton.addChild(this.buyButtonBg);

    this.buyButtonText = new Text('', {});
    this.buyButtonText.anchor.set(0.5);
    this.buyButton.addChild(this.buyButtonText);

    this.panel.addChild(this.buyButton);

    this.buyButton.on('pointerdown', () => {
      this.audioService.playSound('sound_click');
      this.handleBuy();
    });
    this.buyButton.on('pointerover', () => gsap.to(this.buyButton.scale, { x: 1.1, y: 1.1, duration: 0.15, ease: 'power2.out' }));
    this.buyButton.on('pointerout', () => gsap.to(this.buyButton.scale, { x: 1, y: 1, duration: 0.15, ease: 'power2.in' }));

    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.3 });
  }

  private layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const smallest = Math.min(w, h);

    const isMobile = smallest < 650;

    this.overlay.clear();
    this.overlay.rect(0, 0, w, h);
    this.overlay.fill({ color: 0x2c5f2d, alpha: 0.95 });

    const panelWidth = isMobile ? smallest * 0.9 : 600;
    const panelHeight = isMobile ? smallest * 0.8 : 520;

    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;

    this.panelBg.clear();
    this.panelBg.roundRect(-halfW, -halfH, panelWidth, panelHeight, isMobile ? 14 : 20);
    this.panelBg.fill({ color: 0x4a7c59 });
    this.panelBg.stroke({ width: isMobile ? 4 : 7, color: 0xf4e4c1 });

    this.title.text = 'Welcome to Garden Makeover!';
    this.title.style = {
      fontFamily: 'Arial',
      fontSize: isMobile ? 18 : 30,
      fill: '#f4e4c1',
      fontWeight: 'bold',
      align: 'center',
      stroke: { color: '#2c5f2d', width: isMobile ? 3 : 5 }
    };
    this.title.position.set(0, -halfH + (isMobile ? 35 : 70));

    this.description.text = isMobile
        ? 'Start your farming adventure!\n\nBuild your dream farm,\ngrow crops, and raise animals.\n\nAre you ready?'
        : 'Start your farming adventure!\n\nBuild your dream farm, grow crops,\nand raise animals.\n\nAre you ready to begin?';

    this.description.style = {
      fontFamily: 'Arial',
      fontSize: isMobile ? 14 : 22,
      fill: '#ffffff',
      align: 'center',
      lineHeight: isMobile ? 14 : 26,
      stroke: { color: '#2c5f2d', width: 2 }
    };
    this.description.position.set(0, isMobile ? -5 : 0);

    const btnW = isMobile ? smallest * 0.7 : 300;
    const btnH = isMobile ? 55 : 80;
    const btnHW = btnW / 2;
    const btnHH = btnH / 2;

    this.buyButtonBg.clear();
    this.buyButtonBg.roundRect(-btnHW, -btnHH, btnW, btnH, 15);
    this.buyButtonBg.fill({ color: 0x86c232 });
    this.buyButtonBg.stroke({ width: isMobile ? 3 : 4, color: 0xf4e4c1 });

    this.buyButtonText.text = '🏡 BUY YOUR FARM 🏡';
    this.buyButtonText.style = {
      fontFamily: 'Arial',
      fontSize: isMobile ? 18 : 28,
      fill: '#ffffff',
      fontWeight: 'bold',
      stroke: { color: '#2c5f2d', width: isMobile ? 2 : 4 }
    };

    this.buyButton.position.set(0, halfH - (isMobile ? 45 : 70));

    this.panel.position.set(w / 2, h / 2);

    const bounds = this.panel.getLocalBounds();
    const scaleX = (w * 0.9) / bounds.width;
    const scaleY = (h * 0.9) / bounds.height;
    const finalScale = Math.min(scaleX, scaleY, 1);

    this.panel.scale.set(finalScale);
  }

  private handleBuy(): void {
    gsap.to(this, {
      alpha: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        this.onBuyCallback();
        this.destroy({ children: true });
      }
    });
  }

  public resize(): void {
    this.layout();
  }
}
