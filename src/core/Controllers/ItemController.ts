import { EventBus } from './EventController';

export const ItemController = {
  balance: 90,
  levelStartBalance: 90,
  currentItemId: null as string | null,

  costs: {
    cow: 100,
    sheep: 70,
    chicken: 60,
    corn: 50,
    tomato: 45,
    strawberry: 40,
    grape: 35,
  } as Record<string, number>,

  rewards: {
    1: 200,
    2: 250,
    3: 300,
    4: 350,
  } as Record<number, number>,

  init(): void {
    EventBus.emit('BALANCE:UPDATED', this.balance);
  },

  addReward(level: number): void {
    const reward = this.rewards[level] || 200;
    this.balance += reward;
    EventBus.emit('BALANCE:UPDATED', this.balance);
  },

  saveStartBalance(): void {
    this.levelStartBalance = this.balance;
  },

  restoreStartBalance(): void {
    this.balance = this.levelStartBalance;
    EventBus.emit('BALANCE:UPDATED', this.balance);
  },

  spend(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      EventBus.emit('BALANCE:UPDATED', this.balance);
      return true;
    }
    return false;
  },

  getCost(itemType: string): number {
    return this.costs[itemType] || 70;
  },
};
