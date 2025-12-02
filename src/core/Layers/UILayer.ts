import { Container } from 'pixi.js';
import { gsap } from 'gsap';

export class UILayer extends Container {

  private fadeAnimationDuration = 0.4;

  constructor() {
    super();
    this.visible = false;
    this.alpha = 0;
  }

  public showLayer(): void {
    this.visible = true;
    gsap.killTweensOf(this);
    gsap.to(this, {
      alpha: 1,
      duration: this.fadeAnimationDuration,
      delay: 1,
      ease: 'power2.out',
    });
  }

  public addToLayer<T extends Container>(displayObject: T): T {
    this.addChild(displayObject);
    return displayObject;
  }

}
