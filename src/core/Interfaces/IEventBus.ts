export interface IEventBus {
  on<T = unknown>(eventName: string, handler: (payload: T) => void): void;
  once<T = unknown>(eventName: string, handler: (payload: T) => void): void;
  off<T = unknown>(eventName: string, handler: (payload: T) => void): void;
  emit<T = unknown>(eventName: string, payload?: T): void;
}
