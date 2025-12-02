
export class ItemController {
  private static controllerInstance: ItemController;

  public currentlySelectedItemId: string | null = null;

  private constructor() {}

  public static getInstance(): ItemController {
    if (!ItemController.controllerInstance) {
      ItemController.controllerInstance = new ItemController();
    }
    return ItemController.controllerInstance;
  }

}
