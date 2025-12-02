import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { EventBus } from '../Controllers/EventController';
import { playSoundEffect } from '../Utils/AudioManager';


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

  private readonly BAR_WIDTH = 200;
  private readonly BAR_HEIGHT = 20;
  private readonly PADDING = 20;

  constructor() {
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
    const panel = new Graphics();
    panel.fill(0x000000, 0.6);
    panel.roundRect(0, 0, 260, 100, 10);
    panel.endFill();
    this.addChild(panel);

    this.levelText = new Text(
      'Level 1',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 3, join: 'round' }
      })
    );
    this.levelText.position.set(this.PADDING, this.PADDING);
    this.addChild(this.levelText);

    this.progressBackground = new Graphics();
    this.progressBackground.fill(0x333333, 0.8);
    this.progressBackground.roundRect(
      this.PADDING,
      this.PADDING + 35,
      this.BAR_WIDTH,
      this.BAR_HEIGHT,
      this.BAR_HEIGHT / 2
    );
    this.progressBackground.endFill();
    this.addChild(this.progressBackground);

    this.progressBar = new Graphics();
    this.addChild(this.progressBar);

    this.progressText = new Text(
      '0/1',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 2, join: 'round' }
      })
    );
    this.progressText.anchor.set(0.5, 0.5);
    this.progressText.position.set(
      this.PADDING + this.BAR_WIDTH / 2,
      this.PADDING + 35 + this.BAR_HEIGHT / 2
    );
    this.addChild(this.progressText);

    this.position.set(20, 20);
  }

  private setupEventListeners(): void {
    EventBus.attachListener('LEVEL:GOAL_COMPLETED', (goalId: string) => {
      this.completeGoal(goalId);
    });

    EventBus.attachListener('LEVEL:RESET', () => {
      this.resetProgress();
    });
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
    this.currentLevel++;
    playSoundEffect('sound_popup_chest', false);

    this.showLevelUpAnimation();

    if (this.currentLevel < this.levels.length) {
      setTimeout(() => {
        this.currentGoals = [...this.levels[this.currentLevel].goals];
        this.updateDisplay();

        EventBus.emitEvent('GRID_ITEMS:CHANGE_LEVEL', this.currentLevel + 1);

      }, 2000);
    } else {
      setTimeout(() => {
        this.showCongratulationsPopup();
      }, 2000);
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

    EventBus.emitEvent('LEVEL:SHOW_ANIMATION', this.levelUpAnimation);

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
        EventBus.emitEvent('LEVEL:HIDE_ANIMATION');
        this.levelUpAnimation = null;
      }
    });
  }

  private showCongratulationsPopup(): void {
    const congratsContainer = new Container();

    const overlay = new Graphics();
    overlay.fill(0x000000, 0.7);
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.endFill();
    congratsContainer.addChild(overlay);

    const popupContainer = new Container();
    popupContainer.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const popupBg = new Graphics();
    popupBg.fill(0x4CAF50, 1);
    popupBg.roundRect(-250, -200, 500, 400, 20);
    popupBg.endFill();

    popupBg.stroke({ width: 8, color: 0xFFD700 });
    popupBg.roundRect(-250, -200, 500, 400, 20);
    popupContainer.addChild(popupBg);

    for (let i = 0; i < 20; i++) {
      const star = new Graphics();
      star.fill(0xFFFF00, 0.8);
      star.star(-230 + Math.random() * 460, -180 + Math.random() * 360, 5, 8);
      star.endFill();
      popupContainer.addChild(star);
    }

    const congratsTitle = new Text(
      'CONGRATULATIONS!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#FFD700',
        stroke: { color: '#000000', width: 6, join: 'round' }
      })
    );
    congratsTitle.anchor.set(0.5);
    congratsTitle.position.set(0, -100);
    popupContainer.addChild(congratsTitle);

    const successText = new Text(
      'You completed all levels!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 4, join: 'round' }
      })
    );
    successText.anchor.set(0.5);
    successText.position.set(0, -20);
    popupContainer.addChild(successText);

    const farmText = new Text(
      '🎉 🌾 🐄 🐔 🌟',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 40
      })
    );
    farmText.anchor.set(0.5);
    farmText.position.set(0, 40);
    popupContainer.addChild(farmText);

    const descText = new Text(
      'Your farm is now thriving!\nGreat job, farmer!',
      new TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 3, join: 'round' },
        align: 'center'
      })
    );
    descText.anchor.set(0.5);
    descText.position.set(0, 110);
    popupContainer.addChild(descText);

    congratsContainer.addChild(popupContainer);

    EventBus.emitEvent('LEVEL:SHOW_ANIMATION', congratsContainer);
    playSoundEffect('sound_popup_chest', false);

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

    const totalGoals = this.currentGoals.length;
    const completedGoals = this.currentGoals.filter(g => g.completed).length;
    const progress = totalGoals > 0 ? completedGoals / totalGoals : 0;

    this.progressBar.clear();
    this.progressBar.fill(0x4CAF50, 1);
    this.progressBar.roundRect(
      this.PADDING,
      this.PADDING + 35,
      this.BAR_WIDTH * progress,
      this.BAR_HEIGHT,
      this.BAR_HEIGHT / 2
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

}
