import { Container } from 'pixi.js';
import gsap from 'gsap';
import { EventBusService } from '../Services/EventBusService';
import { TutorialRenderer } from './TutorialRenderer';
import { TutorialElementFinder } from './TutorialElementFinder';
import { SCREEN_BREAKPOINTS, TUTORIAL, ANIMATION_TIMINGS } from '../constants';

interface TutorialStep {
  targetElement: 'balance' | 'questionMark' | 'itemOptions' | 'prices';
  message: string;
  waitForClick?: boolean;
  highlightMultiple?: boolean;
  highlightSingleItem?: boolean;
}

export class TutorialGuide extends Container {
  private renderer: TutorialRenderer;
  private finder: TutorialElementFinder;
  private currentStep: number = 0;
  private isActive: boolean = false;
  private tutorialSteps: TutorialStep[] = [];
  private balanceElement: Container | null = null;
  private questionMarkElements: Container[] = [];
  private resizeDebounceTween: gsap.core.Tween | null = null;

  constructor(private eventBus: EventBusService) {
    super();
    this.visible = false;
    this.renderer = new TutorialRenderer();
    this.finder = new TutorialElementFinder();
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
    this.renderer.createOverlay(this);
    this.renderer.createFingerSprite(this);
    gsap.delayedCall(ANIMATION_TIMINGS.TUTORIAL_STEP_DELAY, () => {
      this.showStep(0);
    });
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

    this.renderer.clearHighlights();

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
    this.renderer.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;

    const popupX = bounds.x - (isMobile ? 130 : 160);
    const popupY = bounds.y + bounds.height / 2;
    this.renderer.showPopup(this, step.message, popupX, popupY);

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 100;
    this.renderer.showFinger(fingerX, fingerY);

    gsap.delayedCall(ANIMATION_TIMINGS.TUTORIAL_STEP_DELAY, () => {
      this.nextStep();
    });
  }

  private highlightQuestionMark(step: TutorialStep): void {
    const questionMark = this.finder.getActiveQuestionMark(this.questionMarkElements);

    if (!questionMark) {
      gsap.delayedCall(0.5, () => {
        if (this.isActive && this.currentStep === 1) {
          this.highlightQuestionMark(step);
        }
      });
      return;
    }

    const bounds = questionMark.getBounds();
    this.renderer.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
    const popupX = bounds.x + bounds.width / 2 + (isMobile ? 90 : 110);
    const popupY = bounds.y + bounds.height / 2;
    this.renderer.showPopup(this, step.message, popupX, popupY);

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 70;
    this.renderer.showFinger(fingerX, fingerY);
    this.renderer.animateFingerTap();
  }

  private highlightItemOptions(step: TutorialStep): void {
    gsap.delayedCall(0.1, () => {
      const itemSelectorPanels = this.finder.findItemSelectorPanels(this.parent as Container);

      if (itemSelectorPanels.length === 0) {
        gsap.delayedCall(0.1, () => {
          this.highlightItemOptions(step);
        });
        return;
      }

      const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
      let targetBounds;

      if (step.highlightSingleItem) {
        const singleItem = this.finder.findSingleItemInPanel(itemSelectorPanels[0]);
        if (singleItem) {
          targetBounds = singleItem.getBounds();
        } else {
          targetBounds = itemSelectorPanels[0].getBounds();
        }
      } else {
        targetBounds = itemSelectorPanels[0].getBounds();
      }

      this.renderer.createSpotlight(
        targetBounds.x,
        targetBounds.y,
        targetBounds.width,
        targetBounds.height
      );

      const popupX = targetBounds.x + targetBounds.width / 2;
      const popupY = targetBounds.y - (isMobile ? 60 : 80);
      this.renderer.showPopup(this, step.message, popupX, popupY);

      gsap.delayedCall(ANIMATION_TIMINGS.TUTORIAL_STEP_DELAY, () => {
        this.nextStep();
      });
    });
  }

  private updatePopupOnly(step: TutorialStep): void {
    if (this.renderer.popupContainer) {
      const oldPopup = this.renderer.popupContainer;

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
      const itemSelectorPanels = this.finder.findItemSelectorPanels(this.parent as Container);
      if (itemSelectorPanels.length > 0) {
        const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
        const panelBounds = itemSelectorPanels[0].getBounds();
        const popupX = panelBounds.x + panelBounds.width / 2;
        const popupY = panelBounds.y - (isMobile ? 60 : 80);
        this.renderer.showPopup(this, step.message, popupX, popupY);

        gsap.delayedCall(ANIMATION_TIMINGS.TUTORIAL_STEP_DELAY, () => {
          this.nextStep();
        });
      }
    });
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

    gsap.killTweensOf(this.renderer.fingerSprite);
    gsap.killTweensOf(this.renderer.popupContainer);

