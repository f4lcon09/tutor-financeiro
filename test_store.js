/* Testes da camada de dados (sem DOM). Rodar: node test_store.js */
const S = require('./store.js');
let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const mem = () => { const o = {}; return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, _o: o }; };
const HOJE = new Date(2026, 10, 5);   // 05/11/2026 (mês 10 = novembro)
const novo = (m) => S.criarStore(m || mem(), () => HOJE);
const base = { tipo: 'gasto', valor: '45,50', desc: 'Compra', cat: 'Mercado', data: '2026-11-05', forma: 'Pix', essencial: true, lazer: false };

/* lerNumero */
t('lerNumero 13,07', S.lerNumero('13,07') === 13.07);
t('lerNumero 1.234,56', S.lerNumero('1.234,56') === 1234.56);
t('lerNumero 13.07', S.lerNumero('13.07') === 13.07);
t('lerNumero R$ 10', S.lerNumero('R$ 10') === 10);
t('lerNumero vazio e lixo', isNaN(S.lerNumero('')) && isNaN(S.lerNumero('abc')) && isNaN(S.lerNumero(null)));
t('lerNumero número', S.lerNumero(7) === 7);

/* dataValida */
t('data válida', S.dataValida('2026-02-28') === true);
t('data 30 de fevereiro é inválida', S.dataValida('2026-02-30') === false);
t('data com formato errado', S.dataValida('05/11/2026') === false && S.dataValida('') === false && S.dataValida(undefined) === false);

/* sugerir */
t('Mercado é essencial', S.sugerir('Mercado').essencial === true && S.sugerir('Mercado').lazer === false);
t('Lazer é lazer', S.sugerir('Lazer').lazer === true && S.sugerir('Lazer').essencial === false);
t('Comida fora é lazer', S.sugerir('Comida', 'pizza').lazer === true);
t('Comida de mercado é essencial', S.sugerir('Comida', 'feira do bairro').essencial === true);
t('Outros: pede decisão', S.sugerir('Outros').essencial === false && S.sugerir('Outros').lazer === false && /Em dúvida/.test(S.sugerir('Outros').texto));

/* validarLancamento */
t('lançamento válido', S.validarLancamento(base).ok === true);
t('valor zero é erro', S.validarLancamento({ ...base, valor: '0' }).erros.valor !== undefined);
t('valor vazio é erro', S.validarLancamento({ ...base, valor: '' }).erros.valor !== undefined);
t('data inválida é erro', S.validarLancamento({ ...base, data: '2026-13-01' }).erros.data !== undefined);
t('categoria inválida é erro', S.validarLancamento({ ...base, cat: 'Xis' }).erros.cat !== undefined);

/* lançar, editar, apagar, desfazer */
{
  const m = mem(), s = novo(m);
  const r = s.lancar(base);
  t('lançar ok', r.ok && s.st.lanc.length === 1 && s.st.lanc[0].valor === 45.5);
  t('lançar grava no armazenamento', JSON.parse(m._o.tf_lanc3).length === 1);
  const s2 = novo(m);
  t('persistência: outro store lê o lançamento', s2.st.lanc.length === 1 && s2.st.lanc[0].desc === 'Compra');
  t('lançar inválido não grava', s.lancar({ ...base, valor: '' }).ok === false && s.st.lanc.length === 1);
  const e = s.editar(r.id, { ...base, valor: '50', desc: 'Compra grande' });
  t('editar ok', e.ok && s.st.lanc[0].valor === 50 && s.st.lanc[0].desc === 'Compra grande' && s.st.lanc[0].id === r.id);
  t('editar inexistente falha', s.editar(999, base).ok === false);
  t('editar inválido falha e não muda', s.editar(r.id, { ...base, valor: 'x' }).ok === false && s.st.lanc[0].valor === 50);
  const ap = s.apagar(r.id);
  t('apagar devolve o item', ap && ap.valor === 50 && s.st.lanc.length === 0);
  t('desfazer apagar', s.desfazerApagar(ap) === true && s.st.lanc.length === 1);
  t('desfazer duas vezes não duplica', s.desfazerApagar(ap) === false && s.st.lanc.length === 1);
  t('apagar inexistente devolve nulo', s.apagar(12345) === null);
}
/* entrada fica negativa e não conta como gasto */
{
  const s = novo(); s.lancar({ ...base, tipo: 'entrada', valor: '250', cat: 'Outros', essencial: true });
  t('entrada tem valor negativo', s.st.lanc[0].valor === -250 && s.st.lanc[0].essencial === false);
  t('entrada não entra em gastosMes', s.gastosMes().length === 0 && s.doMes().length === 1);
}
/* descrição vazia usa a categoria */
{ const s = novo(); s.lancar({ ...base, desc: '   ' }); t('descrição vazia vira a categoria', s.st.lanc[0].desc === 'Mercado'); }

