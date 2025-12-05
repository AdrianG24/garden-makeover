import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { eventEmitter } from '../Services/EventBusService';
import { ItemService } from '../Services/ItemService';
import { AudioService } from '../Services/AudioService';

export interface LevelGoal {
  id: string;
  description: string;
  completed: boolean;
}

export interface LevelConfig {
  level: number;
  goals: LevelGoal[];
}

export class LevelingSystem extends Container {
  private currentLevel: number = 0;
  private levelText!: Text;
  private progressBar!: Graphics;
  private progressBackground!: Graphics;
  private progressText!: Text;
  private levelUpAnimation: Container | null = null;

  private levels: LevelConfig[] = [];
  private currentGoals: LevelGoal[] = [];
  private congratsContainer?: Container;
  private popupContainer?: Container;
  private panel!: Graphics;
  private isMobile: boolean = window.innerWidth < 968;
  private padding: number = 20;
  private barWidth: number = 200;
  private barHeight: number = 20;


  constructor(
    private itemService: ItemService,
    private audioService: AudioService
  ) {
    super();
    this.initializeLevels();
    this.createLevelUI();
    this.setupEventListeners();
    this.updateDisplay();
  }

  private initializeLevels(): void {
    this.levels = [
      {
        level: 1,
        goals: [
          { id: 'cow_1', description: 'Place a cow', completed: false },
          { id: 'chicken_1', description: 'Place a chicken', completed: false }
        ]
      },
      {
        level: 2,
        goals: [
          { id: 'sheep_1', description: 'Place a sheep', completed: false },
          { id: 'corn_1', description: 'Place corn', completed: false },
          { id: 'tomato_1', description: 'Place a tomato', completed: false }
        ]
      },
      {
        level: 3,
        goals: [
          { id: 'strawberry_1', description: 'Place strawberries', completed: false },
          { id: 'grape_1', description: 'Place grapes', completed: false },
          { id: 'chicken_2', description: 'Place another chicken', completed: false },
          { id: 'sheep_2', description: 'Place another sheep', completed: false }
        ]
      },
      {
        level: 4,
        goals: [
          { id: 'cow_2', description: 'Place another cow', completed: false },
          { id: 'tomato_2', description: 'Place more tomatoes', completed: false },
          { id: 'corn_2', description: 'Place more corn', completed: false },
          { id: 'strawberry_2', description: 'Place more strawberries', completed: false },
          { id: 'grape_2', description: 'Place more grapes', completed: false }
        ]
      }
    ];

    this.currentGoals = [...this.levels[0].goals];
  }

