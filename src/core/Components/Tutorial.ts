import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';

interface TutorialStep {
  title: string;
  description: string;
}

interface ButtonContainer extends Container {
  bg: Graphics;
  txt: Text;
}

export class Tutorial extends Container {
  private overlay!: Graphics;
  private panel!: Container;
  private panelBg!: Graphics;

  private titleText!: Text;
  private descriptionText!: Text;
  private stepIndicator!: Text;

  private nextButton!: ButtonContainer;
  private nextButtonText!: Text;
  private skipButton!: ButtonContainer;

  private currentStep = 0;
  private steps: TutorialStep[] = [
    { title: '🌟 Welcome!', description: 'Build your dream garden farm!\nLet\'s learn the basics.' },
    { title: '💰 Earn Money', description: 'Click the golden coin button\nto earn $ per click!' },
    { title: '🎯 Place Items', description: 'Tap glowing spots to add\nanimals and plants to your farm.' },
    { title: '📊 Level Up', description: 'Complete placements to level up!\nHigher levels = more $ per click!' },
    { title: '🌙 Day & Night', description: 'Use the sun/moon button\nto toggle lighting.' },
    { title: '✨ Have Fun!', description: 'You\'re ready to play!\nEnjoy building your garden!' }
  ];

  private isMobile: boolean;
  private panelWidth: number;
  private panelHeight: number;

  constructor(private onComplete: () => void) {
    super();

    this.isMobile = window.innerWidth < 968;
    this.panelWidth = this.isMobile ? Math.min(window.innerWidth - 40, 360) : 500;
    this.panelHeight = this.isMobile ? 260 : 300;

    this.createUI();
    this.updateStepContent();
  }

  private createUI(): void {
    this.overlay = new Graphics();
    this.addChild(this.overlay);

    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => {});

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBg = new Graphics();
    this.panel.addChild(this.panelBg);

    this.titleText = new Text('', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000', width: 4 }
    });
    this.titleText.anchor.set(0.5);
    this.panel.addChild(this.titleText);

    this.descriptionText = new Text('', {
      fontFamily: 'Arial',
      fill: '#FFFFFF',
      stroke: { color: '#000', width: 2 }
    });
    this.descriptionText.anchor.set(0.5);
    this.panel.addChild(this.descriptionText);

    this.stepIndicator = new Text('', {
      fontFamily: 'Arial',
      fill: '#CCCCCC',
      stroke: { color: '#000', width: 2 }
    });
    this.stepIndicator.anchor.set(0.5);
    this.panel.addChild(this.stepIndicator);

    this.nextButton = this.createButton('Next');
    this.nextButton.on('pointerdown', () => this.nextStep());
    this.panel.addChild(this.nextButton);

    this.skipButton = this.createButton('Skip');
    this.skipButton.on('pointerdown', () => this.skip());
    this.panel.addChild(this.skipButton);

    this.layout();
  }

  private createButton(label: string): ButtonContainer {
    const container = new Container() as ButtonContainer;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const bg = new Graphics();
    container.addChild(bg);

    const txt = new Text(label, {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      stroke: { color: '#000', width: 3 }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    if (label === 'Next') this.nextButtonText = txt;

    container.on('pointerover', () =>
        gsap.to(container.scale, { x: 1.05, y: 1.05, duration: 0.12, ease: 'power2.out' })
    );
    container.on('pointerout', () =>
        gsap.to(container.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.in' })
    );

    container.bg = bg;
    container.txt = txt;

    return container;
  }

  private layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.overlay.clear();
    this.overlay.fill(0x000000, 0.5);
    this.overlay.rect(0, 0, w, h);
    this.overlay.endFill();

    this.panel.position.set(w / 2, h / 2);

    this.isMobile = w < 420;

    this.panelWidth = Math.min(this.isMobile ? w - 40 : 500, w * 0.95);
    this.panelHeight = Math.min(this.isMobile ? 300 : 300, h * 0.85);

    const halfW = this.panelWidth / 2;
    const halfH = this.panelHeight / 2;

    this.panelBg.clear();
    this.panelBg.fill(0x2c5f2d, 1);
    this.panelBg.roundRect(-halfW, -halfH, this.panelWidth, this.panelHeight, 15);
    this.panelBg.stroke({ width: 4, color: 0xFFD700 });
    this.panelBg.roundRect(-halfW, -halfH, this.panelWidth, this.panelHeight, 15);
    this.panelBg.endFill();

    const titleSize = this.isMobile ? 24 : 32;
    const descSize = this.isMobile ? 17 : 22;
    const stepSize = this.isMobile ? 14 : 16;

    this.titleText.style.fontSize = titleSize;

    this.descriptionText.style.wordWrap = true;
    this.descriptionText.style.wordWrapWidth = this.panelWidth - 60;
    this.descriptionText.style.fontSize = descSize;

    this.descriptionText.style.lineHeight = this.isMobile ? 26 : 32;

    this.stepIndicator.style.fontSize = stepSize;

    this.titleText.position.set(0, -halfH + 40);
    this.descriptionText.position.set(0, -20);
    this.stepIndicator.position.set(0, halfH - 100);

    const btnW = this.isMobile ? 110 : 130;
    const btnH = this.isMobile ? 42 : 50;

    const buttonsOffset = this.isMobile ? 70 : 100;

    const layoutButton = (btn: ButtonContainer, x: number) => {
      const bg = btn.bg;
      const txt = btn.txt;

      bg.clear();
      bg.fill(txt.text === 'Next' || txt.text === 'Start!' ? 0x4CAF50 : 0x666666);
      bg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      bg.stroke({ width: 3, color: 0xFFFFFF });
      bg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      bg.endFill();

      txt.style.fontSize = this.isMobile ? 17 : 22;

      btn.position.set(x, halfH - 55);
    };

    layoutButton(this.nextButton, buttonsOffset);
    layoutButton(this.skipButton, -buttonsOffset);
  }

  private updateStepContent(): void {
    const step = this.steps[this.currentStep];

    gsap.to([this.titleText, this.descriptionText], {
      alpha: 0,
      duration: 0.15,
      onComplete: () => {
        this.titleText.text = step.title;
        this.descriptionText.text = step.description;
        this.stepIndicator.text = `${this.currentStep + 1} / ${this.steps.length}`;

        this.nextButtonText.text =
            this.currentStep === this.steps.length - 1 ? 'Start!' : 'Next';

        this.layout();

        gsap.to([this.titleText, this.descriptionText], {
          alpha: 1,
          duration: 0.15
        });
      }
    });
  }

  private nextStep(): void {
    eventEmitter.emit('TUTORIAL:STEP', this.currentStep + 1);

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateStepContent();
    } else {
      this.complete();
    }
  }

  private skip(): void {
    eventEmitter.emit('TUTORIAL:SKIPPED');
    this.complete();
  }

  private complete(): void {
    eventEmitter.emit('TUTORIAL:COMPLETED');

    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.onComplete();
        this.visible = false;
      }
    });
  }

  public resize(): void {
    this.layout();
  }
}
