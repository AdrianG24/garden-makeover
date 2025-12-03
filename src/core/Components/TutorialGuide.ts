import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import gsap from 'gsap';
import { EventBusService } from '../Services/EventBusService';

interface TutorialStep {
  targetElement: 'balance' | 'questionMark' | 'itemOptions' | 'prices';
  message: string;
  waitForClick?: boolean;
  highlightMultiple?: boolean;
  highlightSingleItem?: boolean;
}

export class TutorialGuide extends Container {
  private overlay!: Graphics;
  private fingerSprite!: Sprite;
  private popupContainer: Container | null = null;
  private currentStep: number = 0;
  private isActive: boolean = false;
  private tutorialSteps: TutorialStep[] = [];
  private spotlightContainer!: Container;

  private balanceElement: Container | null = null;
  private questionMarkElements: Container[] = [];
  private resizeDebounceTween: gsap.core.Tween | null = null;
  private readonly QUESTION_MARK_SPOTLIGHT_OFFSET_X: number = 0;
  private readonly QUESTION_MARK_SPOTLIGHT_OFFSET_Y: number = 0;

  constructor(private eventBus: EventBusService) {
    super();
    this.visible = false;
    this.initializeTutorialSteps();
    this.setupEventListeners();
  }

  private initializeTutorialSteps(): void {
    this.tutorialSteps = [
      {
        targetElement: 'balance',
        message: 'This is your balance',
        waitForClick: false
      },
      {
        targetElement: 'questionMark',
        message: 'Tap here',
        waitForClick: true
      },
      {
        targetElement: 'itemOptions',
        message: 'Here you can choose\nitems for your garden',
        waitForClick: false,
        highlightSingleItem: true
      },
      {
        targetElement: 'itemOptions',
        message: 'Try to stay within\nyour budget to complete\nall levels!',
        waitForClick: false,
        highlightMultiple: true
      }
    ];
  }


  private setupEventListeners(): void {
    this.eventBus.on('HELPER:SHOW', () => {
      this.startTutorial();
    });

    this.eventBus.on('HELPER:NEXT:STEP', () => {
      if (this.isActive) {
        this.nextStep();
      }
    });

    this.eventBus.on('TUTORIAL:SET_BALANCE', (element: unknown) => {
      this.balanceElement = element as Container;
    });

    this.eventBus.on('TUTORIAL:ADD_QUESTION_MARK', (element: unknown) => {
      this.questionMarkElements.push(element as Container);
    });

    this.eventBus.on('ITEM_SELECTOR:SHOW', () => {
      if (this.isActive && this.currentStep === 1) {
        gsap.delayedCall(0.3, () => {
          this.nextStep();
        });
      }
    });
  }

  private startTutorial(): void {
    if (!this.balanceElement) {
      gsap.delayedCall(0.5, () => {
        this.startTutorial();
      });
      return;
    }

    this.isActive = true;
    this.visible = true;
    this.currentStep = 0;
    this.createOverlay();
    this.createFingerSprite();
    gsap.delayedCall(2.5, () => {
      this.showStep(0);
    });
  }

  private createOverlay(): void {
    this.overlay = new Graphics();
    this.addChild(this.overlay);

    this.spotlightContainer = new Container();
    this.addChild(this.spotlightContainer);

    this.drawOverlay();
  }

  private drawOverlay(cutoutX?: number, cutoutY?: number, cutoutWidth?: number, cutoutHeight?: number): void {
    this.overlay.clear();

    if (cutoutX !== undefined && cutoutY !== undefined && cutoutWidth !== undefined && cutoutHeight !== undefined) {
      this.overlay.fill(0x000000, 0.65);
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
      this.overlay.fill(0x000000, 0.65);
      this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
      this.overlay.endFill();
      this.overlay.eventMode = 'static';
      this.overlay.cursor = 'default';
      this.overlay.on('pointerdown', (event) => {
        event.stopPropagation();
      });
    }
  }

  private createFingerSprite(): void {
    const fingerTexture = Assets.get('finger');
    this.fingerSprite = new Sprite(fingerTexture);

    this.fingerSprite.anchor.set(0.5, 1);

    const isMobile = window.innerWidth < 968;
    const baseScale = isMobile ? 0.04 : 0.05;
    this.fingerSprite.scale.set(baseScale);

    this.fingerSprite.visible = false;
    this.fingerSprite.alpha = 0;

    this.addChild(this.fingerSprite);
  }



