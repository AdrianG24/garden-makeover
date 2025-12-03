import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import gsap from 'gsap';
import { SCREEN_BREAKPOINTS, TUTORIAL, COLORS } from '../constants';

export class TutorialRenderer {
  overlay!: Graphics;
  spotlightContainer!: Container;
  fingerSprite!: Sprite;
  popupContainer: Container | null = null;

  createOverlay(parent: Container): void {
    this.overlay = new Graphics();
    parent.addChild(this.overlay);

    this.spotlightContainer = new Container();
    parent.addChild(this.spotlightContainer);

    this.drawOverlay();
  }

  drawOverlay(cutoutX?: number, cutoutY?: number, cutoutWidth?: number, cutoutHeight?: number): void {
    this.overlay.clear();

    if (cutoutX !== undefined && cutoutY !== undefined && cutoutWidth !== undefined && cutoutHeight !== undefined) {
      this.overlay.fill(COLORS.BLACK, TUTORIAL.OVERLAY_ALPHA);
      this.overlay.rect(0, 0, window.innerWidth, cutoutY);
      this.overlay.rect(0, cutoutY, cutoutX, cutoutHeight);
      this.overlay.rect(cutoutX + cutoutWidth, cutoutY, window.innerWidth - (cutoutX + cutoutWidth), cutoutHeight);
      this.overlay.rect(0, cutoutY + cutoutHeight, window.innerWidth, window.innerHeight - (cutoutY + cutoutHeight));
      this.overlay.endFill();
      this.overlay.eventMode = 'static';
      this.overlay.cursor = 'default';
      this.overlay.on('pointerdown', (event) => {
        event.stopPropagation();
      });
    } else {
      this.overlay.fill(COLORS.BLACK, TUTORIAL.OVERLAY_ALPHA);
      this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
      this.overlay.endFill();
      this.overlay.eventMode = 'static';
      this.overlay.cursor = 'default';
      this.overlay.on('pointerdown', (event) => {
        event.stopPropagation();
      });
    }
  }

  createFingerSprite(parent: Container): void {
    const fingerTexture = Assets.get('finger');
    this.fingerSprite = new Sprite(fingerTexture);

    this.fingerSprite.anchor.set(0.5, 1);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
    const baseScale = isMobile ? TUTORIAL.FINGER_SCALE_MOBILE : TUTORIAL.FINGER_SCALE_DESKTOP;
    this.fingerSprite.scale.set(baseScale);

    this.fingerSprite.visible = false;
    this.fingerSprite.alpha = 0;

    parent.addChild(this.fingerSprite);
  }

  createSpotlight(x: number, y: number, width: number, height: number): void {
    this.spotlightContainer.removeChildren();

    const padding = TUTORIAL.SPOTLIGHT_PADDING;
    this.drawOverlay(x - padding, y - padding, width + padding * 2, height + padding * 2);

    const spotlight = new Graphics();
    spotlight.stroke({ width: TUTORIAL.SPOTLIGHT_BORDER_WIDTH, color: COLORS.GOLD, alpha: 0.8 });
    spotlight.roundRect(x - padding, y - padding, width + padding * 2, height + padding * 2, TUTORIAL.SPOTLIGHT_BORDER_RADIUS);

    this.spotlightContainer.addChild(spotlight);

    spotlight.alpha = 0;
    gsap.to(spotlight, {
      alpha: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    gsap.to(spotlight, {
      alpha: 0.6,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  showFinger(x: number, y: number): void {
    this.fingerSprite.position.set(x, y);
    this.fingerSprite.visible = true;
    this.fingerSprite.alpha = 0;

    gsap.killTweensOf(this.fingerSprite);
    gsap.killTweensOf(this.fingerSprite.scale);

    gsap.to(this.fingerSprite, {
      alpha: 1,
      duration: 1.25,
      ease: 'power2.out'
    });
  }

  animateFingerTap(): void {
    gsap.to(this.fingerSprite, {
      y: this.fingerSprite.y + TUTORIAL.FINGER_TAP_OFFSET,
      duration: TUTORIAL.FINGER_TAP_DURATION,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  showPopup(parent: Container, message: string, x: number, y: number): void {
    if (this.popupContainer) {
      this.popupContainer.destroy();
    }

    this.popupContainer = new Container();
    this.popupContainer.position.set(x, y);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
    const padding = isMobile ? TUTORIAL.POPUP_PADDING_MOBILE : TUTORIAL.POPUP_PADDING_DESKTOP;
    const fontSize = isMobile ? 18 : 22;

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: fontSize,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: 3, join: 'round' },
      align: 'center',
      wordWrap: true,
      wordWrapWidth: isMobile ? 200 : 300
    });

    const popupText = new Text(message, textStyle);
    popupText.anchor.set(0.5);

    const textBounds = popupText.getBounds();
    const bgWidth = textBounds.width + padding * 2;
    const bgHeight = textBounds.height + padding * 2;

    const background = new Graphics();
    background.fill(COLORS.DARK_GREEN, 0.95);
    background.roundRect(
      -bgWidth / 2,
      -bgHeight / 2,
      bgWidth,
      bgHeight,
      TUTORIAL.POPUP_BORDER_RADIUS
    );
    background.endFill();
    background.stroke({ width: TUTORIAL.POPUP_BORDER_WIDTH, color: COLORS.GOLD });
    background.roundRect(
      -bgWidth / 2,
      -bgHeight / 2,
      bgWidth,
      bgHeight,
      TUTORIAL.POPUP_BORDER_RADIUS
    );

    this.popupContainer.addChild(background);
    this.popupContainer.addChild(popupText);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popupBounds = this.popupContainer.getBounds();

    if (popupBounds.x + popupBounds.width > screenWidth - 20) {
      this.popupContainer.x = screenWidth - popupBounds.width / 2 - 20;
    }
    if (popupBounds.x < 20) {
      this.popupContainer.x = popupBounds.width / 2 + 20;
    }
    if (popupBounds.y + popupBounds.height > screenHeight - 20) {
      this.popupContainer.y = screenHeight - popupBounds.height / 2 - 20;
    }
    if (popupBounds.y < 20) {
      this.popupContainer.y = popupBounds.height / 2 + 20;
    }

    parent.addChild(this.popupContainer);

    this.popupContainer.alpha = 0;
    this.popupContainer.scale.set(0.5);

    gsap.to(this.popupContainer, {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to(this.popupContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    });
  }

  clearHighlights(): void {
    if (this.popupContainer) {
      const oldPopup = this.popupContainer;
      this.popupContainer = null;

      gsap.to(oldPopup, {
        alpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          oldPopup.destroy();
        }
      });
    }

    gsap.killTweensOf(this.fingerSprite);
    gsap.to(this.fingerSprite, {
      alpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.fingerSprite.visible = false;
      }
    });

    this.spotlightContainer.removeChildren();
    this.drawOverlay();
  }
}
