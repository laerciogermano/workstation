// O que a página usa para editar: as operações do Flow Editor e os ícones do editor FOP.
// Empacotado em dist/edit-core.js pelo `npm run build`.
export { createEditor } from '../../flow-editor/src/editor.ts';
export { apply, check, unitAt } from '../../flow-editor/src/ops.ts';
export { DATA_TYPES, find, freeName, isFn, names, walk } from '../../flow-editor/src/model.ts';
export { fromJson, toJson } from '../../flow-editor/src/serialize.ts';
export { toView } from '../../flow-editor/src/view-tree.ts';
export { icon } from '../../novo/icons.ts';
