import { EventBusService } from './EventBusService';

export class ItemService {
  balance: number = 90;
  levelStartBalance: number = 90;
  currentItemId: string | null = null;

  private readonly costs: Record<string, number> = {
    cow: 100,
    sheep: 70,
    chicken: 60,
    corn: 50,
    tomato: 45,
    strawberry: 40,
    grape: 35,
  };

  private readonly rewards: Record<number, number> = {
    1: 200,
    2: 250,
    3: 300,
    4: 350,
  };

  constructor(private eventBus: EventBusService) {}

  addReward(level: number): void {
    const reward = this.rewards[level] || 200;
    this.balance += reward;
    this.eventBus.emit('BALANCE:UPDATED', this.balance);
  }

  saveStartBalance(): void {
    this.levelStartBalance = this.balance;
  }

  restoreStartBalance(): void {
    this.balance = this.levelStartBalance;
    this.eventBus.emit('BALANCE:UPDATED', this.balance);
  }

  spend(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      this.eventBus.emit('BALANCE:UPDATED', this.balance);
      return true;
    }
    return false;
  }

  getCost(itemType: string): number {
    return this.costs[itemType] || 70;
  }
}
