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
  s.setNumeros({ limites: { c2: '777' } });
  t('limite por cartão', s.st.numeros.limites.c2 === 777);
  t('persistência dos números', novo(m).st.numeros.salario === 3640 && novo(m).st.numeros.limites.c2 === 777);
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
  /* acentos: \b do JavaScript não enxerga letra acentuada, então o texto é comparado sem acento */
  t('texto: ônibus e onibus dão a mesma categoria', it('30 ônibus').cat === 'Transporte' && it('30 onibus').cat === 'Transporte');
  t('texto: ônibus não fica em padrão de categoria', it('30 ônibus').padroes.indexOf('cat') < 0);
  t('texto: maiúsculas com acento', it('30 ÔNIBUS').cat === 'Transporte');
  t('texto: acento composto em dois caracteres', it('30 o\u0302nibus').cat === 'Transporte' && it('30 o\u0302nibus').valor === 30);
  t('texto: café no fim da palavra', it('12 café').cat === 'Comida' && it('12 cafe').cat === 'Comida');
  t('texto: almoço com e sem cedilha', it('25 almoço').cat === 'Comida' && it('25 almoco').cat === 'Comida');
  t('texto: remédio e farmácia', it('15 remédio').cat === 'Saúde' && it('15 remedio').cat === 'Saúde' && it('15 farmácia').cat === 'Saúde');
  t('texto: a descrição mantém o acento digitado', it('30 ônibus').desc === 'Ônibus');
  t('texto: forma com acento', it('30 ônibus débito').forma === 'Débito' && it('30 onibus debito').forma === 'Débito' && it('30 onibus cartão').forma === 'Crédito');
  /* quantidade: número seguido de pessoa, vezes, x ou unidade não é o valor */
  t('texto: 50 mercado para 2 pessoas', it('50 mercado para 2 pessoas').valor === 50 && it('50 mercado para 2 pessoas').cat === 'Mercado');
  t('texto: a quantidade fica na descrição', it('50 mercado para 2 pessoas').desc === 'Mercado para 2 pessoas');
  t('texto: pessoa no singular', it('20 almoço 1 pessoa').valor === 20);
  t('texto: pessoas antes do valor', it('2 pessoas jantar 80').valor === 80);
  t('texto: mesmo com valor sem centavos no meio', it('jantar 120 para 4 pessoas').valor === 120);
  t('texto: R$ continua vencendo', it('R$ 90 jantar 3 pessoas').valor === 90);
  t('texto: 3 vezes no cartão é parcela', it('300 tv 3 vezes cartão').valor === 300 && it('300 tv 3 vezes cartão').parcelas === 3);
  t('texto: 1 vez não vira valor', it('40 corte 1 vez').valor === 40 && it('40 corte 1 vez').parcelas === null);
  t('texto: vezes sem cartão não vira parcela', it('300 tv 3 vezes pix').valor === 300 && it('300 tv 3 vezes pix').parcelas === null);
  t('texto: só a quantidade não é valor', it('2 pessoas').ok === false);
  t('texto: palavra parecida não é quantidade', it('35 pessoal').valor === 35 && it('10 mercado 20 vezeiro').valor === 20);
  t('texto: anteontem atravessa o mês', S.interpretarTexto('10 mercado anteontem', '2026-11-01').data === '2026-10-30');
  const c = it('recebi 250 do cliente');
  t('texto: entrada', c.tipo === 'entrada' && c.valor === 250 && c.desc === 'Do cliente');
  const d = it('1.234,56 curso crédito');
  t('texto: milhar, estudos, crédito', d.valor === 1234.56 && d.cat === 'Estudos' && d.forma === 'Crédito');
  t('texto: pizza vira comida e número depois', it('pizza 30').cat === 'Comida' && it('pizza 30').valor === 30);
  t('texto: dia 3 usa o dia do mês atual', it('20 farmácia dia 3').data === '2026-11-03' && it('20 farmácia dia 3').valor === 20 && it('20 farmácia dia 3').cat === 'Saúde');
  t('texto: R$ e débito', it('R$ 8,50 padaria débito').valor === 8.5 && it('R$ 8,50 padaria débito').forma === 'Débito');
  t('texto vazio dá erro', it('').ok === false && it('   ').ok === false);
  t('texto sem valor dá erro', it('mercado').ok === false && /valor/.test(it('mercado').erro));
  t('texto sem categoria vira Outros', it('30 coisa qualquer').cat === 'Outros');
  const ok1 = S.validarLancamento({ tipo: 'gasto', valor: a.valor, cat: a.cat, data: a.data });
  t('o que o texto interpreta passa na validação', ok1.ok === true);

  /* parser: valores em pt-BR, quantidade e unidade não são o valor, parcelas, padrões expostos */
  t('parser: "1.200 aluguel" é 1200 (milhar pt-BR)', it('1.200 aluguel').valor === 1200);
  t('parser: "1.200" sozinho é 1200', it('1.200').valor === 1200);
  t('parser: "1.200.000 casa" é 1200000', it('1.200.000 casa').valor === 1200000);
  t('parser: "1.200,50 aluguel" é 1200.50', it('1.200,50 aluguel').valor === 1200.5);
  t('parser: "12.06 uber" continua 12.06', it('12.06 uber').valor === 12.06);
  t('parser: "ssd 1tb 450" é 450', it('ssd 1tb 450').valor === 450);
  t('parser: "ssd 1 tb 450" é 450 (unidade separada)', it('ssd 1 tb 450').valor === 450);
  t('parser: "arroz 5kg 27,90" é 27.90', it('arroz 5kg 27,90').valor === 27.9);
  t('parser: "leite 200ml 6" é 6', it('leite 200ml 6').valor === 6);
  t('parser: "pilha 4 un 18" é 18', it('pilha 4 un 18').valor === 18);
  t('parser: "2 pães 12,50" é 12.50 (quantidade na frente)', it('2 pães 12,50').valor === 12.5);
  t('parser: "2 pizzas 40" é 40 (último número solto)', it('2 pizzas 40').valor === 40);
  t('parser: a quantidade e a unidade ficam na descrição', it('2 pães 12,50').desc === '2 pães' && it('ssd 1tb 450').desc === 'Ssd 1tb');
  t('parser: R$ marca o valor mesmo com outro número depois', it('R$ 30 presente 2 amigos').valor === 30);
  t('parser: só unidade não é valor', it('ssd 1tb').ok === false && /valor/.test(it('ssd 1tb').erro));
  t('parser: número colado em palavra não é valor', it('ps5 2000').valor === 2000 && it('ps5').ok === false);
  t('parser: "3x 49,90 tênis cartão" é 49.90 em 3 parcelas', it('3x 49,90 tênis cartão').valor === 49.9 && it('3x 49,90 tênis cartão').parcelas === 3 && it('3x 49,90 tênis cartão').forma === 'Crédito');
  t('parser: "49,90 tênis 3x crédito" também', it('49,90 tênis 3x crédito').parcelas === 3 && it('49,90 tênis 3x crédito').valor === 49.9);
  t('parser: "3 x 49,90 cartão" com espaço', it('3 x 49,90 cartão').parcelas === 3 && it('3 x 49,90 cartão').valor === 49.9);
  t('parser: sem cartão, "3x" é ignorado com segurança', it('3x 49,90 tênis').valor === 49.9 && it('3x 49,90 tênis').parcelas === null && it('3x 49,90 tênis').forma === 'Pix');
  t('parser: "3x" nunca vira o valor', it('3x').ok === false && it('3x cartão').ok === false);
  t('parser: "3x" sai da descrição', !/3x/i.test(it('3x 49,90 tênis cartão').desc) && !/3x/i.test(it('3x 49,90 tênis').desc));
  t('parser: "1x" não é parcelamento', it('1x 30 cartão').parcelas === null && it('1x 30 cartão').valor === 30);
  t('parser: entrada não tem parcelas', it('recebi 3x 100 cartão').parcelas === null);
  t('parser: sem "3x" as parcelas ficam nulas', it('45 mercado crédito').parcelas === null);
  t('parser: expõe que Pix foi aplicado por padrão', it('45 mercado').padroes.join() === 'forma' && it('45 mercado').forma === 'Pix');
  t('parser: expõe que Outros foi aplicado por padrão', it('30 coisa pix').padroes.join() === 'cat' && it('30 coisa pix').cat === 'Outros');
  t('parser: expõe os dois padrões juntos', it('30 coisa').padroes.join() === 'forma,cat');
  t('parser: sem padrão quando tudo foi dito', it('45 mercado pix').padroes.length === 0);
  t('parser: "dia 3" continua não sendo o valor', it('20 farmácia dia 3').valor === 20 && it('dia 3 farmácia 20').valor === 20);
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


