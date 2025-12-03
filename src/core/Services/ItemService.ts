import { IItemService } from '../Interfaces/IItemService';
import { IEventBus } from '../Interfaces/IEventBus';

export class ItemService implements IItemService {
  private _balance: number = 90;
  private levelStartBalance: number = 90;
  private _currentItemId: string | null = null;

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

  constructor(private eventBus: IEventBus) {}

  get balance(): number {
    return this._balance;
  }

  get currentItemId(): string | null {
    return this._currentItemId;
  }

  setCurrentItemId(id: string | null): void {
    this._currentItemId = id;
  }

  init(): void {
    this.eventBus.emit('BALANCE:UPDATED', this._balance);
  }

  addReward(level: number): void {
    const reward = this.rewards[level] || 200;
    this._balance += reward;
    this.eventBus.emit('BALANCE:UPDATED', this._balance);
  }

  saveStartBalance(): void {
    this.levelStartBalance = this._balance;
  }

  restoreStartBalance(): void {
    this._balance = this.levelStartBalance;
    this.eventBus.emit('BALANCE:UPDATED', this._balance);
  }

  spend(amount: number): boolean {
    if (this._balance >= amount) {
      this._balance -= amount;
      this.eventBus.emit('BALANCE:UPDATED', this._balance);
      return true;
    }
    return false;
  }

  getCost(itemType: string): number {
    return this.costs[itemType] || 70;
  }
}
