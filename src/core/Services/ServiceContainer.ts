import { IEventBus } from '../Interfaces/IEventBus';
import { IItemService } from '../Interfaces/IItemService';
import { IAudioService } from '../Interfaces/IAudioService';

export class ServiceContainer {
  private services: Map<string, unknown> = new Map();

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }

  getEventBus(): IEventBus {
    return this.get<IEventBus>('EventBus');
  }

  getItemService(): IItemService {
    return this.get<IItemService>('ItemService');
  }

  getAudioService(): IAudioService {
    return this.get<IAudioService>('AudioService');
  }
}
