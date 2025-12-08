import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';

export class LevelUpAnimation {
  public static create(level: number): Container {
    const container = new Container();

    const glow = new Graphics();
    glow.circle(0, 0, 100);
    glow.fill(0xFFD700, 0.3);
    container.addChild(glow);

    const levelNumber = new Text(level.toString(), new TextStyle({
      fontFamily: 'Arial',
      fontSize: 80,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: 6, join: 'round' }
    }));
    levelNumber.anchor.set(0.5);
    container.addChild(levelNumber);

    const levelUpText = new Text('LEVEL UP!', new TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#FFD700', width: 4, join: 'round' }
    }));
    levelUpText.anchor.set(0.5);
    levelUpText.position.set(0, -80);
    container.addChild(levelUpText);

    container.position.set(window.innerWidth / 2, window.innerHeight / 2);
    container.alpha = 0;
    container.scale.set(0.5);

    return container;
  }

  public static animate(container: Container, onComplete: () => void): void {
    gsap.to(container, { alpha: 1, duration: 0.3, ease: 'power2.out' });
    gsap.to(container.scale, { x: 1.2, y: 1.2, duration: 0.5, ease: 'back.out(1.7)' });
    gsap.to(container.scale, { x: 1.3, y: 1.3, duration: 0.5, delay: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    gsap.to(container, {
      alpha: 0,
      duration: 0.5,
      delay: 1.5,
      ease: 'power2.in',
      onComplete
    });
  }
}
