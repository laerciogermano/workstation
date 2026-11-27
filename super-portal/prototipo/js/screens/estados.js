/* M · Estados do sistema e primeiros passos. F34 · Atalhos. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
SP.screen('atalhos', { code: 'F34', nome: 'Atalhos de teclado', flow: 'B', pai: 'hoje', base: 'hoje', modal: { type: 'atalhos' }, src: ['novo:Uso por teclado'], nota: 'Abra com “?”. Navegação, listas e fila sem tirar as mãos do teclado.', render: () => ({}) });
const lista = (code, key, nome, estado, nota, src) => SP.screen(key, { code, nome, flow: 'M', estado, nota, src, render: ctx => SP.screens.pedLista.render(ctx) });
lista('F41', 'estCarregando', 'Carregando', 'lenta', 'Esqueleto com o formato do conteúdo, sem salto de layout.', ['novo:Esqueleto de carregamento']);
lista('F31', 'estOffline', 'Sem conexão', 'offline', 'A tela continua útil; as ações ficam na fila e são enviadas ao reconectar.', ['novo:Trabalho sem conexão']);
lista('F42', 'estErro', 'Falha com recuperação', 'erro', 'Diz o que aconteceu, que nada se perdeu e como seguir, com código para o suporte.', ['novo:Erro com saída']);
SP.screen('comecar', { code: 'F43', nome: 'Primeiros passos', flow: 'M', src: ['visao:White-label', 'visao:Migração', 'novo:Ativação guiada'], nota: 'Marca nova entra com um roteiro calculado do que falta, em vez de um painel vazio.',
  render() {
    const t = SP.tenant(), ok = k => db().integracoes.find(i => i.id === k)?.ok;
    const p = [['Configurar a marca', 'Logo, cores, domínio e textos', !!(t.logo || t.id !== 't1') && !!t.cor, 'marca'], ['Cadastrar CNPJ emitente', t.cnpjs.length ? t.cnpjs.join(' · ') : 'Nenhum ainda', t.cnpjs.length > 0, 'marca'], ['Instalar o certificado da SEFAZ', 'Para emitir notas', ok('i1'), 'integracoes'], ['Conectar o banco', 'Boletos, Pix e baixa automática', ok('i2'), 'integracoes'], ['Trazer os dados do portal anterior', 'Orçamentos, pedidos, notas e títulos', ok('i6'), 'integracoes'], ['Convidar a equipe', db().vendedores.filter(v => v.ativo).length + ' vendedores ativos', db().vendedores.some(v => v.ativo), 'vendedores'], ['Revisar as regras automáticas', db().regras.filter(r => r.ligada).length + ' ligadas', db().regras.some(r => r.ligada), 'automacoes']];
    const n = p.filter(x => x[2]).length, prox = p.find(x => !x[2]);
    return { titulo: 'Primeiros passos', sub: `${n} de ${p.length} concluídos`, corpo: SP.card(`${SP.barra(Math.round(n / p.length * 100))}<ol class="roteiro">${p.map(([a, b, f, go]) => `<li class="${f ? 'feito' : prox?.[0] === a ? 'agora' : ''}"><i>${f ? I('check', 14) : ''}</i><div><b>${a}</b><small>${e(b)}</small></div>${SP.btn(f ? 'Revisar' : 'Fazer agora', { go, sm: true, kind: prox?.[0] === a ? 'primary' : f ? 'quiet' : 'ghost' })}</li>`).join('')}</ol>`, { cls: 'estreito' }) };
  } });
SP.screen('estVazio', { code: 'F20', nome: 'Primeira vez (sem dados)', flow: 'M', src: ['novo:Tela vazia que orienta'], nota: 'Vazio com caminho: criar, importar ou receber por e-mail.',
  render: () => ({ titulo: 'Pedidos', corpo: SP.card(`<div class="vazio">${I('cart', 34)}<b>Seu primeiro pedido começa aqui</b><p>Crie um orçamento, traga o histórico do portal anterior ou peça ao cliente que envie a ordem de compra por e-mail.</p><div class="row centro">${SP.btn('Criar orçamento', { go: 'orcNovo', kind: 'primary', icon: 'plus' })}${SP.btn('Importar do portal anterior', { go: 'integracoes', icon: 'download' })}</div></div>`) }) });
})();
