import { Container, Sprite, Text, Assets, Texture, TextStyle } from 'pixi.js';
import { EventBus } from '../Controllers/EventController';
import gsap from 'gsap';

export interface AnimationLoopConfiguration {
  scaleMin: number;
  scaleMax: number;
  duration: number;
}

const TEXT_STYLING = {
  fontFamily: 'Arial',
  fontSize: 27,
  fill: '#ffffff',
  stroke: { color: '#4a1850', width: 3, lineJoin: 'round' },
};

export interface TutorialStepData {
  position: { x: number; y: number };
  text: string;
}

export interface TutorialGuideConfiguration {
  steps: TutorialStepData[];
  handAnimationDuration?: number;
  loopAnimation?: AnimationLoopConfiguration;
}

export class TutorialGuide {
  public containerElement: Container;
  public handPointerSprite: Sprite;
  public instructionText: Text;

  private tutorialSteps: TutorialStepData[];
  private currentStepIndex: number = 0;
  private handTransitionDuration: number;
  private loopAnimationSettings: {
    scaleMin: number;
    scaleMax: number;
    duration: number;
  };

  constructor(guideConfig: TutorialGuideConfiguration) {
    const fingerTexture: Texture = Assets.get('finger');

    this.containerElement = new Container();
    this.handPointerSprite = new Sprite(fingerTexture);

    if (guideConfig.loopAnimation) {
      this.handPointerSprite.scale.set(guideConfig.loopAnimation.scaleMin || 1);
    }

    this.handPointerSprite.anchor.set(0.5);
    this.handPointerSprite.rotation = Math.PI * 1.75;
    this.handPointerSprite.visible = false;

    this.instructionText = new Text('', new TextStyle(TEXT_STYLING));

    this.containerElement.addChild(this.handPointerSprite, this.instructionText);

    this.tutorialSteps = guideConfig.steps;
    this.handTransitionDuration = guideConfig.handAnimationDuration || 0.5;
    this.loopAnimationSettings = guideConfig.loopAnimation || {
      scaleMin: 0.9,
      scaleMax: 1.1,
      duration: 1,
    };

    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    EventBus.attachOnceListener('HELPER:SHOW', () => {
      this.handPointerSprite.visible = true;
      this.initializeFirstStep();
    });

    EventBus.attachOnceListener('HELPER:HIDE', () => {
      this.containerElement.visible = false;
    });

    EventBus.attachListener('HELPER:NEXT:STEP', () => {
      this.advanceToNextStep();
    });
  }

  private initializeFirstStep(): void {
    if (this.tutorialSteps.length > 0) {
      const firstStep = this.tutorialSteps[0];
      this.handPointerSprite.position.set(firstStep.position.x, firstStep.position.y);
      this.instructionText.text = firstStep.text;
      this.instructionText.position.set(
        firstStep.position.x + 80,
        firstStep.position.y - 25
      );
      this.startPointerAnimation();
    }
  }

  private startPointerAnimation(): void {
    gsap.to(this.handPointerSprite.scale, {
      x: this.loopAnimationSettings.scaleMax,
      y: this.loopAnimationSettings.scaleMax,
      duration: this.loopAnimationSettings.duration,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
    });
  }

  public advanceToNextStep(): void {
    if (this.currentStepIndex < this.tutorialSteps.length - 1) {
      this.currentStepIndex++;
      const nextStep = this.tutorialSteps[this.currentStepIndex];

      gsap.to(this.handPointerSprite.position, {
        x: nextStep.position.x,
        y: nextStep.position.y,
        duration: this.handTransitionDuration,
        ease: 'power2.out',
      });

      gsap.to(this.instructionText, {
        x: nextStep.position.x + 80,
        y: nextStep.position.y - 25,
        duration: this.handTransitionDuration,
        ease: 'power2.out',
        onComplete: () => {
          this.instructionText.text = nextStep.text;
        },
      });
    }
  }
}
