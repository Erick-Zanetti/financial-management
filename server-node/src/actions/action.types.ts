import { z } from 'zod';

export type ActionMode = 'read' | 'write';

export interface AppAction<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  mode: ActionMode;
  inputSchema: S;
  // Method syntax (not arrow property) keeps AppAction<Concrete> assignable
  // to AppAction<ZodTypeAny> — bivariant parameter check.
  run(input: z.infer<S>): Promise<unknown>;
}

export function defineAction<S extends z.ZodTypeAny>(
  action: AppAction<S>,
): AppAction<S> {
  return action;
}
