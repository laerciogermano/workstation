// A árvore de entrada: funções e blocos, na ordem em que acontecem.

export type BlockType = 'if' | 'else' | 'switch' | 'case' | 'for' | 'while' | 'do-while' | 'try' | 'catch';
export type SourceKind = 'file' | 'person' | 'ai' | 'machine' | 'object';

/** Responsável: a origem sólida da função. */
export interface Source {
  kind: SourceKind;
  name: string;
  /** Só em `file`: o arquivo como objeto, uma caixa no estado com as funções e os dados dele. */
  asObject?: boolean;
}

/** Pública é acessada de fora do arquivo; privada, só dentro. */
export type Access = 'public' | 'private';
/** Padrão de projeto: `factory` cria e devolve um objeto; `singleton` é a instância única e compartilhada. */
export type Pattern = 'factory' | 'singleton';

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
  visibility?: Access;
  pattern?: Pattern;
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
  /** Instância única (saída de um `singleton`): a marca ganha um segundo contorno. */
  shared?: boolean;
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
  visibility?: Access;
  pattern?: Pattern;
  /** Pedida para rodar junto da anterior. */
  parallel?: boolean;
  in?: DataPoint;
  out?: DataPoint;
}

export interface StateItem {
  name: string;
  kind: 'function' | 'data' | 'object';
  shared?: boolean;
  /** 0 no estado; 1 ou mais para campos de um objeto, logo abaixo dele. */
  level: number;
  solid: boolean;
  value?: string;
  /** Primeiro passo em que está disponível. */
  since: number;
  /** Função do próprio fluxo (disponível desde s0): o desenho só a lista com `stateFunctions`. */
  catalog?: boolean;
}

/** Um dado que sai de uma folha e entra em outra no passo seguinte (índices das linhas). */
export interface DataLink {
  from: number;
  to: number;
  names: string[];
}

export interface LayoutOptions {
  /** O `else` ocupa o mesmo passo do `if` (padrão: vem depois dele). */
  elseParallel?: boolean;
}

export interface FlowLayout {
  rows: Row[];
  /** Quantidade de passos; os limites vão de s0 a s{steps}. */
  steps: number;
  /** Ordenado por `since`: o estado do passo k é o começo da lista. */
  state: StateItem[];
  /** Na ordem de quem recebe. */
  links: DataLink[];
  maxDepth: number;
  /** Maior linha da coluna de funções, já contando o recuo (em caracteres). */
  labelWidth: number;
  /** Maior nome de folha (em caracteres): define a largura do passo. */
  leafWidth: number;
}