/* agregações do mês */
{
  const s = novo();
  s.lancar({ ...base, valor: '100', data: '2026-11-03' });
  s.lancar({ ...base, valor: '50', data: '2026-11-03', cat: 'Lazer', essencial: false, lazer: true });
  s.lancar({ ...base, valor: '30', data: '2026-11-10', cat: 'Comida', essencial: false, lazer: true });
  s.lancar({ ...base, valor: '70', data: '2026-10-20' });
  t('gastosMes só do mês', s.gastosMes().length === 3 && s.gastosMes('2026-10').length === 1);
  t('lazerGasto soma só lazer', s.lazerGasto() === 80);
  t('porCategoria exclui lazer', JSON.stringify(s.porCategoria()) === JSON.stringify({ Mercado: 100 }));
  t('porDia soma por dia', s.porDia()[3] === 150 && s.porDia()[10] === 30);
  t('buscar por texto', s.buscar('2026-11', 'comida').length === 1 && s.buscar('2026-11', 'PIX').length === 3 && s.buscar('2026-11', '').length === 3);
  t('buscar ordena do mais novo', s.buscar('2026-11', '')[0].data === '2026-11-10');
}

/* contas pagas */
{
  const s = novo(); const a = { id: 'a1', dia: 3 }, b = { id: 'a2', dia: 20 };
  t('conta passada vem como paga por padrão', s.estaPago(a, 5) === true && s.estaPago(b, 5) === false);
  s.marcarPago(b, true); t('marcar paga', s.estaPago(b, 5) === true);
  s.marcarPago(a, false); t('desmarcar paga, mesmo passada', s.estaPago(a, 5) === false);
  t('chave inclui o mês', s.chavePago(a) === 'a1@2026-11');
}

/* tetos */
{
  const s = novo(); t('teto válido', s.setTeto('Mercado', '700') === true && s.st.tetos.Mercado === 700);
  t('teto inválido', s.setTeto('Mercado', '-5') === false && s.st.tetos.Mercado === 700);
  t('teto zero é aceito (sem teto)', s.setTeto('Outros', '0') === true && s.st.tetos.Outros === 0);
}

/* metas */
{
  const m = mem(), s = novo(m);
  const bad = s.addMeta({ nome: '', alvo: '', prazo: '' });
  t('meta inválida traz os erros', bad.ok === false && bad.erros.nome && bad.erros.alvo && bad.erros.prazo);
  const r = s.addMeta({ nome: 'Viagem', alvo: '3000', guardado: '400', prazo: '2027-07', aporte: '280' });
  t('meta criada', r.ok && s.st.metas[0].alvo === 3000 && s.st.metas[0].guardado === 400 && s.st.metas[0].aporte === 280);
  t('persistência da meta (pergunta do dono)', novo(m).st.metas.length === 1 && novo(m).st.metas[0].nome === 'Viagem');
  t('setAporte', s.setAporte(r.id, '350') === true && s.st.metas[0].aporte === 350);
  t('setAporte inválido', s.setAporte(r.id, '-1') === false && s.setAporte(999, '5') === false);
  t('depositar soma', s.depositar(r.id, '100') === true && s.st.metas[0].guardado === 500);
  t('depositar inválido', s.depositar(r.id, '0') === false && s.depositar(999, '5') === false);
  t('depositar persiste', novo(m).st.metas[0].guardado === 500);
  t('remover meta', s.removerMeta(r.id) === true && s.st.metas.length === 0 && s.removerMeta(r.id) === false);
  t('taxa', s.setTaxa('1,2') === true && s.st.taxa === 1.2 && s.setTaxa('x') === false);
}

