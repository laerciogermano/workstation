// A árvore de entrada: funções e blocos, na ordem em que acontecem.

export type BlockType = 'if' | 'else' | 'switch' | 'case' | 'for' | 'while' | 'do-while' | 'try' | 'catch';
export type SourceKind = 'file' | 'person' | 'ai' | 'machine' | 'object';

/** Responsável: a origem sólida da função. */
export interface Source {
  kind: SourceKind;
  name: string;
}

/**
 * Um dado, pelo nome (endereço), com valor opcional. Com `fields` é um objeto: no desenho aparece o nome dele,
 * e os campos ficam como filhos no estado.
 */
export type Data = string | { name: string; value?: string | number | boolean | null; fields?: Data[]; /** Função usada como dado: um círculo. */ function?: boolean };

export interface FlowFunction {
  type?: 'fn';
  /** Identidade estável: mantém a função minimizada quando a árvore é trocada. */
  id?: string;
  name: string;
  in?: Data[];
  out?: Data[];
  /** Dados declarados nesta função, sem passar por entrada ou saída: entram no estado quando ela começa. */
  data?: Data[];
  /** Ausente: o arquivo mais próximo acima (na raiz, o nome dela). `null`: função abstrata (sem endereço). */
  source?: Source | null;
  /** Ocupa o mesmo passo da irmã anterior. */
  parallel?: boolean;
  children?: FlowNode[];
}

export interface FlowBlock {
  type: BlockType;
  id?: string;
  /** Condição ou laço, como aparece no rótulo: "aprovada", "item of itens". */
  label?: string;
  parallel?: boolean;
  children?: FlowNode[];
}

export type FlowNode = FlowFunction | FlowBlock;

// ---------- resultado do cálculo ----------

export interface DataPoint {
  /** Só o nome vai ao lado da marca, mesmo quando é um objeto. */
  name: string;
  /** Um quadrado (dado), um cubo (objeto) ou um círculo (função usada como dado). */
  kind: 'data' | 'object' | 'function';
  /** Preenchido quando há endereço: produzido no fluxo ou com valor. */
  solid: boolean;
}

export interface Row {
  index: number;
  /** O nó de origem na árvore recebida. */
  node: FlowNode;
  /** -1 na raiz. */
  parent: number;
  /** Índice da última linha da subárvore. */
  last: number;
  depth: number;
  /** Quantos blocos há acima desta linha. */
  nest: number;
  kind: 'fn' | BlockType;
  name: string;
  /** Passos: a linha vai do limite `start` ao limite `end`. */
  start: number;
  end: number;
  composite: boolean;
  abstract: boolean;
  /** null em blocos e em funções abstratas. */
  source: Source | null;
  in?: DataPoint;
  out?: DataPoint;
}

export interface StateItem {
  name: string;
  kind: 'function' | 'data' | 'object';
  /** 0 no estado; 1 ou mais para campos de um objeto, logo abaixo dele. */
  level: number;
  solid: boolean;
  value?: string;
  /** Primeiro passo em que está disponível. */
  since: number;
}

export interface FlowLayout {
  rows: Row[];
  /** Quantidade de passos; os limites vão de s0 a s{steps}. */
  steps: number;
  /** Ordenado por `since`: o estado do passo k é o começo da lista. */
  state: StateItem[];
  maxDepth: number;
  /** Maior rótulo da coluna de funções, já contando o recuo (em caracteres). */
  labelWidth: number;
}