/* ---- primeiro uso: três números, por dia, modos separados ---- */
{
  const dados = { renda: '5000', fixos: '3000', saldo: '1500' };
  t('início: aceita os três números', S.validarInicio(dados).ok === true);
  t('início: aceita aproximado com vírgula', S.validarInicio({ renda: '4.500,50', fixos: '2.000', saldo: '0' }).valores.renda === 4500.5 && S.validarInicio({ renda: '4.500,50', fixos: '2.000', saldo: '0' }).valores.fixos === 2000);
  t('início: renda é obrigatória', S.validarInicio({ renda: '', fixos: '100', saldo: '10' }).ok === false && !!S.validarInicio({ renda: '', fixos: '100', saldo: '10' }).erros.renda);
  t('início: gastos fixos são obrigatórios (zero vale)', !!S.validarInicio({ renda: '100', fixos: '', saldo: '10' }).erros.fixos && S.validarInicio({ renda: '100', fixos: '0', saldo: '10' }).ok === true);
  t('início: saldo é obrigatório (zero e negativo valem)', !!S.validarInicio({ renda: '100', fixos: '1', saldo: '' }).erros.saldo && S.validarInicio({ renda: '100', fixos: '1', saldo: '-50' }).ok === true);
  const loja = novo();
  const r = loja.comecar(dados);
  t('início: comecar entra em modo real', r.ok === true && loja.st.modo === 'real');
  t('início: guarda os números informados', loja.st.real._inicio.renda === 5000 && loja.st.real._inicio.fixos === 3000 && loja.st.real._inicio.saldo === 1500);
  t('início: o saldo vira a liquidez', loja.st.real.liquidez.total === 1500);
  t('início: passa pela validação da importação', loja.st.real._meta.as_of === '2026-11-05');
  t('início: número inválido não muda nada', novo().comecar({ renda: 'x', fixos: '1', saldo: '1' }).ok === false);
  const ed = loja.atualizarInicio({ renda: '5200', fixos: '3100', saldo: '900' });
  t('início: dá para editar depois', ed.ok === true && loja.st.real._inicio.renda === 5200 && loja.st.real.liquidez.total === 900);
  const c1 = loja.atualizarCartao({ limite: '2000', fatura: '350,50', fechamento: '7', vencimento: '15' });
  t('cartão: grava limite, fatura e dias', c1.ok === true && loja.st.real.cartao.limite === 2000 && loja.st.real.cartao.fatura_atual.total === 350.5 && loja.st.real.cartao.fechamento_dia === 7 && /-15$/.test(loja.st.real.cartao.fatura_atual.vence_em));
  t('cartão: limite é obrigatório', loja.atualizarCartao({ limite: '', fatura: '1', fechamento: '7', vencimento: '15' }).ok === false);
  t('cartão: dia fora do mês é recusado', loja.atualizarCartao({ limite: '100', fatura: '1', fechamento: '40', vencimento: '15' }).ok === false);
  const c2 = loja.addConta({ nome: 'Internet', valor: '99,90', dia: '10' });
  t('conta: entra na lista do mês', c2.ok === true && loja.st.real.pendencias_novembro.length === 1 && loja.st.real.pendencias_novembro[0].valor === 99.9 && loja.st.real.pendencias_novembro[0].vence === '2026-11-10');
  t('conta: nome e valor são obrigatórios', loja.addConta({ nome: '', valor: '1', dia: '1' }).ok === false && loja.addConta({ nome: 'x', valor: '', dia: '1' }).ok === false);
  t('conta: sem dados reais não grava', novo().addConta({ nome: 'x', valor: '1', dia: '1' }).ok === false);
}
{
  const d = S.porDia;
  t('por dia: 2000 livres em 30 dias, dia 1', d(5000, 3000, 0, 1, 30).porDiaCentavos === 6666 && d(5000, 3000, 0, 1, 30).porDia === 66.66);
  t('por dia: desconta o gasto do mês e usa os dias que faltam', d(5000, 3000, 500, 16, 30).porDiaCentavos === 10000 && d(5000, 3000, 500, 16, 30).diasRestantes === 15);
  t('por dia: no último dia conta o dia de hoje', d(5000, 3000, 1900, 30, 30).porDiaCentavos === 10000 && d(5000, 3000, 1900, 30, 30).diasRestantes === 1);
  t('por dia: arredonda para baixo (nunca promete a mais)', d(100, 0, 0, 1, 3).porDiaCentavos === 3333);
  t('por dia: gasto acima da sobra dá zero e mostra quanto passou', d(5000, 3000, 2500, 10, 30).porDia === 0 && d(5000, 3000, 2500, 10, 30).resta === -500);
  t('por dia: fixos maiores que a renda dão zero', d(1000, 3000, 0, 1, 30).porDia === 0 && d(1000, 3000, 0, 1, 30).livre === -2000);
  t('por dia: 0,10 + 0,20 não gera fração de centavo', Number.isInteger(d(0.1 + 0.2, 0, 0, 1, 7).porDiaCentavos));
}
{
  const mapa = () => { const o = {}; return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, _o: o }; };
  const arm = mapa();
  const real = S.criarStore(S.armazenamentoDoModo(arm), () => HOJE);
  real.comecar({ renda: '5000', fixos: '3000', saldo: '1500' });
  real.lancar({ ...base, desc: 'Gasto real' });
  t('modos: dados reais ficam nas chaves normais', JSON.parse(arm.getItem('tf_lanc3')).length === 1);
  real.definirModo('demo');
  t('modos: entrar no exemplo só muda o modo', JSON.parse(arm.getItem('tf_modo')) === 'demo');
  const ex = S.criarStore(S.armazenamentoDoModo(arm), () => HOJE);
  t('modos: o exemplo não enxerga os dados reais', ex.st.lanc.length === 0 && ex.st.real === null && ex.st.modo === 'demo');
  ex.lancar({ ...base, desc: 'Gasto de exemplo' });
  t('modos: gravar no exemplo não toca nos dados reais', JSON.parse(arm.getItem('tf_lanc3')).length === 1 && JSON.parse(arm.getItem('tf_lanc3'))[0].desc === 'Gasto real');
  ex.definirModo('real');
  const volta = S.criarStore(S.armazenamentoDoModo(arm), () => HOJE);
  t('modos: voltar ao real traz só os dados reais', volta.st.lanc.length === 1 && volta.st.lanc[0].desc === 'Gasto real' && volta.st.real._inicio.renda === 5000);
  volta.definirModo('demo');
  const ex2 = S.criarStore(S.armazenamentoDoModo(arm), () => HOJE);
  t('modos: o exemplo mantém o que era dele', ex2.st.lanc.length === 1 && ex2.st.lanc[0].desc === 'Gasto de exemplo');
}
{
  const p = S.plataforma;
  const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
  const IOS_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1';
  const AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';
  const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
  t('plataforma: iPhone no Safari', p(IOS, false) === 'ios');
  t('plataforma: iPhone em outro navegador precisa abrir no Safari', p(IOS_CHROME, false) === 'ios-outro');
  t('plataforma: Android', p(AND, false) === 'android');
  t('plataforma: computador', p(PC, false) === 'computador');
  t('plataforma: já instalado', p(IOS, true) === 'instalado' && p(AND, true) === 'instalado');
}

console.log(f ? f + ' falha(s)' : 'Todos os ' + ok + ' testes da camada de dados passaram.'); process.exit(f ? 1 : 0);
