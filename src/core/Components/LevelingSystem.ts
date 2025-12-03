import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { EventBusService } from '../Services/EventBusService';
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

  constructor(
    private eventBus: EventBusService,
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
    const isMobile = window.innerWidth < 968;
    const panelWidth = isMobile ? 200 : 260;
    const panelHeight = isMobile ? 75 : 100;
    const padding = isMobile ? 12 : 20;
    const barWidth = isMobile ? 150 : 200;
    const barHeight = isMobile ? 15 : 20;
    const levelFontSize = isMobile ? 18 : 24;
    const progressFontSize = isMobile ? 12 : 14;

    const panel = new Graphics();
    panel.fill(0x000000, 0.6);
    panel.roundRect(0, 0, panelWidth, panelHeight, 10);
    panel.endFill();
    this.addChild(panel);

    this.levelText = new Text(
      'Level 1',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: levelFontSize,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 3, join: 'round' }
      })
    );
    this.levelText.position.set(padding, padding);
    this.addChild(this.levelText);

    this.progressBackground = new Graphics();
    this.progressBackground.fill(0x333333, 0.8);
    this.progressBackground.roundRect(
      padding,
      padding + (isMobile ? 28 : 35),
      barWidth,
      barHeight,
      barHeight / 2
    );
    this.progressBackground.endFill();
    this.addChild(this.progressBackground);

    this.progressBar = new Graphics();
    this.addChild(this.progressBar);

    this.progressText = new Text(
      '0/1',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: progressFontSize,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 2, join: 'round' }
      })
    );
    this.progressText.anchor.set(0.5, 0.5);
    this.progressText.position.set(
      padding + barWidth / 2,
      padding + (isMobile ? 28 : 35) + barHeight / 2
    );
    this.addChild(this.progressText);

    const positionPadding = isMobile ? 10 : 20;
    this.position.set(positionPadding, positionPadding);
  }

  private setupEventListeners(): void {
    this.eventBus.on('LEVEL:GOAL_COMPLETED', (goalId: unknown) => {
      this.completeGoal(goalId as string);
    });

    this.eventBus.on('LEVEL:RESET', () => {
      this.resetProgress();
    });

    this.eventBus.on('LEVEL:RETRY_CURRENT', () => {
      this.retryCurrentLevel();
    });
  }

  private retryCurrentLevel(): void {
    this.itemService.restoreStartBalance();

    this.currentGoals.forEach(g => g.completed = false);
    this.updateDisplay();

    this.eventBus.emit('GRID:CLEAR_LEVEL_ITEMS');
    this.eventBus.emit('GRID_ITEMS:RETRY_LEVEL', this.currentLevel + 1);
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

        this.eventBus.emit('GRID:UPDATE_LEVEL', this.currentLevel + 1);
        this.eventBus.emit('GRID_ITEMS:CHANGE_LEVEL', this.currentLevel + 1);
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

    this.eventBus.emit('LEVEL:SHOW_ANIMATION', this.levelUpAnimation);

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
        this.eventBus.emit('LEVEL:HIDE_ANIMATION');
        this.levelUpAnimation = null;
      }
    });
  }

  private showCongratulationsPopup(): void {
    const congratsContainer = new Container();
    const isMobile = window.innerWidth < 968;

    const overlay = new Graphics();
    overlay.fill(0x000000, 0.7);
    overlay.rect(0, 0, 3200, 3200);
    overlay.endFill();
    overlay.eventMode = 'static';
    overlay.cursor = 'default';
    overlay.on('pointerdown', (event) => {
      event.stopPropagation();
    });
    congratsContainer.addChild(overlay);

    const popupContainer = new Container();
    popupContainer.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const popupWidth = isMobile ? Math.min(window.innerWidth - 40, 340) : 500;
    const popupHeight = isMobile ? Math.min(window.innerHeight - 100, 360) : 400;
    const halfWidth = popupWidth / 2;
    const halfHeight = popupHeight / 2;

    const popupBg = new Graphics();
    popupBg.fill(0x4CAF50, 1);
    popupBg.roundRect(-halfWidth, -halfHeight, popupWidth, popupHeight, isMobile ? 15 : 20);
    popupBg.endFill();

    popupBg.stroke({ width: isMobile ? 5 : 8, color: 0xFFD700 });
    popupBg.roundRect(-halfWidth, -halfHeight, popupWidth, popupHeight, isMobile ? 15 : 20);
    popupContainer.addChild(popupBg);

    const starCount = isMobile ? 12 : 20;
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      star.fill(0xFFFF00, 0.8);
      star.star(-halfWidth + 20 + Math.random() * (popupWidth - 40), -halfHeight + 20 + Math.random() * (popupHeight - 40), 5, isMobile ? 6 : 8);
      star.endFill();
      popupContainer.addChild(star);
    }

    const congratsTitle = new Text(
      'CONGRATULATIONS!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 28 : 48,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: isMobile ? 4 : 6, join: 'round' }
      })
    );
    congratsTitle.anchor.set(0.5);
    congratsTitle.position.set(0, isMobile ? -halfHeight + 60 : -100);
    popupContainer.addChild(congratsTitle);

    const successText = new Text(
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
    successText.anchor.set(0.5);
    successText.position.set(0, isMobile ? -10 : -20);
    popupContainer.addChild(successText);

    const farmText = new Text(
      '🎉 🌾 🐄 🐔 🌟',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 28 : 40
      })
    );
    farmText.anchor.set(0.5);
    farmText.position.set(0, isMobile ? 50 : 40);
    popupContainer.addChild(farmText);

    const descText = new Text(
      'Your farm is now thriving!\nGreat job, farmer!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: isMobile ? 16 : 24,
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: isMobile ? 2 : 3, join: 'round' },
        align: 'center'
      })
    );
    descText.anchor.set(0.5);
    descText.position.set(0, isMobile ? halfHeight - 50 : 110);
    popupContainer.addChild(descText);

    congratsContainer.addChild(popupContainer);

    this.eventBus.emit('LEVEL:SHOW_ANIMATION', congratsContainer);
    this.audioService.playSound('sound_popup_chest', false);

    congratsContainer.alpha = 0;
    popupContainer.scale.set(0.5);

    gsap.to(congratsContainer, {
      alpha: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    gsap.to(popupContainer.scale, {
      x: 1,
      y: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });

    gsap.to(popupContainer, {
      rotation: 0.05,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

  }

  private updateDisplay(): void {
    this.levelText.text = `Level ${this.currentLevel + 1}`;

    const isMobile = window.innerWidth < 968;
    const padding = isMobile ? 12 : 20;
    const barWidth = isMobile ? 150 : 200;
    const barHeight = isMobile ? 15 : 20;

    const totalGoals = this.currentGoals.length;
    const completedGoals = this.currentGoals.filter(g => g.completed).length;
    const progress = totalGoals > 0 ? completedGoals / totalGoals : 0;

    this.progressBar.clear();
    this.progressBar.fill(0x4CAF50, 1);
    this.progressBar.roundRect(
      padding,
      padding + (isMobile ? 28 : 35),
      barWidth * progress,
      barHeight,
      barHeight / 2
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

  public resize(width: number): void {
    const isMobile = width < 968;
    const positionPadding = isMobile ? 10 : 20;
    this.position.set(positionPadding, positionPadding);

    this.removeChildren();
    this.createLevelUI();
    this.updateDisplay();
  }

}