/* meus números */
{
  const m = mem(), s = novo(m);
  t('setNumeros válido', s.setNumeros({ mercado: '450', salario: '3.640,00', piso: '500' }).ok && s.st.numeros.mercado === 450 && s.st.numeros.salario === 3640 && s.st.numeros.piso === 500);
  t('setNumeros inválido não muda nada', s.setNumeros({ salario: '0' }).ok === false && s.st.numeros.salario === 3640);
  t('setNumeros vazio apaga o campo', s.setNumeros({ mercado: '' }).ok && s.st.numeros.mercado === undefined);
  t('repasse marcar e desmarcar', (s.marcarRepasse('2026-11', true), s.st.numeros.repasse['2026-11'] === true) && (s.marcarRepasse('2026-11', false), s.st.numeros.repasse['2026-11'] === undefined));
  s.setNumeros({ limites: { c2: '600' } });
  t('limite por cartão', s.st.numeros.limites.c2 === 600);
  t('persistência dos números', novo(m).st.numeros.salario === 3640 && novo(m).st.numeros.limites.c2 === 600);
}

/* modo e dados reais */
{
  const m = mem(), s = novo(m);
  t('importar arquivo inválido', s.importarReal({}).ok === false && s.st.modo === null);
  const fake = { _meta: { as_of: '2026-11-04' }, liquidez: { total: 100 }, cartao: { emissor: 'A', fechamento_dia: 3, fatura_atual: { total: 10, vence_em: '2026-11-10' } }, pendencias_novembro: [], gastos_fixos_mensais: { ajuda_em_casa_a_partir_de_dezembro: 1, faculdade_2026: 1, faculdade_2027_estimado: 1, assinaturas_no_cartao: {}, teto_lazer_mes: 1 }, faturas_futuras_parcelas_antigas: [], regras_e_metas: { meta_17_01_2027: 1, piso_17_01_2027: 1, alerta_dezembro: 1 }, entradas_esperadas: [] };
  t('importar arquivo válido', s.importarReal(fake).ok && s.st.modo === 'real');
  t('persistência do modo e dos dados', novo(m).st.modo === 'real' && novo(m).st.real !== null);
  s.definirModo('demo'); t('definirModo', novo(m).st.modo === 'demo');
}

/* sync */
{
  const s = novo(); s.lancar(base);
  const ps = s.paraSync(); t('paraSync sem real no modo exemplo', ps.real === undefined && ps.lanc.length === 1 && ps.numeros === undefined);
  s.aplicar({ lanc: [], pagos: {}, tetos: {}, metas: [], taxa: 0.8, numeros: { mercado: 1 } });
  t('aplicar troca o estado', s.st.lanc.length === 0 && s.st.numeros.mercado === 1);
  let avisos = 0; s.aoMudar(() => { avisos++; }); s.lancar(base); s.setTeto('Mercado', 5);
  t('aoMudar avisa a cada alteração', avisos === 2);
}

/* CSV */
{
  const s = novo();
  s.lancar({ ...base, valor: '13,07', desc: 'Uber, trabalho', cat: 'Transporte', data: '2026-11-04' });
  s.lancar({ ...base, valor: '10', desc: 'Café "bom"', cat: 'Comida', data: '2026-11-03', essencial: false, lazer: true });
  const csv = s.exportarCSV().split('\n');
  t('CSV cabeçalho no formato da planilha', csv[0] === 'data,descricao,categoria,valor,forma,essencial,mes,conta_no_lazer');
  t('CSV ordenado por data', csv[1].startsWith('2026-11-03') && csv[2].startsWith('2026-11-04'));
  t('CSV protege vírgula e aspas', csv[2].includes('"Uber, trabalho"') && csv[1].includes('"Café ""bom"""'));
  t('CSV valor com ponto e duas casas', csv[2].includes(',13.07,') && csv[1].endsWith(',2026-11,Sim'));
}