  private createLevelUI(): void {
    this.updateLayoutValues(window.innerWidth);

    this.panel = new Graphics();
    this.addChild(this.panel);

    this.progressBackground = new Graphics();
    this.addChild(this.progressBackground);

    this.progressBar = new Graphics();
    this.addChild(this.progressBar);

    this.levelText = new Text(
        'Level 1',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: this.isMobile ? 18 : 24,
          fontWeight: 'bold',
          fill: '#FFD700',
          stroke: { color: '#000000', width: 3, join: 'round' }
        })
    );
    this.addChild(this.levelText);

    this.progressText = new Text(
        '0/1',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: this.isMobile ? 12 : 14,
          fontWeight: 'bold',
          fill: '#FFFFFF',
          stroke: { color: '#000000', width: 2, join: 'round' }
        })
    );
    this.progressText.anchor.set(0.5, 0.5);
    this.addChild(this.progressText);

    this.redrawStaticUI();
  }
  private updateLayoutValues(width: number): void {
    this.isMobile = width < 968;
    this.padding = this.isMobile ? 12 : 20;
    this.barWidth = this.isMobile ? 150 : 200;
    this.barHeight = this.isMobile ? 15 : 20;

    const positionPadding = this.isMobile ? 10 : 20;
    this.position.set(positionPadding, positionPadding);
  }
  private redrawStaticUI(): void {
    const panelWidth = this.isMobile ? 200 : 260;
    const panelHeight = this.isMobile ? 75 : 100;

    this.panel.clear();
    this.panel.fill(0x000000, 0.6);
    this.panel.roundRect(0, 0, panelWidth, panelHeight, 10);
    this.panel.endFill();

    this.progressBackground.clear();
    this.progressBackground.fill(0x333333, 0.8);
    this.progressBackground.roundRect(
        this.padding,
        this.padding + (this.isMobile ? 28 : 35),
        this.barWidth,
        this.barHeight,
        this.barHeight / 2
    );
    this.progressBackground.endFill();

    this.levelText.position.set(this.padding, this.padding);

    this.progressText.position.set(
        this.padding + this.barWidth / 2,
        this.padding + (this.isMobile ? 28 : 35) + this.barHeight / 2
    );
  }

  private setupEventListeners(): void {
    eventEmitter.on('LEVEL:GOAL_COMPLETED', (goalId: unknown) => {
      this.completeGoal(goalId as string);
    });

    eventEmitter.on('LEVEL:RESET', () => {
      this.resetProgress();
    });

    eventEmitter.on('LEVEL:RETRY_CURRENT', () => {
      this.retryCurrentLevel();
    });
  }

  private retryCurrentLevel(): void {
    this.itemService.restoreStartBalance();

    this.currentGoals.forEach(g => g.completed = false);
    this.updateDisplay();

    eventEmitter.emit('GRID:CLEAR_LEVEL_ITEMS');
    eventEmitter.emit('GRID_ITEMS:RETRY_LEVEL', this.currentLevel + 1);
  }

  private completeGoal(goalId: string): void {
    const goal = this.currentGoals.find(g => g.id === goalId);
    if (!goal || goal.completed) return;

    goal.completed = true;
    this.updateDisplay();

    const allCompleted = this.currentGoals.every(g => g.completed);
    if (allCompleted) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.itemService.addReward(this.currentLevel + 1);

    this.currentLevel++;
    this.audioService.playSound('sound_popup_chest', false);

    if (this.currentLevel < this.levels.length) {
      this.showLevelUpAnimation();

      gsap.delayedCall(2, () => {
        this.currentGoals = [...this.levels[this.currentLevel].goals];
        this.updateDisplay();

        this.itemService.saveStartBalance();

        eventEmitter.emit('GRID:UPDATE_LEVEL', this.currentLevel + 1);
        eventEmitter.emit('GRID_ITEMS:CHANGE_LEVEL', this.currentLevel + 1);
      });
    } else {
      gsap.delayedCall(1, () => {
        this.showCongratulationsPopup();
      });
    }
  }

  private showLevelUpAnimation(): void {
    if (this.levelUpAnimation) {
      this.removeChild(this.levelUpAnimation);
    }

    this.levelUpAnimation = new Container();

    const glow = new Graphics();
    glow.fill(0xFFD700, 0.3);
    glow.circle(0, 0, 100);
    glow.endFill();
    this.levelUpAnimation.addChild(glow);

    const levelNumber = new Text(
      (this.currentLevel + 1).toString(),
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 80,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 6, join: 'round' }
      })
    );
    levelNumber.anchor.set(0.5);
    this.levelUpAnimation.addChild(levelNumber);

    const levelUpText = new Text(
      'LEVEL UP!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#FFD700', width: 4, join: 'round' }
      })
    );
    levelUpText.anchor.set(0.5);
    levelUpText.position.set(0, -80);
    this.levelUpAnimation.addChild(levelUpText);

    this.levelUpAnimation.position.set(window.innerWidth / 2, window.innerHeight / 2);

    this.levelUpAnimation.alpha = 0;
    this.levelUpAnimation.scale.set(0.5);

    eventEmitter.emit('LEVEL:SHOW_ANIMATION', this.levelUpAnimation);

    gsap.to(this.levelUpAnimation, {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to(this.levelUpAnimation.scale, {
      x: 1.2,
      y: 1.2,
      duration: 0.5,
      ease: 'back.out(1.7)'
    });

    gsap.to(this.levelUpAnimation.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.5,
      delay: 0.5,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut'
    });

    gsap.to(this.levelUpAnimation, {
      alpha: 0,
      duration: 0.5,
      delay: 1.5,
      ease: 'power2.in',
      onComplete: () => {
        eventEmitter.emit('LEVEL:HIDE_ANIMATION');
        this.levelUpAnimation = null;
      }
    });
  }

  private createCongratulationsPopup(): Container {
    const isMobile = window.innerWidth < 968;

    const container = new Container();
    const popup = new Container();
    this.popupContainer = popup;
    this.congratsContainer = container;

    const overlay = new Graphics();
    overlay.fill(0x000000, 0.7);
    overlay.rect(0, 0, 3200, 3200);
    overlay.endFill();
    overlay.eventMode = 'static';
    overlay.cursor = 'default';
    overlay.on('pointerdown', (event) => event.stopPropagation());
    container.addChild(overlay);

    const popupBg = new Graphics();
    popup.addChild(popupBg);

    for (let i = 0; i < (isMobile ? 12 : 20); i++) {
      const star = new Graphics();
      star.fill(0xFFFF00, 0.8);
      star.star(0, 0, 5, isMobile ? 6 : 8);
      star.endFill();
      popup.addChild(star);
    }

    const title = new Text('CONGRATULATIONS!', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 28 : 48,
      fontWeight: 'bold',
      fill: '#FFD700',
      stroke: { color: '#000000', width: isMobile ? 4 : 6, join: 'round' }
    }));
    title.anchor.set(0.5);
    popup.addChild(title);

    const subtitle = new Text(
        isMobile ? 'You completed\nall levels!' : 'You completed all levels!',
        new TextStyle({
          fontFamily: 'Arial',
          fontSize: isMobile ? 20 : 28,
          fontWeight: 'bold',
          fill: '#FFFFFF',
          stroke: { color: '#000000', width: isMobile ? 3 : 4, join: 'round' },
          align: 'center'
        })
    );
    subtitle.anchor.set(0.5);
    popup.addChild(subtitle);

    const emoji = new Text('🎉 🌾 🐄 🐔 🌟', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 28 : 40
    }));
    emoji.anchor.set(0.5);
    popup.addChild(emoji);

    const desc = new Text('Your farm is now thriving!\nGreat job, farmer!', new TextStyle({
      fontFamily: 'Arial',
      fontSize: isMobile ? 16 : 24,
      fill: '#FFFFFF',
      stroke: { color: '#000000', width: isMobile ? 2 : 3, join: 'round' },
      align: 'center'
    }));
    desc.anchor.set(0.5);
    popup.addChild(desc);

    container.addChild(popup);
    container.alpha = 0;
    popup.scale.set(0.5);

    this.updateCongratulationsPopupPosition();

    return container;
  }
  private showCongratulationsPopup(): void {
    if (!this.congratsContainer) {
      this.createCongratulationsPopup();
    }

    if (!this.congratsContainer || !this.popupContainer) return;

    eventEmitter.emit('LEVEL:SHOW_ANIMATION', this.congratsContainer);
    this.audioService.playSound('sound_popup_chest', false);

    this.congratsContainer.alpha = 0;
    this.popupContainer.scale.set(0.5);

    gsap.to(this.congratsContainer, {
      alpha: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    gsap.to(this.popupContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });

    gsap.to(this.popupContainer, {
      rotation: 0.05,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }



  private updateDisplay(): void {
    this.levelText.text = `Level ${this.currentLevel + 1}`;

    const totalGoals = this.currentGoals.length;
    const completedGoals = this.currentGoals.filter(g => g.completed).length;
    const progress = totalGoals > 0 ? completedGoals / totalGoals : 0;

    this.progressBar.clear();
    this.progressBar.fill(0x4CAF50, 1);
    this.progressBar.roundRect(
        this.padding,
        this.padding + (this.isMobile ? 28 : 35),
        this.barWidth * progress,
        this.barHeight,
        this.barHeight / 2
    );
    this.progressBar.endFill();

    this.progressText.text = `${completedGoals}/${totalGoals}`;

    gsap.fromTo(
        this.progressBar,
        { alpha: 0.5 },
        { alpha: 1, duration: 0.3, ease: 'power2.out' }
    );
  }

  private resetProgress(): void {
    this.currentLevel = 0;
    this.currentGoals = [...this.levels[0].goals];
    this.currentGoals.forEach(g => g.completed = false);
    this.updateDisplay();
  }
  private updateCongratulationsPopupPosition(): void {
    if (!this.popupContainer) return;

    const isMobile = window.innerWidth < 968;
    const popupWidth = isMobile ? Math.min(window.innerWidth - 40, 340) : 500;
    const popupHeight = isMobile ? Math.min(window.innerHeight - 100, 360) : 400;
    const halfW = popupWidth / 2;
    const halfH = popupHeight / 2;

    this.popupContainer.position.set(window.innerWidth / 2, window.innerHeight / 2);

    let i = 0;
    let currentY = -halfH + (isMobile ? 40 : 50);

    for (const child of this.popupContainer.children) {
      if (child instanceof Graphics && i === 0) {
        child.clear();
        child.fill(0x4CAF50, 1);
        child.roundRect(-halfW, -halfH, popupWidth, popupHeight, isMobile ? 15 : 20);
        child.endFill();
        child.stroke({ width: isMobile ? 5 : 8, color: 0xFFD700 });
        child.roundRect(-halfW, -halfH, popupWidth, popupHeight, isMobile ? 15 : 20);
      } else if (child instanceof Graphics) {
        const star = child;
        star.position.set(
            -halfW + 20 + Math.random() * (popupWidth - 40),
            -halfH + 20 + Math.random() * (popupHeight - 40)
        );
      } else if (child instanceof Text) {
        const text = child;

        const textPadding = isMobile ? 14 : 24;
        const textHeight = text.height;

        text.anchor.set(0.5, 0);
        text.position.set(0, currentY);
        currentY += textHeight + textPadding;
      }
      i++;
    }
  }

  public resize(width: number): void {
    this.updateLayoutValues(width);
    this.redrawStaticUI();
    this.updateDisplay();

    this.updateCongratulationsPopupPosition();
  }



}
