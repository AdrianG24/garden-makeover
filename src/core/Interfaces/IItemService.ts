export interface IItemService {
  readonly balance: number;
  readonly currentItemId: string | null;

  init(): void;
  addReward(level: number): void;
  saveStartBalance(): void;
  restoreStartBalance(): void;
  spend(amount: number): boolean;
  getCost(itemType: string): number;
  setCurrentItemId(id: string | null): void;
}