  private showStep(stepIndex: number): void {

    if (stepIndex >= this.tutorialSteps.length) {
      this.endTutorial();
      return;
    }

    const step = this.tutorialSteps[stepIndex];
    const previousStep = stepIndex > 0 ? this.tutorialSteps[stepIndex - 1] : null;


    if (
      previousStep &&
      previousStep.targetElement === step.targetElement &&
      previousStep.highlightSingleItem === step.highlightSingleItem
    ) {
      this.updatePopupOnly(step);
      return;
    }

    this.clearHighlights();

    switch (step.targetElement) {
      case 'balance':
        this.highlightBalance(step);
        break;
      case 'questionMark':
        this.highlightQuestionMark(step);
        break;
      case 'itemOptions':
        this.highlightItemOptions(step);
        break;
    }
  }

  private highlightBalance(step: TutorialStep): void {
    if (!this.balanceElement) return;

    const bounds = this.balanceElement.getBounds();
    this.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < 968;

    const popupX = bounds.x - (isMobile ? 130 : 160);
    const popupY = bounds.y + bounds.height / 2;
    this.showPopup(step.message, popupX, popupY);

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 100;
    this.showFinger(fingerX, fingerY);

    gsap.delayedCall(2.5, () => {
      this.nextStep();
    });
  }
  private getActiveQuestionMark(): Container | null {
    for (let i = this.questionMarkElements.length - 1; i >= 0; i--) {
      const el = this.questionMarkElements[i];
      if (!el || !el.parent || !el.visible) continue;

      const bounds = el.getBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        return el;
      }
    }
    return null;
  }


  private highlightQuestionMark(step: TutorialStep): void {
    const questionMark = this.getActiveQuestionMark();

    if (!questionMark) {
      gsap.delayedCall(0.5, () => {
        if (this.isActive && this.currentStep === 1) {
          this.highlightQuestionMark(step);
        }
      });
      return;
    }

    const bounds = questionMark.getBounds();

    const spotlightX = bounds.x;
    const spotlightY = bounds.y;

    this.createSpotlight(spotlightX, spotlightY, bounds.width, bounds.height);

    const isMobile = window.innerWidth < 968;
    const popupX = bounds.x + bounds.width / 2 + (isMobile ? 90 : 110);
    const popupY = bounds.y + bounds.height / 2;
    this.showPopup(step.message, popupX, popupY);

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 70;
    this.showFinger(fingerX, fingerY);
    this.animateFingerTap();
  }

  private highlightItemOptions(step: TutorialStep): void {
    gsap.delayedCall(0.1, () => {
      const itemSelectorPanels = this.findItemSelectorPanels();

      if (itemSelectorPanels.length === 0) {
        gsap.delayedCall(0.1, () => {
          this.highlightItemOptions(step);
        });
        return;
      }

      const isMobile = window.innerWidth < 968;
      let targetBounds;

      if (step.highlightSingleItem) {
        const singleItem = this.findSingleItemInPanel(itemSelectorPanels[0]);
        if (singleItem) {
          targetBounds = singleItem.getBounds();
        } else {
          targetBounds = itemSelectorPanels[0].getBounds();
        }
      } else {
        targetBounds = itemSelectorPanels[0].getBounds();
      }

      this.createSpotlight(
        targetBounds.x,
        targetBounds.y,
        targetBounds.width,
        targetBounds.height
      );

      const popupX = targetBounds.x + targetBounds.width / 2;
      const popupY = targetBounds.y - (isMobile ? 60 : 80);
      this.showPopup(step.message, popupX, popupY);

      gsap.delayedCall(2.5, () => {
        this.nextStep();
      });
    });
  }

  private findItemSelectorPanels(): Container[] {
    const results: Container[] = [];

    const searchForPanels = (container: Container) => {
      if (container.children) {
        container.children.forEach((child) => {
          if (child instanceof Container) {
            const hasBackground = child.children.some(
              (c) => c instanceof Graphics
            );
            const bounds = child.getBounds();
            const isMobile = window.innerWidth < 968;
            const expectedWidth = isMobile ? 360 : 560;

            if (
              hasBackground &&
              bounds.width > expectedWidth - 100 &&
              bounds.width < expectedWidth + 100 &&
              child.visible
            ) {
              results.push(child);
            }
            searchForPanels(child);
          }
        });
      }
    };

    if (this.parent) {
      searchForPanels(this.parent as Container);
    }

    return results;
  }

  private findSingleItemInPanel(panel: Container): Container | null {
    const items: Container[] = [];

    const searchForItems = (container: Container, depth: number = 0) => {
      if (depth > 5) return;

      container.children.forEach((child) => {
        if (child instanceof Container && child.visible) {
          const bounds = child.getBounds();
          const isMobile = window.innerWidth < 968;
          const expectedSize = isMobile ? 70 : 110;

          if (
            bounds.width > expectedSize - 30 &&
            bounds.width < expectedSize + 30 &&
            bounds.height > expectedSize - 30 &&
            bounds.height < expectedSize + 30
          ) {
            items.push(child);
          }

          searchForItems(child, depth + 1);
        }
      });
    };

    searchForItems(panel);

    return items.length > 0 ? items[items.length - 1] : null;
  }

  private createSpotlight(x: number, y: number, width: number, height: number): void {
    this.spotlightContainer.removeChildren();

    const padding = 5;
    this.drawOverlay(x - padding, y - padding, width + padding * 2, height + padding * 2);

    const spotlight = new Graphics();
    spotlight.stroke({ width: 4, color: 0xFFD700, alpha: 0.8 });
    spotlight.roundRect(x - padding, y - padding, width + padding * 2, height + padding * 2, 12);

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

  private showFinger(x: number, y: number): void {
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


  private animateFingerTap(): void {
    gsap.to(this.fingerSprite, {
      y: this.fingerSprite.y + 6,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }



  private showPopup(message: string, x: number, y: number): void {
    if (this.popupContainer) {
      this.popupContainer.destroy();
    }

    this.popupContainer = new Container();
    this.popupContainer.position.set(x, y);

    const isMobile = window.innerWidth < 968;
    const padding = isMobile ? 15 : 20;
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
    background.fill(0x2c5f2d, 0.95);
    background.roundRect(
      -bgWidth / 2,
      -bgHeight / 2,
      bgWidth,
      bgHeight,
      12
    );
    background.endFill();
    background.stroke({ width: 3, color: 0xFFD700 });
    background.roundRect(
      -bgWidth / 2,
      -bgHeight / 2,
      bgWidth,
      bgHeight,
      12
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

    this.addChild(this.popupContainer);

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

  private updatePopupOnly(step: TutorialStep): void {
    if (this.popupContainer) {
      const oldPopup = this.popupContainer;

      gsap.to(oldPopup, {
        alpha: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          oldPopup.destroy();
        }
      });
    }

    gsap.delayedCall(0.2, () => {
      const itemSelectorPanels = this.findItemSelectorPanels();
      if (itemSelectorPanels.length > 0) {
        const isMobile = window.innerWidth < 968;
        const panelBounds = itemSelectorPanels[0].getBounds();
        const popupX = panelBounds.x + panelBounds.width / 2;
        const popupY = panelBounds.y - (isMobile ? 60 : 80);
        this.showPopup(step.message, popupX, popupY);

        gsap.delayedCall(2.5, () => {
          this.nextStep();
        });
      }
    });
  }

  private clearHighlights(): void {

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

  private nextStep(): void {
    this.currentStep++;
    this.showStep(this.currentStep);
  }


  private endTutorial(): void {
    this.isActive = false;

    gsap.to(this, {
      alpha: 0,
      duration: 2.5,
      ease: 'power2.out',
      onComplete: () => {
        this.visible = false;
        this.destroy();
      }
    });

    this.eventBus.emit('TUTORIAL:COMPLETE');
  }

  private repositionCurrentStep(): void {
    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;

    gsap.killTweensOf(this.fingerSprite);
    gsap.killTweensOf(this.popupContainer);

    switch (step.targetElement) {
      case 'balance':
        this.repositionBalance();
        break;
      case 'questionMark':
        gsap.delayedCall(0.5, () => {
          this.repositionQuestionMark();

        })
        break;
      case 'itemOptions':
        this.repositionItemOptions(step);
        break;
    }
  }

  private repositionBalance(): void {
    if (!this.balanceElement) return;

    const bounds = this.balanceElement.getBounds();
    this.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < 968;

    if (this.popupContainer) {
      this.popupContainer.x = bounds.x - (isMobile ? 130 : 160);
      this.popupContainer.y = bounds.y + bounds.height / 2;
    }

    if (this.fingerSprite.visible) {
      this.fingerSprite.x = bounds.x + bounds.width / 2;
      this.fingerSprite.y = bounds.y + bounds.height + 100;
    }
  }

  private repositionQuestionMark(): void {
    const questionMark = this.getActiveQuestionMark();
    if (!questionMark) {
      gsap.delayedCall(3, () => {
        if (this.isActive && this.currentStep === 1) {
          this.repositionQuestionMark();
        }
      });
      return;
    }

    const bounds = questionMark.getBounds();
    if (!bounds.width || !bounds.height) {
      gsap.delayedCall(3, () => {
        if (this.isActive && this.currentStep === 1) {
          this.repositionQuestionMark();
        }
      });
      return;
    }

    const spotlightX = bounds.x + this.QUESTION_MARK_SPOTLIGHT_OFFSET_X;
    const spotlightY = bounds.y + this.QUESTION_MARK_SPOTLIGHT_OFFSET_Y;

    this.createSpotlight(spotlightX, spotlightY, bounds.width, bounds.height);

    const isMobile = window.innerWidth < 968;

    if (this.popupContainer) {
      const popupX = bounds.x + bounds.width / 2 + (isMobile ? 90 : 110);
      const popupY = bounds.y + bounds.height / 2;

      this.popupContainer.position.set(popupX, popupY);

      this.popupContainer.visible = true;

      gsap.killTweensOf(this.popupContainer);
      gsap.killTweensOf(this.popupContainer.scale);

      this.popupContainer.alpha = 0;
      this.popupContainer.scale.set(0.9);

      gsap.to(this.popupContainer, {
        alpha: 1,
        duration: 0.2,
        ease: 'power2.out'
      });

      gsap.to(this.popupContainer.scale, {
        x: 1,
        y: 1,
        duration: 0.25,
        ease: 'back.out(2)'
      });
    }

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 70;

    gsap.killTweensOf(this.fingerSprite);

    this.fingerSprite.visible = true;
    this.fingerSprite.alpha = 0;

    this.fingerSprite.x = fingerX;
    this.fingerSprite.y = fingerY + 10;

    gsap.to(this.fingerSprite, {
      alpha: 1,
      y: fingerY,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        this.animateFingerTap();
      }
    });
  }

  private repositionItemOptions(step: TutorialStep): void {
    const itemSelectorPanels = this.findItemSelectorPanels();

    if (itemSelectorPanels.length === 0) {
      gsap.delayedCall(0.3, () => {
        if (this.isActive && this.currentStep >= 2) {
          this.repositionItemOptions(step);
        }
      });
      return;
    }

    const isMobile = window.innerWidth < 968;

    if (step.highlightSingleItem) {
      const targetBounds = itemSelectorPanels[0].getBounds();

      this.createSpotlight(
        targetBounds.x,
        targetBounds.y,
        targetBounds.width,
        targetBounds.height
      );

      if (this.popupContainer) {
        this.popupContainer.x = targetBounds.x + targetBounds.width / 2;
        this.popupContainer.y = targetBounds.y - (isMobile ? 60 : 80);
      }
    } else if (step.highlightMultiple) {
      this.spotlightContainer.removeChildren();

      itemSelectorPanels.forEach((panel) => {
        const panelBounds = panel.getBounds();
        this.createSpotlight(
          panelBounds.x,
          panelBounds.y,
          panelBounds.width,
          panelBounds.height
        );
      });

      if (this.popupContainer && itemSelectorPanels.length > 0) {
        const firstPanelBounds = itemSelectorPanels[0].getBounds();
        this.popupContainer.x = firstPanelBounds.x + firstPanelBounds.width / 2;
        this.popupContainer.y = firstPanelBounds.y - (isMobile ? 60 : 80);
      }
    }
  }
  private scheduleRepositionAfterResize(delay: number = 0.7): void {
    if (this.resizeDebounceTween) {
      this.resizeDebounceTween.kill();
      this.resizeDebounceTween = null;
    }

    const stepIndex = this.currentStep;

    this.resizeDebounceTween = gsap.delayedCall(delay, () => {
      if (!this.isActive || this.currentStep !== stepIndex) return;

      this.repositionCurrentStep();
    }) as unknown as gsap.core.Tween;
  }



  public resize(): void {
    if (!this.isActive) return;

    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;

    if (this.overlay) {
      this.drawOverlay();
    }

    if (this.spotlightContainer) {
      this.spotlightContainer.removeChildren();
    }

    if (this.popupContainer) {
      this.popupContainer.visible = false;
    }

    if (this.fingerSprite) {
      gsap.killTweensOf(this.fingerSprite);
      this.fingerSprite.visible = false;
    }

    this.scheduleRepositionAfterResize(0.7);
  }



}
