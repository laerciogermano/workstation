import type { FlowNode } from '../src/index.ts';
export declare const SAMPLES: Record<'estado' | 'sequencial' | 'objeto' | 'ifElse' | 'switch' | 'blocos' | 'abstrata' | 'responsaveis', { title: string; tree: FlowNode }>;
export declare function largeFlow(total: number): FlowNode;
