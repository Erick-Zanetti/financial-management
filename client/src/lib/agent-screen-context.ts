export interface ScreenContextState {
  route: string;
  year?: number;
  month?: number;
}

let current: ScreenContextState = { route: '/' };

export function publishScreenContext(ctx: Partial<ScreenContextState>): void {
  current = { ...current, ...ctx };
}

export function getScreenContext(): ScreenContextState {
  return current;
}
