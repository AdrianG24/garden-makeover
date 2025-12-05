import EventEmitter from 'eventemitter3';

export class EventBusService {
  private emitter = new EventEmitter();

  on<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.emitter.on(eventName, handler);
  }

  once<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.emitter.once(eventName, handler);
  }

  off<T = unknown>(eventName: string, handler: (payload: T) => void): void {
    this.emitter.off(eventName, handler);
  }

  emit<T = unknown>(eventName: string, payload?: T): void {
    this.emitter.emit(eventName, payload);
  }
}
