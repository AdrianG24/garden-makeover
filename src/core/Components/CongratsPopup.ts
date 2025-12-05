import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';

export class CongratsPopup extends Container {
  private popup: Container;

  constructor() {
    super();
    this.popup = this.createPopup();
    this.addChild(this.popup);
    this.alpha = 0;
  }

  private createPopup(): Container {
    const isMobile = window.innerWidth < 968;
    const popup = new Container();

    const overlay = new Graphics();
    overlay.fill(0x000000, 0.7);
    overlay.rect(0, 0, 3200, 3200).endFill();
    overlay.eventMode = 'static';
    overlay.on('pointerdown', (e) => e.stopPropagation());
    this.addChild(overlay);

    const bg = new Graphics();

    popup.addChild(bg);

    for (let i = 0; i < (isMobile ? 12 : 20); i++) {
      const star = new Graphics();
      star.fill(0xffff00, 0.8);
      star.star(0, 0, 5, isMobile ? 6 : 8).endFill();
      popup.addChild(star);
    }

    const textContainer = new Container();
    textContainer.name = 'textContainer';
    popup.addChild(textContainer);

    const title = new Text('CONGRATULATIONS!', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 24 : 48,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: isMobile ? 4 : 6 }
    }));
    title.anchor.set(0.5);
    textContainer.addChild(title);

    const subtitle = new Text(
        isMobile ? 'You completed\nall levels!' : 'You completed all levels!',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: isMobile ? 20 : 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: isMobile ? 3 : 4 },
          align: 'center'
        })
    );
    subtitle.anchor.set(0.5);
    textContainer.addChild(subtitle);

    const emoji = new Text('🎉 🌾 🐄 🐔 🌟', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 28 : 40
    }));
    emoji.anchor.set(0.5);
    textContainer.addChild(emoji);

    const desc = new Text('Your farm is now thriving!\nGreat job, farmer!', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 16 : 24,
      fill: '#ffffff',
      stroke: { color: '#000000', width: isMobile ? 2 : 3 },
      align: 'center'
    }));
    desc.anchor.set(0.5);
    textContainer.addChild(desc);

    popup.scale.set(0.5);
    return popup;
  }

  private layoutTextContainer(pw: number, ph: number): void {
    const textContainer = this.popup.getChildByName('textContainer') as Container;
    if (!textContainer) return;

    let y = 0;
    for (const child of textContainer.children) {
      if (child instanceof Text) {
        child.anchor.set(0.5, 0);
        child.x = 0;
        child.y = y;
        y += child.height + 12;
      }
    }

    const totalHeight = y;
    const padding = 20;
    const maxWidth = pw - padding * 2;
    const maxHeight = ph - padding * 2;

    let scale = 1;
    if (totalHeight > maxHeight) scale = maxHeight / totalHeight;
    if (textContainer.width * scale > maxWidth) scale = maxWidth / textContainer.width;

    textContainer.scale.set(scale);
    textContainer.x = 0;
    textContainer.y = -(totalHeight * 0.5 * scale);
  }

  public updateLayout(): void {
    const isMobile = window.innerWidth < 968;
    const w = isMobile ? Math.min(window.innerWidth - 40, 340) : 500;
    const h = isMobile ? Math.min(window.innerHeight - 100, 360) : 400;
    const halfW = w / 2;
    const halfH = h / 2;

    this.popup.position.set(window.innerWidth / 2, window.innerHeight / 2);

    let i = 0;
    for (const child of this.popup.children) {
      if (child instanceof Graphics && i === 0) {
        child.clear();
        child.fill(0x4CAF50, 1);
        child.roundRect(-halfW, -halfH, w, h, isMobile ? 15 : 20);
        child.endFill();
        child.stroke({ width: isMobile ? 5 : 8, color: 0xFFD700 });
      } else if (child instanceof Graphics) {

        child.position.set(
            -halfW + 20 + Math.random() * (w - 40),
            -halfH + 20 + Math.random() * (h - 40)
        );
      }
      i++;
    }

    this.layoutTextContainer(w, h);
  }

  public show(): void {
    this.alpha = 0;
    this.popup.scale.set(0.5);

    gsap.to(this, { alpha: 1, duration: 0.5, ease: 'power2.out' });
    gsap.to(this.popup.scale, { x: 1, y: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
    gsap.to(this.popup, { rotation: 0.05, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
}
