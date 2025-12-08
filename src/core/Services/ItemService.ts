import { eventEmitter } from './EventBusService';

export class ItemService {
  balance: number = 0;
  levelStartBalance: number = 0;
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

  constructor() {}

  addMoney(amount: number): void {
    this.balance += amount;
    eventEmitter.emit('BALANCE:UPDATED', this.balance);
  }

  saveStartBalance(): void {
    this.levelStartBalance = this.balance;
  }

  restoreStartBalance(): void {
    this.balance = this.levelStartBalance;
    eventEmitter.emit('BALANCE:UPDATED', this.balance);
  }

  spend(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      eventEmitter.emit('BALANCE:UPDATED', this.balance);
      return true;
    }
    return false;
  }

  getCost(itemType: string): number {
    return this.costs[itemType] || 70;
  }
}
