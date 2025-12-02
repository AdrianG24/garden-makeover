import { Signal } from 'micro-signals';

const signals: Record<string, Signal<unknown>> = {};

function getSignal(eventName: string): Signal<unknown> {
  if (!signals[eventName]) {
    signals[eventName] = new Signal();
  }
  return signals[eventName];
}

export const EventBus = {
  on(eventName: string, handler: (payload: unknown) => void): void {
    getSignal(eventName).add(handler);
  },

  once(eventName: string, handler: (payload: unknown) => void): void {
    getSignal(eventName).addOnce(handler);
  },

  off(eventName: string, handler: (payload: unknown) => void): void {
    getSignal(eventName).remove(handler);
  },

  emit(eventName: string, payload?: unknown): void {
    getSignal(eventName).dispatch(payload);
  },
};
