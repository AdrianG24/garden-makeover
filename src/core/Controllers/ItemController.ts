import { EventBus } from './EventController';

export class ItemController {
  private static controllerInstance: ItemController;

  public currentlySelectedItemId: string | null = null;
  private balance: number = 0;
  private levelStartBalance: number = 0;

  private constructor() {
    this.calculateInitialBalance();
  }

  public static getInstance(): ItemController {
    if (!ItemController.controllerInstance) {
      ItemController.controllerInstance = new ItemController();
    }
    return ItemController.controllerInstance;
  }

  private calculateInitialBalance(): void {
    this.balance = 90;
    EventBus.emitEvent('BALANCE:UPDATED', this.balance);
  }

  public addLevelReward(level: number): void {
    const rewards: Record<number, number> = {
      1: 200,
      2: 250,
      3: 300,
      4: 350
    };
    const reward = rewards[level] || 200;
    this.addBalance(reward);
  }

  public saveLevelStartBalance(): void {
    this.levelStartBalance = this.balance;
  }

  public restoreLevelStartBalance(): void {
    this.balance = this.levelStartBalance;
    EventBus.emitEvent('BALANCE:UPDATED', this.balance);
  }

  public getBalance(): number {
    return this.balance;
  }

  public spendBalance(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      EventBus.emitEvent('BALANCE:UPDATED', this.balance);
      return true;
    }
    return false;
  }

  public addBalance(amount: number): void {
    this.balance += amount;
    EventBus.emitEvent('BALANCE:UPDATED', this.balance);
  }

  public getItemCost(itemType: string): number {
    const costs: Record<string, number> = {
      cow: 100,
      sheep: 70,
      chicken: 60,
      corn: 50,
      tomato: 45,
      strawberry: 40,
      grape: 35
    };
    return costs[itemType] || 70;
  }

}
