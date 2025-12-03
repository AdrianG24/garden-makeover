import { Signal } from 'micro-signals';

export class EventBusService {
  private signals: Map<string, Signal<unknown>> = new Map();

  private getSignal(eventName: string): Signal<unknown> {
    if (!this.signals.has(eventName)) {
      this.signals.set(eventName, new Signal());
    }
    return this.signals.get(eventName)!;
  }

  on<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.getSignal(eventName).add(handler as (payload: unknown) => void);
  }

  once<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.getSignal(eventName).addOnce(handler as (payload: unknown) => void);
  }

  off<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.getSignal(eventName).remove(handler as (payload: unknown) => void);
  }

  emit<T = unknown>(eventName: string, payload?: T): void {
    this.getSignal(eventName).dispatch(payload);
  }
}
