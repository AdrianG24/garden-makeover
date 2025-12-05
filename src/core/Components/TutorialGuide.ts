import { Container } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { TutorialRenderer } from './TutorialRenderer';
import { SCREEN_BREAKPOINTS, ANIMATION_TIMINGS, TUTORIAL } from '../constants';

interface TutorialStep {
  targetElement: 'balance' | 'questionMark';
  message: string;
  waitForClick?: boolean;
}

export class TutorialGuide extends Container {
  private renderer: TutorialRenderer;
  private currentStep: number = 0;
  private isActive: boolean = false;
  private tutorialSteps: TutorialStep[] = [];
  private balanceElement: Container | null = null;
  private questionMarkElements: Container[] = [];
  private resizeDebounceTween: gsap.core.Tween | null = null;


  constructor() {
    super();
    this.visible = false;
    this.renderer = new TutorialRenderer();
    this.initializeTutorialSteps();
    this.setupEventListeners();
  }

  private getActiveQuestionMark(questionMarkElements: Container[]): Container | null {
    for (let i = questionMarkElements.length - 1; i >= 0; i--) {
      const el = questionMarkElements[i];
      if (!el || !el.parent || !el.visible) continue;

      const bounds = el.getBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        return el;
      }
    }
    return null;
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
        message: 'Tap here to select items',
        waitForClick: true
      }
    ];
  }

  private setupEventListeners(): void {
    eventEmitter.on('HELPER:SHOW', () => {
      this.startTutorial();
    });

    eventEmitter.on('HELPER:HIDE', () => {
      this.endTutorial();
    });

    eventEmitter.on('TUTORIAL:SET_BALANCE', (element: unknown) => {
      this.balanceElement = element as Container;
    });

    eventEmitter.on('TUTORIAL:ADD_QUESTION_MARK', (element: unknown) => {
      this.questionMarkElements.push(element as Container);
    });

    eventEmitter.on('ITEM_SELECTOR:SHOW', () => {
      if (this.currentStep === 1 && this.isActive) {
        this.renderer.clearHighlights();
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

    this.renderer.clearHighlights();

    switch (step.targetElement) {
      case 'balance':
        this.highlightBalance(step);
        break;
      case 'questionMark':
        this.highlightQuestionMark(step);
        break;
    }
  }

  private highlightBalance(step: TutorialStep): void {
    if (!this.balanceElement) return;

    const bounds = this.balanceElement.getBounds();

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
    const questionMark = this.getActiveQuestionMark(this.questionMarkElements);

    if (!questionMark) {
      gsap.delayedCall(0.5, () => {
        if (this.isActive && this.currentStep === 1) {
          this.highlightQuestionMark(step);
        }
      });
      return;
    }

    const bounds = questionMark.getBounds();

    const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
    const popupX = bounds.x + bounds.width / 2 + (isMobile ? 90 : 110);
    const popupY = bounds.y + bounds.height / 2;
    this.renderer.showPopup(this, step.message, popupX, popupY);

    const fingerX = bounds.x + bounds.width / 2;
    const fingerY = bounds.y + bounds.height + 70;
    this.renderer.showFinger(fingerX, fingerY);
    this.renderer.animateFingerTap();
  }

  private nextStep(): void {
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  private endTutorial(): void {
    this.isActive = false;

    gsap.to(this, {
      alpha: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => {
        this.visible = false;
        this.destroy();
      }
    });

    eventEmitter.emit('TUTORIAL:COMPLETE');
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
        gsap.delayedCall(1, () => {
          this.repositionQuestionMark();
        });
        break;
    }
  }

  private repositionBalance(): void {
    if (!this.balanceElement) return;

    const bounds = this.balanceElement.getBounds();

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
    const questionMark = this.getActiveQuestionMark(this.questionMarkElements);
    if (!questionMark) {
      gsap.delayedCall(2, () => {
        if (this.isActive && this.currentStep === 1) {
          this.repositionQuestionMark();
        }
      });
      return;
    }

    const bounds = questionMark.getBounds();
    if (!bounds.width || !bounds.height) {
      gsap.delayedCall(2, () => {
        if (this.isActive && this.currentStep === 1) {
          this.repositionQuestionMark();
        }
      });
      return;
    }

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