    switch (step.targetElement) {
      case 'balance':
        this.repositionBalance();
        break;
      case 'questionMark':
        gsap.delayedCall(0.5, () => {
          this.repositionQuestionMark();
        });
        break;
      case 'itemOptions':
        this.repositionItemOptions(step);
        break;
    }
  }

  private repositionBalance(): void {
    if (!this.balanceElement) return;

    const bounds = this.balanceElement.getBounds();
    this.renderer.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;

    if (this.renderer.popupContainer) {
      this.renderer.popupContainer.x = bounds.x - (isMobile ? 130 : 160);
      this.renderer.popupContainer.y = bounds.y + bounds.height / 2;
    }

    if (this.renderer.fingerSprite.visible) {
      this.renderer.fingerSprite.x = bounds.x + bounds.width / 2;
      this.renderer.fingerSprite.y = bounds.y + bounds.height + 100;
    }
  }

  private repositionQuestionMark(): void {
    const questionMark = this.finder.getActiveQuestionMark(this.questionMarkElements);
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

    this.renderer.createSpotlight(bounds.x, bounds.y, bounds.width, bounds.height);

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;

    if (this.renderer.popupContainer) {
      const popupX = bounds.x + bounds.width / 2 + (isMobile ? 90 : 110);
      const popupY = bounds.y + bounds.height / 2;

      this.renderer.popupContainer.position.set(popupX, popupY);
      this.renderer.popupContainer.visible = true;

      gsap.killTweensOf(this.renderer.popupContainer);
      gsap.killTweensOf(this.renderer.popupContainer.scale);

      this.renderer.popupContainer.alpha = 0;
      this.renderer.popupContainer.scale.set(0.9);

      gsap.to(this.renderer.popupContainer, {
        alpha: 1,
        duration: 0.2,
        ease: 'power2.out'
      });

      gsap.to(this.renderer.popupContainer.scale, {
        x: 1,
        y: 1,
        duration: 0.25,
        ease: 'back.out(2)'
      });
    }

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 70;

    gsap.killTweensOf(this.renderer.fingerSprite);

    this.renderer.fingerSprite.visible = true;
    this.renderer.fingerSprite.alpha = 0;

    this.renderer.fingerSprite.x = fingerX;
    this.renderer.fingerSprite.y = fingerY + 10;

    gsap.to(this.renderer.fingerSprite, {
      alpha: 1,
      y: fingerY,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        this.renderer.animateFingerTap();
      }
    });
  }

  private repositionItemOptions(step: TutorialStep): void {
    const itemSelectorPanels = this.finder.findItemSelectorPanels(this.parent as Container);

    if (itemSelectorPanels.length === 0) {
      gsap.delayedCall(0.3, () => {
        if (this.isActive && this.currentStep >= 2) {
          this.repositionItemOptions(step);
        }
      });
      return;
    }

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;

    if (step.highlightSingleItem) {
      const targetBounds = itemSelectorPanels[0].getBounds();

      this.renderer.createSpotlight(
        targetBounds.x,
        targetBounds.y,
        targetBounds.width,
        targetBounds.height
      );

      if (this.renderer.popupContainer) {
        this.renderer.popupContainer.x = targetBounds.x + targetBounds.width / 2;
        this.renderer.popupContainer.y = targetBounds.y - (isMobile ? 60 : 80);
      }
    } else if (step.highlightMultiple) {
      this.renderer.spotlightContainer.removeChildren();

      itemSelectorPanels.forEach((panel) => {
        const panelBounds = panel.getBounds();
        this.renderer.createSpotlight(
          panelBounds.x,
          panelBounds.y,
          panelBounds.width,
          panelBounds.height
        );
      });

      if (this.renderer.popupContainer && itemSelectorPanels.length > 0) {
        const firstPanelBounds = itemSelectorPanels[0].getBounds();
        this.renderer.popupContainer.x = firstPanelBounds.x + firstPanelBounds.width / 2;
        this.renderer.popupContainer.y = firstPanelBounds.y - (isMobile ? 60 : 80);
      }
    }
  }

  private scheduleRepositionAfterResize(delay: number = TUTORIAL.REPOSITION_DELAY): void {
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

    if (this.renderer.overlay) {
      this.renderer.drawOverlay();
    }

    if (this.renderer.spotlightContainer) {
      this.renderer.spotlightContainer.removeChildren();
    }

    if (this.renderer.popupContainer) {
      this.renderer.popupContainer.visible = false;
    }

    if (this.renderer.fingerSprite) {
      gsap.killTweensOf(this.renderer.fingerSprite);
      this.renderer.fingerSprite.visible = false;
    }

    this.scheduleRepositionAfterResize(TUTORIAL.REPOSITION_DELAY);
  }
}
