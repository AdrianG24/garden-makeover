import { Container, Graphics } from 'pixi.js';
import { SCREEN_BREAKPOINTS, ITEM_SELECTOR } from '../constants';

export class TutorialElementFinder {
  getActiveQuestionMark(questionMarkElements: Container[]): Container | null {
    for (let i = questionMarkElements.length - 1; i >= 0; i--) {
      const el = questionMarkElements[i];
      if (!el || !el.parent || !el.visible) continue;

      const bounds = el.getBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        return el;
      }
    }
    return null;
  }

  findItemSelectorPanels(parentContainer: Container): Container[] {
    const results: Container[] = [];

    const searchForPanels = (container: Container) => {
      if (container.children) {
        container.children.forEach((child) => {
          if (child instanceof Container) {
            const hasBackground = child.children.some(
              (c) => c instanceof Graphics
            );
            const bounds = child.getBounds();
            const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
            const expectedWidth = isMobile ? ITEM_SELECTOR.PANEL_MOBILE_WIDTH : ITEM_SELECTOR.PANEL_DESKTOP_WIDTH;

            if (
              hasBackground &&
              bounds.width > expectedWidth - 100 &&
              bounds.width < expectedWidth + 100 &&
              child.visible
            ) {
              results.push(child);
            }
            searchForPanels(child);
          }
        });
      }
    };

    searchForPanels(parentContainer);
    return results;
  }

  findSingleItemInPanel(panel: Container): Container | null {
    const items: Container[] = [];

    const searchForItems = (container: Container, depth: number = 0) => {
      if (depth > 5) return;

      container.children.forEach((child) => {
        if (child instanceof Container && child.visible) {
          const bounds = child.getBounds();
          const isMobile = window.innerWidth < SCREEN_BREAKPOINTS.TABLET;
          const expectedSize = isMobile ? ITEM_SELECTOR.ITEM_SIZE_MOBILE : ITEM_SELECTOR.ITEM_SIZE_DESKTOP;

          if (
            bounds.width > expectedSize - 30 &&
            bounds.width < expectedSize + 30 &&
            bounds.height > expectedSize - 30 &&
            bounds.height < expectedSize + 30
          ) {
            items.push(child);
          }

          searchForItems(child, depth + 1);
        }
      });
    };

    searchForItems(panel);

    return items.length > 0 ? items[items.length - 1] : null;
  }
}
