/* Taxas do Banco Central (SGS): leitura, cache, limites de busca, cálculo do % do CDI e tela de Investimento.
   Só valores inventados, fetch simulado, nunca a rede. */
const fs = require('fs'), { execFileSync } = require('child_process');
const T = require('./taxas.js');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('taxas do Banco Central');
const quase = (a, b, e) => Math.abs(a - b) < (e || 1e-12);

/* datas fixas para a parte pura */
const AGORA = new Date('2026-11-07T12:00:00').getTime(), HOJE = '2026-11-07';
const resp = (corpo, ok = true) => ({ ok, json: async () => corpo });
const linhas = (pares) => pares.map(([d, v]) => ({ data: d, valor: v }));
const memSt = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), _m: m }; };
const quebrado = () => ({ getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } });
const FIXO = { 4389: '14.90', 432: '15.00', 13522: '4.68' };
const URL432 = (ini, fim) => 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=' + ini + '&dataFinal=' + fim;
const URLS3 = ['https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/10?formato=json', URL432('08/10/2026', '07/11/2026'), 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/10?formato=json'];
/* datas "DD/MM/AAAA" e linhas diárias em ordem crescente, como o SGS devolve */
const br = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
const deBr = x => { const [d, m, a] = x.split('/').map(Number); return new Date(a, m - 1, d); };
const diarias = (ini, fim, valor) => { const out = []; for (let d = deBr(ini); d <= deBr(fim); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push({ data: br(d), valor }); return out; };
/* 432 como na API ao vivo: ultimos/N só datas futuras (calendário do Copom); período, só datas passadas, até a véspera de dataFinal */
const FUTURAS432 = diarias('10/12/2026', '29/12/2026', '14.75');
const resp432 = u => { const m = /dataInicial=(\d{2}\/\d{2}\/\d{4})&dataFinal=(\d{2}\/\d{2}\/\d{4})$/.exec(u); if (!m) return FUTURAS432; const f = deBr(m[2]); return diarias(m[1], br(new Date(f.getFullYear(), f.getMonth(), f.getDate() - 1)), '15.00'); };
const okFetch = (log) => async (u, o) => { log && log.push([u, o]); const s = +u.match(/sgs\.(\d+)\//)[1]; return resp(s === 432 ? resp432(u) : linhas([['01/10/2026', FIXO[s]], ['06/11/2026', FIXO[s]]])); };

(async () => {
  /* 1. endereço */
  t('url: série e quantidade', T.url(4389, 10) === 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/10?formato=json');
  t('url: no máximo 20', /ultimos\/20\?/.test(T.url(4389, 99)) && /ultimos\/1\?/.test(T.url(12, 0)));
  t('séries pedidas', Object.values(T.SERIES).sort((a, b) => a - b).join() === '432,4389,13522');
  t('endereço 432: período de 30 dias até hoje, data local de agora', T.endereco(432, AGORA) === URL432('08/10/2026', '07/11/2026'));
  t('endereço 432: virada de ano, 03/01', T.endereco(432, new Date('2027-01-03T10:00:00').getTime()) === URL432('04/12/2026', '03/01/2027'));
  t('endereço 432: virada de mês com dia e mês de um dígito', T.endereco(432, new Date('2026-03-01T08:00:00').getTime()) === URL432('30/01/2026', '01/03/2026'));
  t('endereço 432: perto da meia-noite vale a data local, não a UTC', T.endereco(432, new Date('2026-11-07T23:30:00').getTime()) === URL432('08/10/2026', '07/11/2026'));
  t('endereço 432: barras literais, sem codificar, sem ultimos', !/%2F/i.test(T.endereco(432, AGORA)) && !/ultimos/.test(T.endereco(432, AGORA)) && (T.endereco(432, AGORA).match(/\//g) || []).length === 10);
  t('endereço 4389 e 13522: continuam ultimos/10', T.endereco(4389, AGORA) === 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/10?formato=json' && T.endereco(13522, AGORA) === 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/10?formato=json');

  /* 2. leitura estrita */
  t('data: válida', T.data('06/11/2026') === '2026-11-06');
  ['31/02/2026', '2026-11-06', '6/11/2026', '06/13/2026', '', null, 20261106, '00/11/2026'].forEach(d => t('data: recusa ' + JSON.stringify(d), T.data(d) === null));
  const lidas = T.ler([{ data: '06/11/2026', valor: '14.90' }, { data: '31/02/2026', valor: '1' }, { data: '06/11/2026', valor: '1,5' }, { data: '06/11/2026', valor: '101' }, { data: '06/11/2026', valor: '-1' },
    { data: '06/11/2026', valor: 'NaN' }, { data: '06/11/2026', valor: 'Infinity' }, { data: '06/11/2026', valor: 14.9 }, { data: '06/11/2026' }, null, 'x', { data: '05/11/2026', valor: '0' }, { data: '04/11/2026', valor: '100' }]);
  t('leitura: só as linhas válidas ficam', JSON.stringify(lidas) === JSON.stringify([{ data: '2026-11-06', valor: 14.9 }, { data: '2026-11-05', valor: 0 }, { data: '2026-11-04', valor: 100 }]));
  [null, undefined, 'texto', 42, {}, { length: 2 }].forEach(x => { let ok = true; try { ok = Array.isArray(T.ler(x)) && T.ler(x).length === 0; } catch (e) { ok = false; } t('leitura: não lança com ' + String(x), ok); });

  /* 3. 432 com data futura: a mais recente até hoje, nunca a última */
  const s432 = T.ler(linhas([['05/11/2026', '15.00'], ['06/11/2026', '15.00'], ['10/12/2026', '14.75']]));
  t('432: ignora a data futura', JSON.stringify(T.escolher(s432, HOJE)) === JSON.stringify({ data: '2026-11-06', valor: 15 }));
  t('432: só datas futuras dá nada', T.escolher(T.ler(linhas([['10/12/2026', '14.75']])), HOJE) === null);
  t('IPCA atrasado: guarda a própria data de referência', T.escolher(T.ler(linhas([['01/09/2026', '4.70'], ['01/10/2026', '4.68']])), HOJE).data === '2026-10-01');

  /* 3b. faixa por série: IPCA 12 meses aceita de -50 a 100 (deflação); taxas de 0 a 100 */
  const ipcaNeg = T.ler(linhas([['01/09/2026', '0.10'], ['01/10/2026', '-0.25']]), 13522);
  t('IPCA negativo: a linha é aceita', ipcaNeg.length === 2 && ipcaNeg[1].valor === -0.25);
  t('IPCA negativo: é escolhida como a mais recente', JSON.stringify(T.escolher(ipcaNeg, HOJE)) === JSON.stringify({ data: '2026-10-01', valor: -0.25 }));
  t('IPCA: -50 aceito, abaixo de -50 e acima de 100 descartados', JSON.stringify(T.ler(linhas([['01/08/2026', '-50'], ['01/09/2026', '-50.01'], ['01/10/2026', '100.5']]), 13522)) === JSON.stringify([{ data: '2026-08-01', valor: -50 }]));
  const bNeg = await T.buscar(13522, { fetch: async () => resp(linhas([['01/09/2026', '0.10'], ['01/10/2026', '-0.25']])), agora: AGORA });
  t('busca IPCA: valor negativo mais recente vem com a própria data', bNeg.ok && bNeg.valor === -0.25 && bNeg.dataRef === '2026-10-01');
  [4389, 432].forEach(sr => {
    const lin = T.ler(linhas([['01/10/2026', '14.00'], ['06/11/2026', '-0.50']]), sr);
    t('taxa negativa na série ' + sr + ': descartada', lin.length === 1 && lin[0].valor === 14);
  });
  t('433 saiu da lista: não tem mais faixa própria (negativo descartado)', T.ler(linhas([['01/10/2026', '-0.25']]), 433).length === 0);
  t('sem série: faixa das taxas (negativo descartado)', T.ler(linhas([['01/10/2026', '-0.25']])).length === 0);
  const cacheDe = (o) => ({ getItem: () => JSON.stringify(o) });
  const cNeg = T.lerCache(cacheDe({ 13522: { valor: -0.3, dataRef: '2026-10-01', fetchedAt: AGORA } }));
  t('cache: IPCA negativo é lido de volta', cNeg[13522] && cNeg[13522].valor === -0.3 && cNeg[13522].dataRef === '2026-10-01');
  t('cache: IPCA abaixo de -50 é recusado', !T.lerCache(cacheDe({ 13522: { valor: -50.5, dataRef: '2026-10-01', fetchedAt: AGORA } }))[13522]);
  const cTaxaNeg = T.lerCache(cacheDe({ 4389: { valor: -1, dataRef: '2026-11-06', fetchedAt: AGORA }, 432: { valor: -0.5, dataRef: '2026-11-06', fetchedAt: AGORA } }));
  t('cache: taxa negativa é recusada', Object.keys(cTaxaNeg).length === 0);

  /* 4. uma busca */
  const log = [];
  const b1 = await T.buscar(4389, { fetch: okFetch(log), agora: AGORA });
  t('busca: valor e data', b1.ok && b1.valor === 14.9 && b1.dataRef === '2026-11-06');
  const [u1, o1] = log[0];
  t('busca: GET sem cookie, sem referrer e com sinal de cancelamento', o1.method === 'GET' && o1.credentials === 'omit' && o1.referrerPolicy === 'no-referrer' && !!o1.signal && u1.startsWith('https://api.bcb.gov.br/'));
  t('busca: nenhum cabeçalho próprio (sem preflight)', !('headers' in o1) && !/headers\s*:/.test(fs.readFileSync('taxas.js', 'utf8')));
  const b432 = await T.buscar(432, { fetch: okFetch(), agora: AGORA });
  t('busca 432: data até hoje', b432.ok && b432.dataRef === '2026-11-06' && b432.valor === 15);
  const log432 = []; await T.buscar(432, { fetch: okFetch(log432), agora: AGORA });
  t('busca 432: pede o período, com as mesmas regras (GET, sem cookie, sem referrer, sem cabeçalho, sem corpo)', log432.length === 1 && log432[0][0] === URL432('08/10/2026', '07/11/2026') && log432[0][1].method === 'GET' && log432[0][1].credentials === 'omit' && log432[0][1].referrerPolicy === 'no-referrer' && !('headers' in log432[0][1]) && !('body' in log432[0][1]) && !!log432[0][1].signal);
  const periodo = await T.buscar(432, { fetch: async () => resp(diarias('08/10/2026', '07/11/2026', '15.00')), agora: AGORA });
  t('busca 432: período com linhas passadas em ordem crescente, fica a de hoje', periodo.ok && periodo.dataRef === '2026-11-07' && periodo.valor === 15);
  /* o defeito visto na API ao vivo: só datas futuras */
  const soFuturas = await T.buscar(432, { fetch: async () => resp(FUTURAS432), agora: AGORA });
  t('busca 432: resposta só com datas futuras dá erro vazio', soFuturas.ok === false && soFuturas.erro === 'vazio' && FUTURAS432.length === 20);
  T._memoria.tentativa = 0;
  const stFut = memSt(), fetchFut = async (u) => resp(+u.match(/sgs\.(\d+)\//)[1] === 432 ? FUTURAS432 : linhas([['06/11/2026', FIXO[+u.match(/sgs\.(\d+)\//)[1]]]]));
  const rFut = await T.atualizar({ fetch: fetchFut, storage: stFut, sessao: memSt(), agora: AGORA });
  const cFut = JSON.parse(stFut.getItem('tf_taxas'));
  t('só datas futuras na 432: nenhuma entrada 432 no cache (as outras duas gravadas)', rFut.novas === 2 && !(432 in cFut) && !!cFut[4389] && !!cFut[13522]);
  t('só datas futuras na 432: o cache continua precisando de busca', T.precisa(T.lerCache(stFut), AGORA) === true);
  /* com o período, a 432 entra no cache e a próxima abertura em menos de 6 h não pede nada */
  T._memoria.tentativa = 0;
  const stPer = memSt(), pedPer = [];
  const rPer = await T.atualizar({ fetch: okFetch(pedPer), storage: stPer, sessao: memSt(), agora: AGORA });
  const cPer = JSON.parse(stPer.getItem('tf_taxas'));
  t('período na 432: entra no cache com a data da linha passada', rPer.novas === 3 && cPer[432] && cPer[432].valor === 15 && cPer[432].dataRef === '2026-11-06' && cPer[432].fetchedAt === AGORA);
  t('período na 432: as 3 séries ficam em dia (precisa falso)', T.precisa(T.lerCache(stPer), AGORA + 5 * 3600000) === false);
  T._memoria.tentativa = 0; pedPer.length = 0;
  const rPer2 = await T.atualizar({ fetch: okFetch(pedPer), storage: stPer, sessao: memSt(), agora: AGORA + 5 * 3600000 });
  t('período na 432: abrir de novo em 5 h, sessão nova, nenhum pedido', !rPer2.buscou && rPer2.motivo === 'recente' && pedPer.length === 0);
  t('busca: só linhas ruins vira vazio', (await T.buscar(12, { fetch: async () => resp([{ data: 'x', valor: 'y' }]), agora: AGORA })).erro === 'vazio');
  t('busca: resposta que não é lista', (await T.buscar(12, { fetch: async () => resp({ erro: 1 }), agora: AGORA })).erro === 'formato');
  t('busca: JSON quebrado', (await T.buscar(12, { fetch: async () => ({ ok: true, json: async () => { throw new SyntaxError('x'); } }), agora: AGORA })).erro === 'formato');
  t('busca: status de erro', (await T.buscar(12, { fetch: async () => resp([], false), agora: AGORA })).erro === 'rede');
  let n = 0;
  const cors = await T.buscar(12, { fetch: async () => { n++; throw new TypeError('Failed to fetch'); }, agora: AGORA });
  t('busca: CORS ou rede caída vira rede, sem nova tentativa', cors.ok === false && cors.erro === 'rede' && n === 1);
  t('busca: fetch que lança na hora', (await T.buscar(12, { fetch: () => { throw new Error('x'); }, agora: AGORA })).erro === 'rede');
  t('busca: sem fetch', (await T.buscar(12, { agora: AGORA })).erro === 'rede');
  let sinal = null, n2 = 0;
  const t0 = Date.now(), lenta = await T.buscar(12, { fetch: (u, o) => { n2++; sinal = o.signal; return new Promise(() => {}); }, agora: AGORA, tempo: 60 });
  t('busca: tempo esgotado', lenta.erro === 'tempo' && Date.now() - t0 < 2000 && n2 === 1);
  t('busca: cancela o pedido no tempo', sinal && sinal.aborted === true);
  t('busca: tempo padrão de 8 s', T.TEMPO === 8000);

  /* 5. cache, validade de 6 h e limite de 15 min */
  T._memoria.tentativa = 0;
  const st = memSt(), se = memSt(), chamadas = [];
  const a1 = await T.atualizar({ fetch: okFetch(chamadas), storage: st, sessao: se, agora: AGORA });
  const c1 = JSON.parse(st.getItem('tf_taxas'));
  t('atualizar: sem cache busca as 3 séries, uma vez cada', a1.buscou && chamadas.length === 3 && new Set(chamadas.map(c => c[0])).size === 3);
  t('atualizar: grava valor, data e hora da consulta', c1[4389].valor === 14.9 && c1[4389].dataRef === '2026-11-06' && c1[4389].fetchedAt === AGORA && !!c1[432] && c1[432].dataRef === '2026-11-06' && c1[13522].dataRef === '2026-11-06');
  chamadas.length = 0; T._memoria.tentativa = 0;
  const a2 = await T.atualizar({ fetch: okFetch(chamadas), storage: st, sessao: memSt(), agora: AGORA + 5 * 3600000 });
  t('atualizar: cache de 5 h não busca', !a2.buscou && a2.motivo === 'recente' && chamadas.length === 0);
  const a3 = await T.atualizar({ fetch: okFetch(chamadas), storage: st, sessao: se, agora: AGORA + 6 * 3600000 + 1000 });
  t('atualizar: passou de 6 h busca de novo', a3.buscou && chamadas.length === 3);
  chamadas.length = 0;
  const a4 = await T.atualizar({ fetch: okFetch(chamadas), storage: memSt(), sessao: se, agora: AGORA + 6 * 3600000 + 1000 + 14 * 60000 });
  t('atualizar: no máximo uma vez a cada 15 min na sessão', !a4.buscou && a4.motivo === 'intervalo' && chamadas.length === 0);
  const a5 = await T.atualizar({ fetch: okFetch(chamadas), storage: memSt(), sessao: se, agora: AGORA + 6 * 3600000 + 1000 + 16 * 60000 });
  t('atualizar: depois de 15 min pode buscar', a5.buscou && chamadas.length === 3);

  /* 5b. três séries: endereços exatos, cache antigo de 6 entradas, 432 faltando */
  T._memoria.tentativa = 0;
  const ped3 = []; await T.atualizar({ fetch: okFetch(ped3), storage: memSt(), sessao: memSt(), agora: AGORA });
  t('atualizar: os 3 endereços são exatamente os esperados', JSON.stringify(ped3.map(([u]) => u).sort()) === JSON.stringify(URLS3));
  T._memoria.tentativa = 0;
  const fresca = (valor, dataRef) => ({ valor, dataRef, fetchedAt: AGORA - 3600000 });
  const antigo = memSt(); antigo.setItem('tf_taxas', JSON.stringify({ 12: { valor: 0.05, dataRef: '2026-11-06', fetchedAt: AGORA - 10 * 86400000 }, 4389: fresca(14.9, '2026-11-06'), 4391: { valor: 0.79, dataRef: '2026-10-01', fetchedAt: AGORA - 10 * 86400000 }, 432: fresca(15, '2026-11-06'), 433: { valor: -0.2, dataRef: '2026-10-01', fetchedAt: AGORA - 10 * 86400000 }, 13522: fresca(4.68, '2026-10-01') }));
  let lidoAntigo, okAntigo = true; try { lidoAntigo = T.lerCache(antigo); } catch (e) { okAntigo = false; }
  t('cache antigo de 6 entradas: lido sem erro, só as 3 séries atuais', okAntigo && Object.keys(lidoAntigo).sort((a, b) => a - b).join() === '432,4389,13522');
  const pedAntigo = []; let rAntigo, okAt = true;
  try { rAntigo = await T.atualizar({ fetch: okFetch(pedAntigo), storage: antigo, sessao: memSt(), agora: AGORA }); } catch (e) { okAt = false; }
  t('cache antigo de 6 entradas com as 3 atuais novas: não busca (as séries removidas, velhas, não contam)', okAt && !rAntigo.buscou && rAntigo.motivo === 'recente' && pedAntigo.length === 0);
  T._memoria.tentativa = 0;
  const sem432 = memSt(); sem432.setItem('tf_taxas', JSON.stringify({ 4389: fresca(14.9, '2026-11-06'), 13522: fresca(4.68, '2026-10-01') }));
  const ped432 = []; const r432 = await T.atualizar({ fetch: okFetch(ped432), storage: sem432, sessao: memSt(), agora: AGORA });
  t('432 faltando no cache: dispara a busca, 3 pedidos', r432.buscou && ped432.length === 3 && (JSON.parse(sem432.getItem('tf_taxas'))[432] || {}).dataRef === '2026-11-06');
  T._memoria.tentativa = 0;
  const antigoSem432 = memSt(); antigoSem432.setItem('tf_taxas', JSON.stringify({ 12: fresca(0.05, '2026-11-06'), 4389: fresca(14.9, '2026-11-06'), 4391: fresca(0.79, '2026-10-01'), 433: fresca(0.09, '2026-10-01'), 13522: fresca(4.68, '2026-10-01') }));
  await T.atualizar({ fetch: okFetch(), storage: antigoSem432, sessao: memSt(), agora: AGORA });
  t('cache antigo regravado depois da busca: só as 3 séries atuais', Object.keys(JSON.parse(antigoSem432.getItem('tf_taxas'))).sort((a, b) => a - b).join() === '432,4389,13522');

  /* sem rede: fica o cache, com a data de referência */
  T._memoria.tentativa = 0;
  const velho = memSt(); velho.setItem('tf_taxas', JSON.stringify({ 4389: { valor: 14.15, dataRef: '2026-11-03', fetchedAt: AGORA - 3 * 86400000 } }));
  const off = await T.atualizar({ fetch: async () => { throw new TypeError('offline'); }, storage: velho, sessao: memSt(), agora: AGORA });
  t('sem rede com cache: cache intacto', off.buscou && off.novas === 0 && JSON.parse(velho.getItem('tf_taxas'))[4389].valor === 14.15 && off.cache[4389].dataRef === '2026-11-03');
  t('sem rede com cache: rótulo com a data de referência', 'CDI de ' + T.diaMes(off.cache[4389].dataRef) === 'CDI de 03/11');
  T._memoria.tentativa = 0;
  const vazio = memSt(), off2 = await T.atualizar({ fetch: async () => { throw new TypeError('offline'); }, storage: vazio, sessao: memSt(), agora: AGORA });
  t('sem rede sem cache: nada gravado, nada inventado', off2.novas === 0 && vazio.getItem('tf_taxas') === null && Object.keys(off2.cache).length === 0);

  /* armazenamento que lança */
  T._memoria.tentativa = 0;
  let r6, ok6 = true; try { r6 = await T.atualizar({ fetch: okFetch(), storage: quebrado(), sessao: quebrado(), agora: AGORA }); } catch (e) { ok6 = false; }
  t('armazenamento que lança: não quebra e devolve as taxas em memória', ok6 && r6.buscou && r6.cache[4389].valor === 14.9);
  const r7 = await T.atualizar({ fetch: okFetch(), storage: quebrado(), sessao: quebrado(), agora: AGORA + 60000 });
  t('armazenamento que lança: o limite de 15 min vale pela página', !r7.buscou && r7.motivo === 'intervalo');
  t('cache: lixo é ignorado', Object.keys(T.lerCache({ getItem: () => '{"4389":{"valor":"14","dataRef":"x","fetchedAt":1},"432":{"valor":500,"dataRef":"2026-11-06","fetchedAt":1}}' })).length === 0);
  t('cache: JSON quebrado', Object.keys(T.lerCache({ getItem: () => '{' })).length === 0);
  t('cache: gravar com armazenamento quebrado devolve falso', T.gravarCache(quebrado(), {}) === false);

  /* 6. % do CDI para taxa mensal, contra contas feitas à mão */
  const CDI2 = (Math.pow(1.02, 12) - 1) * 100;   // 26,8241794562545% ao ano equivale a 2% ao mês
  t('CDI: 100% de 26,8241794562545% a.a. = 2% a.m.', quase(T.mensalDeCdi(CDI2, 100), 0.02));
  t('CDI: 50% do mesmo CDI = 1% a.m.', quase(T.mensalDeCdi(CDI2, 50), 0.01));
  t('CDI: 100% de 12% a.a. = 0,948879293458305% a.m.', quase(T.mensalDeCdi(12, 100), 0.00948879293458305));
  t('CDI: 110% de 12% a.a. = 1,04376722280413% a.m.', quase(T.mensalDeCdi(12, 110), 0.0104376722280413));
  t('CDI: 0% do CDI = 0', T.mensalDeCdi(14.9, 0) === 0);
  t('CDI: entrada inválida dá nulo', T.mensalDeCdi(NaN, 100) === null && T.mensalDeCdi(10, -5) === null);

  /* 7. CSP: exatamente um host novo, e só em connect-src */
  const csp = h => (h.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1].split(';').map(x => x.trim()).filter(Boolean);
  const antes = csp(execFileSync('git', ['show', '6edb737:index.html']).toString('utf8')), agora = csp(fs.readFileSync('index.html', 'utf8'));
  const dir = (l, n) => (l.find(x => x.startsWith(n + ' ')) || '').split(/\s+/).slice(1);
  const novos = dir(agora, 'connect-src').filter(h => !dir(antes, 'connect-src').includes(h));
  t('CSP: um host novo, api.bcb.gov.br', novos.length === 1 && novos[0] === 'https://api.bcb.gov.br');
  t('CSP: nenhum host saiu de connect-src', dir(antes, 'connect-src').every(h => dir(agora, 'connect-src').includes(h)));
  t('CSP: as outras diretivas não mudaram', JSON.stringify(antes.filter(x => !x.startsWith('connect-src '))) === JSON.stringify(agora.filter(x => !x.startsWith('connect-src '))));
  t('CSP: o host aparece uma vez no index', (fs.readFileSync('index.html', 'utf8').match(/api\.bcb\.gov\.br/g) || []).length === 1);
  const sw = fs.readFileSync('sw.js', 'utf8');
  t('sw: taxas.js no casco e cache tf-v31', /'taxas\.js'/.test(sw) && /const V = 'tf-v31'/.test(sw));
  t('sw: só guarda GET da própria origem', /e\.request\.method !== 'GET' \|\| u\.origin !== location\.origin\) return/.test(sw) && !/bcb/.test(sw));

  /* 8. tela: Decidir com calma > Investimento. Busca só quando Investimento aparece, só no modo real. */
  const hojeR = new Date(), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ontem = iso(new Date(hojeR.getTime() - 86400000)), mesPassado = iso(new Date(hojeR.getFullYear(), hojeR.getMonth() - 1, 1)), mesHoje = iso(hojeR).slice(0, 7);
  const CACHE = (idade) => ({ 4389: { valor: 14.9, dataRef: ontem, fetchedAt: Date.now() - (idade || 0) }, 13522: { valor: 4.68, dataRef: mesPassado, fetchedAt: Date.now() - (idade || 0) } });
  const REALFX = () => { const r = JSON.parse(JSON.stringify(FICTICIO)); r._meta.as_of = mesHoje + '-01'; return r; };
  const TOKEN = 'token-inventado-drive-123';
  const REAL = (extra) => ({ tf_modo: 'real', tf_real: REALFX(), ...(extra || {}) });
  const LOGADO = () => ({ tf_gtoken: { v: TOKEN, exp: Date.now() + 3600000 }, tf_gjaconectou: true, tf_gtry: Date.now() });
  const semIds = h => { [...h.matchAll(/data-ch="([^"]+)"/g)].forEach(m => { h = h.split(m[1]).join('ch'); }); return h; };   // id de gráfico é sorteado a cada desenho
  const inv = async A => { await A.ir('decidir'); A.click('#ctab_inv'); await tick(40); };
  const semRede = () => Promise.reject(new TypeError('Failed to fetch'));
  const ehBcb = u => /^https:\/\/api\.bcb\.gov\.br\//.test(String(u));
  const urlsHoje = () => { const h = new Date(); return ['https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/10?formato=json', URL432(br(new Date(h.getFullYear(), h.getMonth(), h.getDate() - 30)), br(h)), 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/10?formato=json']; };
  /* registra todo pedido; o Banco Central responde com dados inventados; o resto falha como sem rede */
  const grava = (lista) => async (u, o) => { lista.push([String(u), o || {}]); if (!ehBcb(u)) throw new TypeError('sem rede no teste'); const s = +String(u).match(/sgs\.(\d+)\//)[1]; return resp(linhas([[ontem.split('-').reverse().join('/'), FIXO[s]]])); };
  const bcb = l => l.filter(([u]) => ehBcb(u));

  /* opção deste aparelho "Buscar taxas online", padrão desligado */
  const ON = { tf_taxas_online: true };
  const falha = (lista) => async (u, o) => { lista.push([String(u), o || {}]); throw new TypeError('Failed to fetch'); };
  const dm = ms => T.dataBR(ms).slice(0, 5);
  const camposManuais = A => A.$$('#calcbox input,#calcbox select').filter(e => e.id !== 'i_online').map(e => e.id + '=' + (e.type === 'checkbox' ? e.checked : e.value)).join();
  const MANUAIS = 'i_0=1000,i_m=200,i_i=0.85,i_i_t=m,i_n=36,i_f=4.5,i_ir=true';   // os campos e valores de 6edb737

  /* ao abrir: nenhum pedido ao Banco Central, em nenhum modo, com a opção ligada ou não */
  for (const [nome, ini] of [['real', REAL()], ['real com Drive', REAL(LOGADO())], ['real, opção ligada', REAL(ON)], ['real com Drive, opção ligada', REAL({ ...LOGADO(), ...ON })],
    ['exemplo', { tf_modo: 'demo' }], ['exemplo, opção ligada', { tf_modo: 'demo', ...ON }], ['boas-vindas', {}], ['boas-vindas, opção ligada', { ...ON }]]) {
    const l = []; const A = await abrir(ini, { fetch: grava(l) }); await tick(60);
    t('ao abrir (' + nome + '): nenhum pedido ao Banco Central', bcb(l).length === 0);
    if (nome.startsWith('boas-vindas')) { t(nome + ': nenhum pedido ao Banco Central', bcb(l).length === 0 && !!A.$('#ini_ok')); continue; }
    await A.ir('hoje'); await A.ir('lancar'); await A.ir('futuro'); await A.ir('decidir'); await tick(30);
    t('outras telas e Decidir sem Investimento (' + nome + '): nenhum pedido', bcb(l).length === 0);
  }

  /* exemplo: abrir Investimento não busca, não usa cache e não mostra a opção, mesmo ligada */
  for (const [nome, ini] of [['exemplo', { tf_modo: 'demo', tf_taxas: CACHE() }], ['exemplo com a opção ligada', { tf_modo: 'demo', tf_taxas: CACHE(), ...ON }]]) {
    const l = []; const A = await abrir(ini, { fetch: grava(l) }); await tick(30); await inv(A); await tick(40);
    t(nome + ': Investimento não chama o Banco Central', bcb(l).length === 0);
    t(nome + ': Investimento igual a hoje, mesmo com cache, sem a opção', !A.$('#i_modo') && !A.$('#i_fonte') && !A.$('#i_online') && !A.$('#i_status') && camposManuais(A) === MANUAIS);
  }

  /* padrão: opção desligada, nada gravado */
  { const A = await abrir(REAL(), { fetch: semRede }); await tick(30); await inv(A);
    t('padrão: opção aparece desligada', !!A.$('#i_online') && A.$('#i_online').checked === false && A.ls('tf_taxas_online') === null);
    t('padrão: texto de ajuda da opção', A.texto().includes('Buscar taxas online (Banco Central)') && A.texto().includes('Só as taxas públicas são pedidas; nada seu é enviado.'));
    t('desligado e sem cache: situação "Desligado: use suas taxas"', A.$('#i_status').textContent === 'Desligado: use suas taxas'); }

  /* ligar a opção na tela: busca na hora e redesenha o formulário com as taxas que chegaram */
  { const l = []; const A = await abrir(REAL(), { fetch: grava(l) }); await tick(30); await inv(A); await tick(30);
    t('ligar na tela: antes, nenhum pedido', bcb(l).length === 0);
    A.click('#i_online'); await tick(60);
    t('ligar na tela: uma busca, opção gravada só neste aparelho', bcb(l).length === 3 && A.ls('tf_taxas_online') === true);
    t('ligar na tela: formulário redesenhado com o modo e a situação nova', !!A.$('#i_modo') && A.$('#i_online').checked === true && A.$('#i_status').textContent === 'Taxas do Banco Central de ' + dm(Date.now()));
    t('ligar na tela: sem erros', A.erros.length === 0, A.erros.join(' | ')); }

  /* opção DESLIGADA: zero pedidos ao Banco Central, com e sem Drive */
  for (const [nome, ini] of [['sem Drive', REAL()], ['com Drive', REAL(LOGADO())], ['com Drive e cache velho', REAL({ ...LOGADO(), tf_taxas: CACHE(3 * 86400000) })]]) {
    const l = []; const A = await abrir(ini, { fetch: grava(l) }); await tick(40); await inv(A); await tick(60);
    A.click('#ctab_emp'); await tick(10); A.click('#ctab_inv'); await tick(30); await A.ir('hoje'); await inv(A); await tick(40);
    t('opção desligada (' + nome + '): zero pedidos ao Banco Central', bcb(l).length === 0);
    if (nome !== 'sem Drive') t('opção desligada (' + nome + '): o fetch simulado estava ativo (pedidos ao Drive registrados)', l.length > 0, l.length + ' pedidos');
    else t('opção desligada (sem Drive): nenhum pedido a nenhum host', l.length === 0);
  }

  /* opção LIGADA, com Drive: abrir Investimento faz uma busca (uma rodada: 3 pedidos, um por série) sem nenhuma credencial */
  const l1 = []; const A1 = await abrir(REAL({ ...LOGADO(), ...ON }), { fetch: grava(l1) }); await tick(40);
  t('opção ligada: antes de abrir Investimento, nenhum pedido', bcb(l1).length === 0);
  await inv(A1); await tick(60);
  const p1 = bcb(l1);
  t('opção ligada: abrir Investimento faz uma busca, 3 pedidos, um por série, sem repetir', p1.length === 3 && new Set(p1.map(([u]) => u.match(/sgs\.(\d+)\//)[1])).size === 3 && p1.every(([u]) => /^https:\/\/api\.bcb\.gov\.br\/dados\/serie\/bcdata\.sgs\.\d+\/dados(\/ultimos\/\d+\?formato=json|\?formato=json&dataInicial=\d{2}\/\d{2}\/\d{4}&dataFinal=\d{2}\/\d{2}\/\d{4})$/.test(u)));
  t('opção ligada: os 3 endereços são exatamente os esperados', JSON.stringify(p1.map(([u]) => u).sort()) === JSON.stringify(urlsHoje()));
  t('opção ligada: situação "Taxas do Banco Central de DD/MM"', A1.$('#i_status').textContent === 'Taxas do Banco Central de ' + dm(Date.now()) && A1.$('#i_online').checked === true);
  t('sem credencial: credentials omit e referrer desligado', p1.every(([, o]) => o.credentials === 'omit' && o.referrerPolicy === 'no-referrer'));
  t('sem credencial: nenhum cabeçalho, nenhum corpo', p1.every(([, o]) => !('headers' in o) && !('body' in o)));
  t('sem credencial: o token do Drive nunca vai ao Banco Central', p1.every(([u, o]) => !u.includes(TOKEN) && !JSON.stringify(o).includes(TOKEN) && !/authorization/i.test(JSON.stringify(o))));
  const outros = l1.filter(([u]) => !ehBcb(u));
  t('os outros pedidos continuam com o token do Drive', outros.length > 0 && outros.every(([, o]) => JSON.stringify((o && o.headers) || {}).includes(TOKEN)), outros.length + ' pedidos');
  t('real: cache gravado e formulário com o modo', A1.ls('tf_taxas') && A1.ls('tf_taxas')[4389].valor === 14.9 && !!A1.$('#i_modo'));
  A1.click('#ctab_emp'); await tick(10); A1.click('#ctab_inv'); await tick(30); await A1.ir('hoje'); await inv(A1);
  t('real: voltar ao Investimento com cache novo não busca de novo', bcb(l1).length === 3);
  /* desligar para as buscas: sem cache e sem limite de 15 min, abrir Investimento de novo não pede nada */
  A1.click('#i_online'); await tick(10);
  t('desligar: opção apagada do aparelho', A1.$('#i_online').checked === false && A1.ls('tf_taxas_online') === null);
  A1.w.localStorage.removeItem('tf_taxas'); A1.w.sessionStorage.removeItem('tf_taxas_tentativa'); A1.w.eval('TFTaxas._memoria.tentativa=0');
  A1.click('#ctab_emp'); await tick(10); A1.click('#ctab_inv'); await tick(30); await A1.ir('hoje'); await inv(A1); await tick(60);
  t('desligar: nenhum pedido novo ao Banco Central', bcb(l1).length === 3);
  A1.click('#i_online'); await tick(60);
  t('religar: a mesma situação volta a buscar (prova que o teste acima não é vazio)', bcb(l1).length === 6 && A1.ls('tf_taxas_online') === true);
  t('real: sem erros', A1.erros.length === 0, A1.erros.join(' | '));

  /* opção ligada, busca falha, cache velho: usa o cache com a data, nunca apaga a calculadora */
  { const l = [], velho = Date.now() - 3 * 86400000; const A = await abrir(REAL({ tf_taxas: CACHE(3 * 86400000), ...ON }), { fetch: falha(l) }); await tick(30); await inv(A); await tick(60);
    t('busca falhou: tentou uma vez, sem nova tentativa', bcb(l).length === 3);
    t('busca falhou: situação "Sem conexão: usando as de DD/MM"', A.$('#i_status').textContent === 'Sem conexão: usando as de ' + dm(velho));
    t('busca falhou: calculadora continua com as taxas guardadas', !!A.$('#i_modo') && A.$('#i_f').value === '4.68' && !!A.$('#out .big') && A.ls('tf_taxas')[4389].valor === 14.9);
    A.set('#i_modo', 'cdi'); await tick(10);
    t('busca falhou: % do CDI usa o CDI guardado, com a data', A.$('#i_pct_h').textContent.includes('CDI de ' + T.diaMes(ontem)));
    t('busca falhou: sem erros', A.erros.length === 0, A.erros.join(' | ')); }

  /* opção ligada, aparelho sem conexão: nenhum pedido, usa o cache com a data */
  { const l = [], velho = Date.now() - 3 * 86400000; const A = await abrir(REAL({ tf_taxas: CACHE(3 * 86400000), ...ON }), { fetch: grava(l), antes: w => Object.defineProperty(w.navigator, 'onLine', { value: false, configurable: true }) }); await tick(30); await inv(A); await tick(60);
    t('sem conexão: nenhum pedido ao Banco Central', bcb(l).length === 0);
    t('sem conexão: situação "Sem conexão: usando as de DD/MM" e as taxas guardadas', A.$('#i_status').textContent === 'Sem conexão: usando as de ' + dm(velho) && A.$('#i_f').value === '4.68'); }

  /* opção ligada, busca falha, sem cache nenhum: os campos manuais exatamente como hoje */
  { const l = []; const A = await abrir(REAL(ON), { fetch: falha(l) }); await tick(30); await inv(A); await tick(60);
    t('sem cache e busca falhou: campos manuais como hoje', camposManuais(A) === MANUAIS && !A.$('#i_modo') && !A.$('#i_fonte'));
    t('sem cache e busca falhou: situação "Sem conexão: use suas taxas"', A.$('#i_status').textContent === 'Sem conexão: use suas taxas'); }

  /* opção desligada com cache: usa o cache, com a data */
  { const A = await abrir(REAL({ tf_taxas: CACHE() }), { fetch: semRede }); await tick(30); await inv(A);
    t('desligado com cache recente: "Taxas do Banco Central de DD/MM"', A.$('#i_status').textContent === 'Taxas do Banco Central de ' + dm(Date.now())); }
  { const A = await abrir(REAL({ tf_taxas: CACHE(3 * 86400000) }), { fetch: semRede }); await tick(30); await inv(A);
    t('desligado com cache velho: "Desligado: usando as de DD/MM"', A.$('#i_status').textContent === 'Desligado: usando as de ' + dm(Date.now() - 3 * 86400000)); }

  /* a opção nunca vai ao Drive: os dados enviados não a contêm, e ligar ou desligar não sincroniza */
  { const l = [], corpos = [];
    const drive = async (u, o) => { u = String(u); o = o || {}; l.push([u, o]);
      if (ehBcb(u)) return grava([])(u, o);
      if (o.method === 'PATCH') { corpos.push(String(o.body)); return { ok: true, status: 200, json: async () => ({}), text: async () => '' }; }
      if (/alt=media/.test(u)) return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
      return { ok: true, status: 200, json: async () => ({ files: [] }), text: async () => '{}' }; };
    const A = await abrir(REAL({ ...LOGADO(), ...ON, tf_gfile: 'arquivoTeste1' }), { fetch: drive }); await tick(30);
    await A.w.eval('sincronizar()'); await tick(60);
    t('Drive: houve envio de dados no teste', corpos.length > 0, corpos.length + ' envios');
    t('Drive: a opção não está nos dados enviados', corpos.every(c => !/taxas_online|tf_taxas|"online"/.test(c)));
    t('Drive: os dados de sincronia não têm a opção nem o cache de taxas', !/taxas_online|tf_taxas/.test(JSON.stringify(A.w.eval('S.paraSync()'))) && !/taxas_online|tf_taxas/.test(JSON.stringify(A.ls('tf_items'))));
    const antes = corpos.length, pedidosAntes = l.filter(([u]) => !ehBcb(u)).length;
    await inv(A); A.click('#i_online'); await tick(10); A.click('#i_online'); await tick(2000);
    t('Drive: ligar e desligar a opção não dispara sincronia', corpos.length === antes && l.filter(([u]) => !ehBcb(u)).length === pedidosAntes);
    t('Drive: sem erros', A.erros.length === 0, A.erros.join(' | ')); }

  /* sem cache e sem rede: igual a hoje */
  const A0 = await abrir(REAL(), { fetch: semRede }); await tick(30); await inv(A0);
  t('sem cache e sem rede: sem modo, sem fonte, inflação 4,5', !A0.$('#i_modo') && !A0.$('#i_fonte') && A0.$('#i_f').value === '4.5' && !!A0.$('#i_i'));
  t('sem cache e sem rede: campos manuais exatamente como em 6edb737', camposManuais(A0) === MANUAIS);
  const html0 = semIds(A0.$('#calcbox').innerHTML);
  t('sem cache e sem rede: sem erros', A0.erros.length === 0, A0.erros.join(' | '));

  /* com cache recente: modo, inflação preenchida e fonte */
  const A2 = await abrir(REAL({ tf_taxas: CACHE() }), { fetch: semRede }); await tick(30); await inv(A2);
  t('com cache: modo começa em taxa ao mês', A2.$('#i_modo') && A2.$('#i_modo').value === 'taxa' && !!A2.$('#i_i') && !A2.$('#i_pct'));
  t('com cache: inflação do IPCA 12 meses, com data', A2.$('#i_f').value === '4.68' && A2.texto().includes('IPCA de 12 meses até ' + mesPassado.slice(5, 7) + '/' + mesPassado.slice(0, 4)));
  const dataConsulta = T.dataBR(Date.now());
  t('com cache: fonte com a série e a data', A2.$('#i_fonte') && A2.$('#i_fonte').textContent === 'Fonte: Banco Central do Brasil (SGS), série 13522, consulta em ' + dataConsulta);
  A2.set('#i_0', '5000'); A2.set('#i_m', '300');
  A2.set('#i_modo', 'cdi'); await tick(10);
  t('% do CDI: campo aparece com 100', A2.$('#i_pct') && A2.$('#i_pct').value === '100' && !A2.$('#i_i'));
  t('% do CDI: trocar o modo mantém o resto', A2.$('#i_0').value === '5000' && A2.$('#i_m').value === '300' && A2.$('#i_f').value === '4.68');
  t('% do CDI: estimativa com o CDI e a data, sem o símbolo ≈', A2.$('#i_pct_h').textContent.startsWith('Cerca de ') && A2.$('#i_pct_h').textContent.includes('CDI de ' + T.diaMes(ontem)) && /a confirmar/.test(A2.$('#i_pct_h').textContent) && !A2.$('#i_pct_h').textContent.includes('≈'));
  t('% do CDI: fonte com as duas séries', A2.$('#i_fonte').textContent === 'Fonte: Banco Central do Brasil (SGS), séries 4389 e 13522, consulta em ' + dataConsulta);
  A2.set('#i_pct', '110');
  const esperado = A2.w.eval("Calc.investimento(5000,300,TFTaxas.mensalDeCdi(14.9,110),36,true,4.68).liquido");
  t('% do CDI: resultado usa a taxa mensal do CDI', A2.$('#out .big').textContent === A2.w.eval('brl0(' + esperado + ')'));
  A2.set('#i_f', '6');
  t('inflação digitada vence: some a série 13522 da fonte', A2.$('#i_fonte').textContent === 'Fonte: Banco Central do Brasil (SGS), série 4389, consulta em ' + dataConsulta);
  A2.click('#ctab_emp'); await tick(10); A2.click('#ctab_inv'); await tick(10);
  t('inflação digitada vence: continua depois de trocar de calculadora', A2.$('#i_f').value === '6' && !A2.texto().includes('IPCA de 12 meses até'));
  A2.set('#i_modo', 'taxa'); await tick(10);
  t('volta para taxa ao mês: campo antigo de volta', !!A2.$('#i_i') && !A2.$('#i_pct'));
  t('com cache: sem erros', A2.erros.length === 0, A2.erros.join(' | '));

  /* sem rede com cache velho: usa o cache, com a data */
  const A3 = await abrir(REAL({ tf_taxas: CACHE(3 * 86400000) }), { fetch: semRede }); await tick(30); await inv(A3);
  A3.set('#i_modo', 'cdi'); await tick(10);
  t('sem rede com cache velho: usa o cache e mostra a data', A3.$('#i_pct_h').textContent.includes('CDI de ' + T.diaMes(ontem)) && A3.ls('tf_taxas')[4389].valor === 14.9);

  /* armazenamento que lança: Investimento continua como hoje */
  const A4 = await abrir(REAL(), { fetch: semRede }); await tick(30);
  A4.w.eval("Storage.prototype.getItem=function(){throw new Error('bloqueado')}; Storage.prototype.setItem=function(){throw new Error('bloqueado')};");
  let ok4 = true; try { await inv(A4); } catch (e) { ok4 = false; }
  t('armazenamento que lança: Investimento abre como hoje', ok4 && !A4.$('#i_modo') && A4.$('#i_f').value === '4.5');

  /* nenhuma outra tela muda com taxas no cache */
  const TELAS = ['hoje', 'lancar', 'cartao', 'agenda', 'orcamento', 'metas', 'futuro', 'decidir', 'saude', 'numeros'];
  const B0 = await abrir(REAL(), { fetch: semRede }), B1 = await abrir(REAL({ tf_taxas: CACHE() }), { fetch: semRede }); await tick(30);
  for (const k of TELAS) { await B0.ir(k); await B1.ir(k); t('outras telas iguais com e sem taxas: ' + k, semIds(B0.$('main').innerHTML) === semIds(B1.$('main').innerHTML)); }
  t('Investimento sem taxas: HTML idêntico ao das outras aberturas', html0 === (await (async () => { const C = await abrir(REAL(), { fetch: semRede }); await tick(30); await inv(C); return semIds(C.$('#calcbox').innerHTML); })()));

  /* service worker nunca busca nem guarda taxa */
  t('service worker: nenhuma menção ao Banco Central', !/bcb/i.test(fs.readFileSync('sw.js', 'utf8')));

  /* conteúdo vindo da rede nunca vira HTML */
  const app = fs.readFileSync('app.js', 'utf8'), blocoInv = app.slice(app.indexOf(' inv:{ form:'), app.indexOf('function bindAbasCalc'));
  t('tela: textos de taxa passam por esc() ou textContent', /esc\('IPCA de 12 meses/.test(blocoInv) && /esc\('Fonte: Banco Central/.test(blocoInv) && /i_pct_h'\)\.textContent=/.test(blocoInv) && /esc\(textoStatus\(\)\)/.test(blocoInv) && /s\.textContent=textoStatus\(\)/.test(app));

  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
