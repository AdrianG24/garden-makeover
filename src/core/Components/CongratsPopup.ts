import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';

export class CongratsPopup extends Container {
  private overlay!: Graphics;
  private wrapper!: Container;
  private panel!: Container;
  private panelBg!: Graphics;

  private title!: Text;
  private subtitle!: Text;
  private emoji!: Text;
  private description!: Text;

  private restartButton!: Container;
  private restartBg!: Graphics;
  private restartText!: Text;

  private rateButton!: Container;
  private rateBg!: Graphics;
  private rateText!: Text;

  constructor() {
    super();
    this.create();
    // this.layout();
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.35 });
  }

  private create() {
    this.overlay = new Graphics();
    this.addChild(this.overlay);

    this.wrapper = new Container();
    this.addChild(this.wrapper);

    this.panel = new Container();
    this.wrapper.addChild(this.panel);

    this.panelBg = new Graphics();
    this.panel.addChild(this.panelBg);

    this.title = new Text('', {});
    this.title.anchor.set(0.5);
    this.panel.addChild(this.title);

    this.subtitle = new Text('', {});
    this.subtitle.anchor.set(0.5);
    this.panel.addChild(this.subtitle);

    this.emoji = new Text('', {});
    this.emoji.anchor.set(0.5);
    this.panel.addChild(this.emoji);

    this.description = new Text('', {});
    this.description.anchor.set(0.5);
    this.panel.addChild(this.description);

    this.restartButton = new Container();
    this.restartButton.eventMode = 'static';
    this.restartButton.cursor = 'pointer';

    this.restartBg = new Graphics();
    this.restartButton.addChild(this.restartBg);
    this.restartText = new Text('', {});
    this.restartText.anchor.set(0.5);
    this.restartButton.addChild(this.restartText);
    this.panel.addChild(this.restartButton);

    this.rateButton = new Container();
    this.rateButton.eventMode = 'static';
    this.rateButton.cursor = 'pointer';

    this.rateBg = new Graphics();
    this.rateButton.addChild(this.rateBg);
    this.rateText = new Text('', {});
    this.rateText.anchor.set(0.5);
    this.rateButton.addChild(this.rateText);
    this.panel.addChild(this.rateButton);

    this.restartButton.on('pointerdown', () => this.handleRestart());
    this.restartButton.on('pointerover', () => gsap.to(this.restartButton.scale, { x: 1.05, y: 1.05, duration: 0.2 }));
    this.restartButton.on('pointerout', () => gsap.to(this.restartButton.scale, { x: 1, y: 1, duration: 0.2 }));

    this.rateButton.on('pointerdown', () => this.handleRate());
    this.rateButton.on('pointerover', () => gsap.to(this.rateButton.scale, { x: 1.05, y: 1.05, duration: 0.2 }));
    this.rateButton.on('pointerout', () => gsap.to(this.rateButton.scale, { x: 1, y: 1, duration: 0.2 }));
  }

  private layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.overlay.clear().rect(0, 0, w, h).fill(0x000000, 0.7);

    const baseWidth = 500;
    const padding = 40;
    const contentPadding = 30;

    const isTiny = Math.min(w, h) < 400;
    const isSmall = Math.min(w, h) < 600;

    this.title.text = 'CONGRATULATIONS!';
    this.title.style = {
      fontFamily: 'Arial',
      fontSize: isTiny ? 20 : isSmall ? 26 : 36,
      fill: '#f4e4c1',
      fontWeight: 'bold',
      stroke: { color: '#2c5f2d', width: isTiny ? 2 : isSmall ? 3 : 5 }
    };

    this.subtitle.text = 'You completed all levels!';
    this.subtitle.style = {
      fontFamily: 'Arial',
      fontSize: isTiny ? 14 : isSmall ? 17 : 22,
      fill: '#ffffff',
      align: 'center',
      stroke: { color: '#2c5f2d', width: 2 }
    };

    this.emoji.text = '🎉 🌾 🐄 🐔 ✨';
    this.emoji.style = {
      fontFamily: 'Arial',
      fontSize: isTiny ? 24 : isSmall ? 30 : 38
    };

    this.description.text = 'Your farm is now thriving!\nGreat job, farmer!';
    this.description.style = {
      fontFamily: 'Arial',
      fontSize: isTiny ? 13 : isSmall ? 15 : 19,
      fill: '#ffffff',
      align: 'center',
      stroke: { color: '#2c5f2d', width: 2 }
    };

    const btnW = isTiny ? 150 : isSmall ? 180 : 200;
    const btnH = isTiny ? 44 : isSmall ? 50 : 60;
    const btnSpacing = 12;
    const hb = btnW / 2;
    const vb = btnH / 2;

    const btnFontSize = isTiny ? 14 : isSmall ? 16 : 20;

    this.restartBg.clear().roundRect(-hb, -vb, btnW, btnH, 12).fill(0x6ebe3b).stroke({ width: 3, color: 0xf4e4c1 });
    this.restartText.text = '🔄 Play Again';
    this.restartText.style = {
      fontFamily: 'Arial',
      fontSize: btnFontSize,
      fill: '#ffffff',
      fontWeight: 'bold',
      stroke: { color: '#2c5f2d', width: 3 }
    };

    this.rateBg.clear().roundRect(-hb, -vb, btnW, btnH, 12).fill(0xff9800).stroke({ width: 3, color: 0xf4e4c1 });
    this.rateText.text = '⭐ Play full version';
    this.rateText.style = {
      fontFamily: 'Arial',
      fontSize: btnFontSize,
      fill: '#ffffff',
      fontWeight: 'bold',
      stroke: { color: '#2c5f2d', width: 3 }
    };

    let yPos = 0;
    const spacing = isTiny ? 15 : isSmall ? 20 : 25;

    this.title.position.set(0, yPos);
    yPos += this.title.height + spacing;

    this.subtitle.position.set(0, yPos);
    yPos += this.subtitle.height + spacing;

    this.emoji.position.set(0, yPos);
    yPos += this.emoji.height + spacing * 1.2;

    this.description.position.set(0, yPos);
    yPos += this.description.height + spacing * 1.5;

    const shouldStackButtons = (btnW * 2 + btnSpacing) > (baseWidth - contentPadding * 2) || isTiny;

    if (shouldStackButtons) {
      this.restartButton.position.set(0, yPos);
      yPos += btnH + btnSpacing;
      this.rateButton.position.set(0, yPos);
      yPos += btnH;
    } else {
      this.restartButton.position.set(-(btnW / 2 + btnSpacing / 2), yPos);
      this.rateButton.position.set(btnW / 2 + btnSpacing / 2, yPos);
      yPos += btnH;
    }

    const contentHeight = yPos;
    const contentWidth = Math.max(
      this.title.width,
      this.subtitle.width,
      this.emoji.width,
      this.description.width,
      shouldStackButtons ? btnW : (btnW * 2 + btnSpacing)
    );

    const panelWidth = contentWidth + contentPadding * 2;
    const panelHeight = contentHeight + contentPadding * 2;

    const offsetY = -panelHeight / 2 + contentPadding;
    this.title.y += offsetY;
    this.subtitle.y += offsetY;
    this.emoji.y += offsetY;
    this.description.y += offsetY;
    this.restartButton.y += offsetY;
    this.rateButton.y += offsetY;

    const hw = panelWidth / 2;
    const hh = panelHeight / 2;
    this.panelBg.clear()
      .roundRect(-hw, -hh, panelWidth, panelHeight, isSmall ? 15 : 20)
      .fill(0x4a7c59)
      .stroke({ width: isSmall ? 4 : 6, color: 0xf4e4c1 });

    this.wrapper.position.set(w / 2, h / 2);
    this.wrapper.scale.set(1);

    const bounds = this.wrapper.getLocalBounds();
    const availableWidth = w - padding * 2;
    const availableHeight = h - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const finalScale = Math.min(scaleX, scaleY, 1);

    this.wrapper.scale.set(finalScale);
  }

  private handleRestart() {
    eventEmitter.emit('LEVEL:RESET');
    gsap.to(this, { alpha: 0, duration: 0.35, onComplete: () => {this.visible = false} });
  }

  private handleRate() {
    const ua = navigator.userAgent;
    let url = 'https://play.google.com/store';
    if (/iPhone|iPad|iPod/.test(ua)) url = 'https://apps.apple.com/';
    window.open(url, '_blank');
  }

  public updateLayout() {
    this.layout();
  }

  public show() {
    this.visible = true;
    this.alpha = 0;

    requestAnimationFrame(() => {
        this.updateLayout();

        this.wrapper.scale.set(0.6);
        gsap.to(this, { alpha: 1, duration: 0.4 });
        gsap.to(this.wrapper.scale, { x: 1, y: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  }

}
