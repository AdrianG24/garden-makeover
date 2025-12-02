import { Signal } from 'micro-signals';

interface SignalMap {
  [eventName: string]: Signal<unknown>;
}

interface EventRecord {
  eventName: string;
  payload: unknown;
  timestamp: Date;
}

export class EventController {
  private static controllerInstance: EventController;

  private signalMap: SignalMap = {};
  private eventRecordList: EventRecord[] = [];
  private listenerCountMap: { [eventName: string]: number } = {};

  private constructor() {}

  public static getInstance(): EventController {
    if (!EventController.controllerInstance) {
      EventController.controllerInstance = new EventController();
    }
    return EventController.controllerInstance;
  }

  private getOrCreateSignal(eventName: string): Signal<unknown> {
    if (!this.signalMap[eventName]) {
      this.signalMap[eventName] = new Signal();
      this.listenerCountMap[eventName] = 0;
    }
    return this.signalMap[eventName];
  }

  private attachCustomListener(
    eventName: string,
    handlerFunction: (payload: unknown) => void,
    triggerValue: string,
    shouldRemoveAfterTrigger: boolean
  ): void {
    const wrappedHandler = (payload: unknown): void => {
      if (String(payload) === triggerValue) {
        if (shouldRemoveAfterTrigger) {
          this.removeListener(eventName, wrappedHandler);
        }
        handlerFunction(payload);
      }
    };
    this.getOrCreateSignal(eventName).add(wrappedHandler);
    this.listenerCountMap[eventName]++;
  }

  public attachOnceListener(eventName: string, handlerFunction: (payload: unknown) => void): void {
    const [signalName, customTrigger] = eventName.split('|');

    if (customTrigger) {
      this.attachCustomListener(signalName, handlerFunction, customTrigger, true);
    } else {
      this.getOrCreateSignal(signalName).addOnce(handlerFunction);
      this.listenerCountMap[signalName]++;
    }
  }

  public attachListener(eventName: string, handlerFunction: (payload: unknown) => void): void {
    const [signalName, customTrigger] = eventName.split('|');

    if (customTrigger) {
      this.attachCustomListener(signalName, handlerFunction, customTrigger, false);
    } else {
      this.getOrCreateSignal(signalName).add(handlerFunction);
      this.listenerCountMap[signalName]++;
    }
  }
  public removeListener(eventName: string, handlerFunction: (payload: unknown) => void): void {
    this.getOrCreateSignal(eventName).remove(handlerFunction);
    this.listenerCountMap[eventName]--;
  }

  public emitEvent(eventName: string, payload?: unknown): void {
    this.getOrCreateSignal(eventName).dispatch(payload);

    this.eventRecordList.push({
      eventName,
      payload,
      timestamp: new Date(),
    });
  }
}

export const EventBus = EventController.getInstance();
