export const ACCENTS = ['cyan', 'magenta', 'yellow', 'green', 'violet'] as const;
export type Accent = (typeof ACCENTS)[number];
export const accentVar = (a: Accent): string => `var(--rg-${a})`;