/* lançamento rápido por texto */
{
  const it = (x) => S.interpretarTexto(x, '2026-11-05');
  const a = it('45 mercado pix');
  t('texto: 45 mercado pix', a.ok && a.valor === 45 && a.cat === 'Mercado' && a.forma === 'Pix' && a.data === '2026-11-05' && a.tipo === 'gasto' && a.desc === 'Mercado');
  const b = it('13,07 uber ontem');
  t('texto: ontem e vírgula decimal', b.valor === 13.07 && b.cat === 'Transporte' && b.data === '2026-11-04' && b.desc === 'Uber');
  t('texto: anteontem atravessa o mês', S.interpretarTexto('10 mercado anteontem', '2026-11-01').data === '2026-10-30');
  const c = it('recebi 250 do tio');
  t('texto: entrada', c.tipo === 'entrada' && c.valor === 250 && c.desc === 'Do tio');
  const d = it('1.234,56 faculdade crédito');
  t('texto: milhar, estudos, crédito', d.valor === 1234.56 && d.cat === 'Estudos' && d.forma === 'Crédito');
  t('texto: pizza vira comida e número depois', it('pizza 30').cat === 'Comida' && it('pizza 30').valor === 30);
  t('texto: dia 3 usa o dia do mês atual', it('20 farmácia dia 3').data === '2026-11-03' && it('20 farmácia dia 3').valor === 20 && it('20 farmácia dia 3').cat === 'Saúde');
  t('texto: R$ e débito', it('R$ 8,50 padaria débito').valor === 8.5 && it('R$ 8,50 padaria débito').forma === 'Débito');
  t('texto vazio dá erro', it('').ok === false && it('   ').ok === false);
  t('texto sem valor dá erro', it('mercado').ok === false && /valor/.test(it('mercado').erro));
  t('texto sem categoria vira Outros', it('30 coisa qualquer').cat === 'Outros');
  const ok1 = S.validarLancamento({ tipo: 'gasto', valor: a.valor, cat: a.cat, data: a.data });
  t('o que o texto interpreta passa na validação', ok1.ok === true);
}

/* ---- ritmo do mês (centavos inteiros) ---- */
{
  const r = S.ritmoMes;
  t('ritmo: 310,00 em 10 dias de 30 projeta 930,00', r(310, 10, 30).projetadoCentavos === 93000 && r(310, 10, 30).projetado === 930);
  t('ritmo: 100 no dia 15 de 30 projeta 200', r(100, 15, 30).projetado === 200);
  t('ritmo: no último dia projeta o próprio gasto', r(777.77, 30, 30).projetadoCentavos === 77777);
  t('ritmo: arredonda em centavos, sem fração de centavo', Number.isInteger(r(100.01, 7, 31).projetadoCentavos) && r(100.01, 7, 31).projetadoCentavos === Math.round(10001 * 31 / 7));
  t('ritmo: 0,10 + 0,20 não vira 0,30000000000000004', r(0.1 + 0.2, 10, 30).projetadoCentavos === 90);
  t('ritmo: sem gasto marca semGasto e projeta zero', r(0, 12, 30).semGasto === true && r(0, 12, 30).projetado === 0);
  t('ritmo: poucos dados antes do dia 7', r(50, 6, 30).poucos === true && r(50, 7, 30).poucos === false);
  t('ritmo: limite mínimo configurável', r(50, 3, 30, 3).poucos === false && r(50, 2, 30, 3).poucos === true);
  t('ritmo: dia fora do intervalo não quebra', r(50, 0, 30).projetadoCentavos === 150000 && r(50, 40, 30).projetadoCentavos === 5000);
  t('ritmo: fevereiro bissexto usa 29 dias', r(290, 10, 29).projetado === 841);
  t('ritmo: entrada inválida vira zero', r(NaN, 10, 30).projetado === 0 && r(-5, 10, 30).semGasto === true);
  const loja = novo(); loja.lancar({ ...base, valor: '30', data: '2026-11-02' }); loja.lancar({ ...base, valor: '70,10', data: '2026-11-05' });
  const gasto = loja.gastosMes('2026-11').reduce((s, l) => s + l.valor, 0);
  t('ritmo: com lançamentos sintéticos bate com a fórmula', r(gasto, 5, 30).projetadoCentavos === Math.round(10010 * 30 / 5) && r(gasto, 5, 30).poucos === true);
  t('mês sem lançamento fica vazio', novo().doMes('2026-11').length === 0 && loja.doMes('2026-11').length === 2);
}

console.log(f ? f + ' falha(s)' : 'Todos os ' + ok + ' testes da camada de dados passaram.'); process.exit(f ? 1 : 0);
